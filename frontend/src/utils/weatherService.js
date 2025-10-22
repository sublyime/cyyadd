import axios from 'axios';

const NWS_API_BASE = 'https://api.weather.gov';

// Create a specific axios instance for NWS API
const weatherClient = axios.create({
  baseURL: NWS_API_BASE,
  timeout: 10000,
  headers: {
    'Accept': 'application/geo+json'
  }
});

export async function fetchWeatherData(lat, lon) {
  try {
    // Validate coordinates
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates provided');
    }

    // First get the grid point data for the location
    const pointResponse = await weatherClient.get(`/points/${lat},${lon}`);
    if (!pointResponse?.data?.properties) {
      throw new Error('Invalid grid point response from NWS');
    }
    const { gridId, gridX, gridY } = pointResponse.data.properties;

    // Fetch the station observation data
    const gridPointResponse = await weatherClient.get(
      `/gridpoints/${gridId}/${gridX},${gridY}`
    );

    // Get hourly forecast for more accurate near-term predictions
    const hourlyResponse = await weatherClient.get(
      `/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`
    );

    const currentHour = hourlyResponse.data.properties.periods[0];
    const properties = gridPointResponse.data.properties;

    // Safely extract and convert values with fallbacks
    const windSpeedMS = properties.windSpeed?.value ?? 5;
    const windDir = properties.windDirection?.value ?? 270;
    const temperature = currentHour?.temperature ?? 20;
    const humidity = properties.relativeHumidity?.value ?? 70;
    const pressurePa = properties.pressure?.value ?? 101325;
    const skyCover = properties.skyCover?.value ?? 50;

    // Convert to our application's format with proper unit conversions
    const windSpeedMph = Math.round(windSpeedMS * 2.237); // Convert m/s to mph
    const tempF = Math.round(temperature * 9/5 + 32); // Convert C to F
    const pressureInHg = Math.round(pressurePa * 0.0002953 * 100) / 100; // Convert Pa to inHg

    // Determine stability class based on wind speed and sky cover
    let stabilityClass = 'D'; // Default to neutral
    if (skyCover < 30) { // Clear skies
      if (windSpeedMph < 7) stabilityClass = 'A';
      else if (windSpeedMph < 11) stabilityClass = 'B';
      else if (windSpeedMph < 13) stabilityClass = 'C';
    } else if (skyCover > 70) { // Overcast
      if (windSpeedMph < 7) stabilityClass = 'E';
      else stabilityClass = 'D';
    }

    return {
      wind_speed: windSpeedMph,
      wind_direction: windDir,
      temperature: tempF,
      humidity: humidity,
      pressure: pressureInHg,
      stability_class: stabilityClass,
      timestamp: new Date().toISOString(),
      units: {
        wind_speed: 'mph',
        temperature: '°F',
        pressure: 'inHg'
      }
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return fallback values in correct units
    return {
      wind_speed: 6.5,           // ~15mph
      wind_direction: 270,       // West
      temperature: 70,           // °F
      humidity: 70,             // %
      pressure: 29.92,          // inHg
      stability_class: 'D',     // Neutral conditions
      timestamp: new Date().toISOString(),
      units: {
        wind_speed: 'mph',
        temperature: '°F',
        pressure: 'inHg'
      }
    };
  }
}
  if (cloudCover < 30) { // Clear sky
    if (windSpeedMph < 4) return 'A';
    if (windSpeedMph < 8) return 'B';
    if (windSpeedMph < 13) return 'C';
    return 'D';
  } else if (cloudCover < 70) { // Partly cloudy
    if (windSpeedMph < 6) return 'B';
    if (windSpeedMph < 11) return 'C';
    return 'D';
  } else { // Overcast
    if (windSpeedMph < 8) return 'D';
    if (windSpeedMph < 15) return 'D';
    return 'E';
  }
}