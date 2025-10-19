from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Chemical(Base):
    __tablename__ = "chemicals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    state = Column(String, nullable=False)  # gas, liquid, solid
    properties = Column(JSONB)  # density, boiling point, etc.

class ReleaseEvent(Base):
    __tablename__ = "release_events"
    id = Column(Integer, primary_key=True, index=True)
    chemical_id = Column(Integer, ForeignKey("chemicals.id"))
    type = Column(String)  # instantaneous, continuous, puff
    location = Column(Geometry("POINT", srid=4326))
    time = Column(DateTime, default=datetime.datetime.utcnow)
    amount = Column(Float)
    heat = Column(Float)
    terrain = Column(String)
    chemical = relationship("Chemical")

class WeatherData(Base):
    __tablename__ = "weather_data"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    data = Column(JSONB)


class WeatherStation(Base):
    __tablename__ = "weather_stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    provider = Column(String, default='open-meteo')

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    event = Column(String)
    details = Column(JSONB)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
