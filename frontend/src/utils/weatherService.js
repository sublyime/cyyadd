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
    // First get the grid point data for the location
    const pointResponse = await weatherClient.get(`/points/${lat},${lon}`);
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
    return {
      wind_speed: windSpeedMS * 2.237, // Convert m/s to mph
      wind_direction: windDir,
      temperature: (temperature * 9/5) + 32, // Convert C to F
      humidity: humidity,
      pressure: pressurePa * 0.02953, // Convert Pa to inHg
      stability_class: calculateStabilityClass(windSpeedMS, skyCover),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data from NWS');
  }
}

// Pasquill-Gifford stability class determination
function calculateStabilityClass(windSpeed, cloudCover) {
  // Convert m/s to mph for calculation
  const windSpeedMph = windSpeed * 2.237;
  
  // Simplified stability class calculation
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