from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Chemical(Base):
    __tablename__ = "chemicals"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    state = Column(String(50), nullable=False)  # gas, liquid, solid
    properties = Column(JSONB, default={})  # density, boiling point, etc.
    
    release_events = relationship("ReleaseEvent", back_populates="chemical")
    
    def __repr__(self):
        return f"<Chemical(id={self.id}, name={self.name}, state={self.state})>"

class ReleaseEvent(Base):
    __tablename__ = "release_events"
    
    id = Column(Integer, primary_key=True, index=True)
    chemical_id = Column(Integer, ForeignKey("chemicals.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # instantaneous, continuous, puff
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    time = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    amount = Column(Float, nullable=False)  # quantity released (g or kg)
    heat = Column(Float, nullable=True)  # buoyancy flux (if applicable)
    terrain = Column(String(255), nullable=True)  # terrain description
    
    chemical = relationship("Chemical", back_populates="release_events")
    
    __table_args__ = (
        Index('idx_time_location', 'time'),
    )
    
    def __repr__(self):
        return f"<ReleaseEvent(id={self.id}, type={self.type}, time={self.time})>"

class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    data = Column(JSONB, nullable=False)  # API response or parsed weather data
    
    __table_args__ = (
        Index('idx_timestamp_desc', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<WeatherData(id={self.id}, timestamp={self.timestamp})>"

class WeatherStation(Base):
    __tablename__ = "weather_stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    provider = Column(String(50), default='open-meteo', nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f"<WeatherStation(id={self.id}, name={self.name}, lat={self.lat}, lon={self.lon})>"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event = Column(String(255), nullable=False, index=True)
    details = Column(JSONB, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_event_timestamp', 'event', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, event={self.event}, timestamp={self.timestamp})>"