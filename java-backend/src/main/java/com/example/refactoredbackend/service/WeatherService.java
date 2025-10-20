package com.example.refactoredbackend.service;

import com.example.refactoredbackend.model.Weather;
import com.example.refactoredbackend.repository.WeatherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

@Service
public class WeatherService {

    @Autowired
    private WeatherRepository weatherRepository;

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

        return Map.of(
            "timestamp", weather.getTime().toString(),
            "data", data
        );
    }

    public Map<String, Object> getWeatherFromOpenMeteo(double lat, double lon) {
        // Simulated response - in production, call actual API
        Map<String, Object> response = new HashMap<>();
        response.put("wind_speed", 5.0 + Math.random() * 5);
        response.put("wind_direction", Math.random() * 360);
        response.put("temperature", 15.0 + Math.random() * 10);
        response.put("humidity", 40 + Math.random() * 40);
        response.put("pressure", 1013.0);
        response.put("precipitation", 0.0);
        return response;
    }

    public Map<String, Object> getWeatherFromNOAA(double lat, double lon) {
        // Simulated response - in production, call actual API
        Map<String, Object> response = new HashMap<>();
        response.put("wind_speed", 5.5 + Math.random() * 4);
        response.put("wind_direction", Math.random() * 360);
        response.put("temperature", 14.0 + Math.random() * 12);
        response.put("humidity", 45 + Math.random() * 35);
        response.put("pressure", 1013.25);
        response.put("precipitation", 0.0);
        return response;
    }
}