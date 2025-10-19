import asyncio
import datetime
from typing import AsyncGenerator

from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError

from plume import gaussian_plume, pasquill_gifford_sigmas
from weather import fetch_noaa_weather, fetch_open_meteo
from database import SessionLocal
from models import WeatherData, WeatherStation

load_dotenv()

app = FastAPI(title="Dispersion Modeling API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Request/response models
class PlumeRequest(BaseModel):
    x: float = Field(..., gt=0, description="Downwind distance (m)")
    y: float = Field(..., description="Crosswind distance (m)")
    z: float = Field(..., ge=0, description="Height (m)")
    Q: float = Field(..., gt=0, description="Emission rate (g/s)")
    u: float = Field(..., gt=0, description="Wind speed (m/s)")
    H: float = Field(..., ge=0, description="Effective stack height (m)")
    sy: float = Field(..., gt=0, description="Lateral dispersion parameter (m)")
    sz: float = Field(..., gt=0, description="Vertical dispersion parameter (m)")
    terrain_height: float = Field(0.0, description="Terrain height difference (m)")
    terrain_gradient: float = Field(0.0, description="Terrain slope (radians)")
    building_height: float = Field(0.0, ge=0, description="Building height (m)")

class PuffRequest(PlumeRequest):
    t: float = Field(..., gt=0, description="Time since release (s)")

class InstantaneousRequest(BaseModel):
    x: float = Field(..., gt=0, description="Downwind distance (m)")
    y: float = Field(..., description="Crosswind distance (m)")
    z: float = Field(..., ge=0, description="Height (m)")
    Q: float = Field(..., gt=0, description="Total amount released (g)")
    u: float = Field(..., gt=0, description="Wind speed (m/s)")
    H: float = Field(..., ge=0, description="Effective stack height (m)")
    stability: str = Field(..., description="Pasquill-Gifford stability class (A-F)")
    terrain_height: float = Field(0.0, description="Terrain height difference (m)")
    terrain_gradient: float = Field(0.0, description="Terrain slope (radians)")
    building_height: float = Field(0.0, ge=0, description="Building height (m)")

class ConcentrationResponse(BaseModel):
    concentration: float = Field(..., description="Concentration (µg/m³)")
    units: str = "µg/m³"

class WeatherResponse(BaseModel):
    timestamp: datetime.datetime
    data: dict

class StationResponse(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    provider: str

# Helper to extract wind speed from various weather APIs
def extract_wind_speed(weather_data: dict) -> float | None:
    """Try common wind speed keys from various weather APIs."""
    if not isinstance(weather_data, dict):
        return None
    
    keys = ("windspeed_10m", "wind_speed", "wind_speed_kph", "windSpeed", "speed")
    for key in keys:
        try:
            val = weather_data.get(key)
            if val is not None:
                return float(val)
        except (TypeError, ValueError):
            continue
    return None

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"message": "Dispersion Modeling API running", "version": "1.0.0"}

# Modeling endpoints
@app.post("/model/plume", response_model=ConcentrationResponse, tags=["Modeling"])
async def model_plume(
    req: PlumeRequest,
    use_weather: bool = Query(False, description="Use latest stored weather data"),
    db: AsyncSession = Depends(get_db)
):
    """Calculate Gaussian plume concentration at a point."""
    u = req.u
    
    if use_weather:
        try:
            result = await db.execute(
                select(WeatherData).order_by(WeatherData.timestamp.desc()).limit(1)
            )
            latest = result.scalars().first()
            if latest and latest.data:
                wind_speed = extract_wind_speed(latest.data)
                if wind_speed is not None:
                    u = wind_speed
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Weather fetch error: {str(e)}")
    
    try:
        c = gaussian_plume(
            req.x, req.y, req.z, req.Q, u, req.H, req.sy, req.sz,
            terrain_height=req.terrain_height,
            terrain_gradient=req.terrain_gradient,
            building_height=req.building_height
        )
        return ConcentrationResponse(concentration=max(0, c))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

@app.post("/model/puff", response_model=ConcentrationResponse, tags=["Modeling"])
async def model_puff(
    req: PuffRequest,
    use_weather: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Calculate Gaussian puff concentration at a point."""
    u = req.u
    
    if use_weather:
        try:
            result = await db.execute(
                select(WeatherData).order_by(WeatherData.timestamp.desc()).limit(1)
            )
            latest = result.scalars().first()
            if latest and latest.data:
                wind_speed = extract_wind_speed(latest.data)
                if wind_speed is not None:
                    u = wind_speed
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Weather fetch error: {str(e)}")
    
    try:
        c = gaussian_plume(
            req.x, req.y, req.z, req.Q, u, req.H, req.sy, req.sz,
            terrain_height=req.terrain_height,
            terrain_gradient=req.terrain_gradient,
            building_height=req.building_height
        )
        return ConcentrationResponse(concentration=max(0, c))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

@app.post("/model/instantaneous", response_model=ConcentrationResponse, tags=["Modeling"])
async def model_instantaneous(
    req: InstantaneousRequest,
    use_weather: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Calculate instantaneous release concentration using Pasquill-Gifford parameters."""
    stability = req.stability.upper()
    if stability not in ['A', 'B', 'C', 'D', 'E', 'F']:
        raise HTTPException(status_code=400, detail="Stability must be A-F")
    
    u = req.u
    
    if use_weather:
        try:
            result = await db.execute(
                select(WeatherData).order_by(WeatherData.timestamp.desc()).limit(1)
            )
            latest = result.scalars().first()
            if latest and latest.data:
                wind_speed = extract_wind_speed(latest.data)
                if wind_speed is not None:
                    u = wind_speed
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Weather fetch error: {str(e)}")
    
    try:
        sy, sz = pasquill_gifford_sigmas(req.x, stability)
        c = gaussian_plume(
            req.x, req.y, req.z, req.Q, u, req.H, sy, sz,
            terrain_height=req.terrain_height,
            terrain_gradient=req.terrain_gradient,
            building_height=req.building_height
        )
        return ConcentrationResponse(concentration=max(0, c))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

# Weather fetch endpoints
@app.get("/weather/noaa", tags=["Weather"])
async def get_noaa_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    """Fetch NOAA weather data for coordinates."""
    try:
        data = await fetch_noaa_weather(lat, lon)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NOAA API error: {str(e)}")

@app.get("/weather/open-meteo", tags=["Weather"])
async def get_open_meteo(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    """Fetch Open-Meteo weather data for coordinates."""
    try:
        data = await fetch_open_meteo(lat, lon)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Open-Meteo API error: {str(e)}")

# Weather storage endpoints
@app.post("/weather/store", tags=["Weather"])
async def store_weather(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Store weather data in database."""
    if not data:
        raise HTTPException(status_code=400, detail="Weather data cannot be empty")
    
    try:
        entry = WeatherData(timestamp=datetime.datetime.utcnow(), data=data)
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return {"id": entry.id, "timestamp": entry.timestamp}
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/weather/latest", response_model=WeatherResponse, tags=["Weather"])
async def get_latest_weather(db: AsyncSession = Depends(get_db)):
    """Get latest stored weather data."""
    try:
        result = await db.execute(
            select(WeatherData).order_by(WeatherData.timestamp.desc()).limit(1)
        )
        latest = result.scalars().first()
        if not latest:
            raise HTTPException(status_code=404, detail="No weather data found")
        return WeatherResponse(timestamp=latest.timestamp, data=latest.data)
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Stations endpoints
@app.post("/stations", response_model=StationResponse, tags=["Stations"])
async def register_station(
    name: str = Query(..., min_length=1),
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    provider: str = Query("open-meteo", enum=["open-meteo", "noaa"]),
    db: AsyncSession = Depends(get_db)
):
    """Register a new weather station."""
    try:
        station = WeatherStation(name=name, lat=lat, lon=lon, provider=provider)
        db.add(station)
        await db.commit()
        await db.refresh(station)
        return StationResponse(
            id=station.id, name=station.name, lat=station.lat, 
            lon=station.lon, provider=station.provider
        )
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/stations", response_model=list[StationResponse], tags=["Stations"])
async def list_stations(db: AsyncSession = Depends(get_db)):
    """List all registered weather stations."""
    try:
        result = await db.execute(select(WeatherStation))
        rows = result.scalars().all()
        return [
            StationResponse(
                id=r.id, name=r.name, lat=r.lat, lon=r.lon, provider=r.provider
            )
            for r in rows
        ]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Background poller
from station import poll_loop

@app.on_event("startup")
async def startup_event():
    """Start background weather polling on app startup."""
    asyncio.create_task(poll_loop())