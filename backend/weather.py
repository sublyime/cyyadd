import httpx
from datetime import datetime

# NOAA Weather.gov API fetch (point forecast)
async def fetch_noaa_weather(lat, lon):
    url = f"https://api.weather.gov/points/{lat},{lon}"
    async with httpx.AsyncClient() as client:
        meta = await client.get(url)
        meta.raise_for_status()
        forecast_url = meta.json()["properties"]["forecastHourly"]
        resp = await client.get(forecast_url)
        resp.raise_for_status()
        return resp.json()

# Open-Meteo API fetch (hourly forecast)
async def fetch_open_meteo(lat, lon):
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        "&hourly=temperature_2m,relative_humidity_2m,precipitation,cloudcover,windspeed_10m,winddirection_10m,weathercode"
        "&forecast_days=2"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()