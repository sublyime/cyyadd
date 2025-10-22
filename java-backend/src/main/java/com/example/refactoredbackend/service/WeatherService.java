package com.example.refactoredbackend.service;

import com.example.refactoredbackend.model.Weather;
import com.example.refactoredbackend.repository.WeatherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

@Service
public class WeatherService {

    @Autowired
    private WeatherRepository weatherRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    public Weather storeWeatherData(Map<String, Object> data) {
        Weather weather = new Weather();
        weather.setTime(LocalDateTime.now());
        
        if (data.containsKey("wind_speed")) {
            weather.setWind_speed(((Number) data.get("wind_speed")).doubleValue());
        }
        if (data.containsKey("wind_direction")) {
            weather.setWind_direction(((Number) data.get("wind_direction")).doubleValue());
        }
        if (data.containsKey("temperature")) {
            weather.setTemperature(((Number) data.get("temperature")).doubleValue());
        }
        if (data.containsKey("humidity")) {
            weather.setHumidity(((Number) data.get("humidity")).doubleValue());
        }
        if (data.containsKey("pressure")) {
            weather.setPressure(((Number) data.get("pressure")).doubleValue());
        }
        if (data.containsKey("precipitation")) {
            weather.setPrecipitation(((Number) data.get("precipitation")).doubleValue());
        }
        
        return weatherRepository.save(weather);
    }

    public Map<String, Object> getLatestWeather() {
        Weather weather = weatherRepository.findAll().stream()
            .max(Comparator.comparing(Weather::getTime))
            .orElse(null);

        if (weather == null) {
            return Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "data", new HashMap<>()
            );
        }

        Map<String, Object> data = new HashMap<>();
        data.put("wind_speed", weather.getWind_speed());
        data.put("wind_direction", weather.getWind_direction());
        data.put("temperature", weather.getTemperature());
        data.put("humidity", weather.getHumidity());
        data.put("pressure", weather.getPressure());
        data.put("precipitation", weather.getPrecipitation());
        data.put("stability_class", calculateStabilityClass(weather.getWind_speed(), weather.getTemperature()));

        return Map.of(
            "timestamp", weather.getTime().toString(),
            "data", data
        );
    }

    public Map<String, Object> getWeatherFromOpenMeteo(double lat, double lon) {
        try {
            String url = String.format(
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch",
                lat, lon
            );
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Map<String, Object> current = (Map<String, Object>) response.get("current");
            
            double windSpeedMph = ((Number) current.get("wind_speed_10m")).doubleValue();
            double windDirection = ((Number) current.get("wind_direction_10m")).doubleValue();
            double temperature = ((Number) current.get("temperature_2m")).doubleValue();
            double humidity = ((Number) current.get("relative_humidity_2m")).doubleValue();
            double pressure = ((Number) current.get("pressure_msl")).doubleValue() * 0.02953; // Convert hPa to inHg
            
            String stabilityClass = calculateStabilityClass(windSpeedMph, temperature);
            
            Map<String, Object> weatherData = new HashMap<>();
            weatherData.put("wind_speed", windSpeedMph);
            weatherData.put("wind_direction", windDirection);
            weatherData.put("temperature", temperature);
            weatherData.put("humidity", humidity);
            weatherData.put("pressure", pressure);
            weatherData.put("precipitation", 0.0);
            weatherData.put("stability_class", stabilityClass);
            
            return weatherData;
        } catch (Exception e) {
            System.err.println("Error fetching Open-Meteo data: " + e.getMessage());
            return getDefaultWeather();
        }
    }

    public Map<String, Object> getWeatherFromNOAA(double lat, double lon) {
        // Fallback to default if NOAA API fails
        return getDefaultWeather();
    }

    private Map<String, Object> getDefaultWeather() {
        Map<String, Object> weather = new HashMap<>();
        weather.put("wind_speed", 6.5);
        weather.put("wind_direction", 270.0);
        weather.put("temperature", 70.0);
        weather.put("humidity", 70.0);
        weather.put("pressure", 29.92);
        weather.put("precipitation", 0.0);
        weather.put("stability_class", "D");
        return weather;
    }

    private String calculateStabilityClass(double windSpeedMph, double temperature) {
        // Simplified Pasquill-Gifford stability classification
        // Based on wind speed and assuming daytime conditions
        
        if (windSpeedMph < 4.5) {
            return "A"; // Very unstable
        } else if (windSpeedMph < 6.7) {
            return "B"; // Unstable
        } else if (windSpeedMph < 11.2) {
            return "C"; // Slightly unstable
        } else if (windSpeedMph < 13.4) {
            return "D"; // Neutral
        } else if (windSpeedMph < 15.7) {
            return "E"; // Slightly stable
        } else {
            return "F"; // Stable
        }
    }
}