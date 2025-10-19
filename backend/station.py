import asyncio
from typing import List
from database import SessionLocal
from models import WeatherStation, WeatherData
from weather import fetch_open_meteo, fetch_noaa_weather
import datetime

POLL_INTERVAL = 300  # seconds

async def poll_station(station: WeatherStation):
    # lightweight fetch based on provider
    if station.provider == 'open-meteo':
        data = await fetch_open_meteo(station.lat, station.lon)
    else:
        data = await fetch_noaa_weather(station.lat, station.lon)
    # store in DB
    db = SessionLocal()
    try:
        entry = WeatherData(timestamp=datetime.datetime.utcnow(), data=data)
        db.add(entry)
        await db.commit()
    finally:
        await db.close()

async def poll_loop():
    while True:
        db = SessionLocal()
        try:
            stations = await db.execute('SELECT id, name, lat, lon, provider FROM weather_stations')
            rows = stations.fetchall()
            for r in rows:
                st = WeatherStation(id=r[0], name=r[1], lat=r[2], lon=r[3], provider=r[4])
                await poll_station(st)
        finally:
            await db.close()
        await asyncio.sleep(POLL_INTERVAL)
*** End Patch