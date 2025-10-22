package com.example.refactoredbackend.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class DispersionService {

    /**
     * Gaussian Plume Model for continuous releases with chemical properties
     */
    public Map<String, Object> calculatePlume(Map<String, Object> params) {
        double x = getDoubleParam(params, "x", 100.0);
        double y = getDoubleParam(params, "y", 0.0);
        double z = getDoubleParam(params, "z", 1.5);
        double Q = getDoubleParam(params, "Q", 10.0);
        double H = getDoubleParam(params, "release_height", 50.0);
        
        // Weather parameters
        double windSpeed = getDoubleParam(params, "wind_speed", 5.0);
        double windDirection = getDoubleParam(params, "wind_direction", 270.0);
        double temperature = getDoubleParam(params, "temperature", 20.0);
        String stabilityClass = getStringParam(params, "stability_class", "D");
        
        // Chemical properties
        double molecularWeight = getDoubleParam(params, "molecular_weight", 64.0);
        
        // Convert wind speed from mph to m/s
        double u = windSpeed * 0.44704;
        
        if (u <= 0 || x <= 0) {
            return createResponse(0.0, "plume", stabilityClass);
        }

        // Calculate dispersion parameters based on stability class and distance
        double[] sigmas = getSigmasByStability(stabilityClass, x);
        double sy = sigmas[0];
        double sz = sigmas[1];

        // Apply molecular weight correction factor
        double mwFactor = Math.sqrt(28.97 / molecularWeight); // Relative to air
        sy *= mwFactor;
        sz *= mwFactor;

        double PI = Math.PI;
        double denominator = 2 * PI * u * sy * sz;
        
        double crosswindTerm = Math.exp(-Math.pow(y, 2) / (2 * Math.pow(sy, 2)));
        double verticalTermDirect = Math.exp(-Math.pow(z - H, 2) / (2 * Math.pow(sz, 2)));
        double verticalTermReflected = Math.exp(-Math.pow(z + H, 2) / (2 * Math.pow(sz, 2)));
        
        double concentration = (Q / denominator) * crosswindTerm * (verticalTermDirect + verticalTermReflected);
        concentration *= 1_000_000; // Convert to µg/m³

        return createResponse(concentration, "plume", stabilityClass);
    }

    /**
     * Puff Model for instantaneous releases
     */
    public Map<String, Object> calculatePuff(Map<String, Object> params) {
        double x = getDoubleParam(params, "x", 100.0);
        double y = getDoubleParam(params, "y", 0.0);
        double z = getDoubleParam(params, "z", 1.5);
        double Q = getDoubleParam(params, "Q", 10.0);
        double H = getDoubleParam(params, "release_height", 50.0);
        double t = getDoubleParam(params, "t", 60.0);
        
        double windSpeed = getDoubleParam(params, "wind_speed", 5.0);
        String stabilityClass = getStringParam(params, "stability_class", "D");
        double molecularWeight = getDoubleParam(params, "molecular_weight", 64.0);
        
        double u = windSpeed * 0.44704;

        if (u <= 0 || t <= 0) {
            return createResponse(0.0, "puff", stabilityClass);
        }

        double[] sigmas = getSigmasByStability(stabilityClass, x);
        double syEffective = sigmas[0] + 0.1 * t;
        double szEffective = sigmas[1] + 0.05 * t;
        
        double mwFactor = Math.sqrt(28.97 / molecularWeight);
        syEffective *= mwFactor;
        szEffective *= mwFactor;
        
        double puffDistance = u * t;
        double dx = x - puffDistance;

        double PI = Math.PI;
        double denominator = Math.pow(2 * PI, 1.5) * syEffective * szEffective;
        
        double concentration = (Q / denominator) * 
            Math.exp(-Math.pow(dx, 2) / (2 * Math.pow(syEffective, 2))) *
            Math.exp(-Math.pow(y, 2) / (2 * Math.pow(syEffective, 2))) *
            (Math.exp(-Math.pow(z - H, 2) / (2 * Math.pow(szEffective, 2))) +
             Math.exp(-Math.pow(z + H, 2) / (2 * Math.pow(szEffective, 2))));

        concentration *= 1_000_000;

        return createResponse(concentration, "puff", stabilityClass);
    }

    /**
     * Instantaneous Release Model
     */
    public Map<String, Object> calculateInstantaneous(Map<String, Object> params) {
        double x = getDoubleParam(params, "x", 100.0);
        double y = getDoubleParam(params, "y", 0.0);
        double z = getDoubleParam(params, "z", 1.5);
        double Q = getDoubleParam(params, "Q", 100.0);
        double H = getDoubleParam(params, "release_height", 50.0);
        
        double windSpeed = getDoubleParam(params, "wind_speed", 5.0);
        String stabilityClass = getStringParam(params, "stability_class", "D");
        double molecularWeight = getDoubleParam(params, "molecular_weight", 64.0);
        
        double u = windSpeed * 0.44704;

        if (u <= 0 || x <= 0) {
            return createResponse(0.0, "instantaneous", stabilityClass);
        }

        double t = x / u;
        double[] sigmas = getSigmasByStability(stabilityClass, x);
        double sy = sigmas[0] + 0.1 * t;
        double sz = sigmas[1] + 0.05 * t;

        double mwFactor = Math.sqrt(28.97 / molecularWeight);
        sy *= mwFactor;
        sz *= mwFactor;

        double PI = Math.PI;
        double denominator = Math.pow(2 * PI, 1.5) * sy * sz;
        
        double concentration = (Q / denominator) * 
            Math.exp(-Math.pow(y, 2) / (2 * Math.pow(sy, 2))) *
            (Math.exp(-Math.pow(z - H, 2) / (2 * Math.pow(sz, 2))) +
             Math.exp(-Math.pow(z + H, 2) / (2 * Math.pow(sz, 2))));

        concentration *= 1_000_000;

        return createResponse(concentration, "instantaneous", stabilityClass);
    }

    private double[] getSigmasByStability(String stability, double x) {
        double xkm = x / 1000.0;
        double sy, sz;
        
        switch (stability.toUpperCase()) {
            case "A", "1":
                sy = 0.22 * xkm * Math.pow(1 + 0.0001 * xkm, -0.5);
                sz = 0.20 * xkm;
                break;
            case "B", "2":
                sy = 0.16 * xkm * Math.pow(1 + 0.0001 * xkm, -0.5);
                sz = 0.12 * xkm;
                break;
            case "C", "3":
                sy = 0.11 * xkm * Math.pow(1 + 0.0001 * xkm, -0.5);
                sz = 0.08 * xkm * Math.pow(1 + 0.0002 * xkm, -0.5);
                break;
            case "D", "4":
                sy = 0.08 * xkm * Math.pow(1 + 0.0001 * xkm, -0.5);
                sz = 0.06 * xkm * Math.pow(1 + 0.0015 * xkm, -0.5);
                break;
            case "E", "5":
                sy = 0.06 * xkm * Math.pow(1 + 0.0001 * xkm, -0.5);
                sz = 0.03 * xkm * Math.pow(1 + 0.0003 * xkm, -0.5);
                break;
            case "F", "6":
                sy = 0.03 * xkm * Math.pow(1 + 0.0001 * xkm, -0.5);
                sz = 0.016 * xkm * Math.pow(1 + 0.0003 * xkm, -0.5);
                break;
            default:
                sy = 0.1 * xkm;
                sz = 0.06 * xkm;
        }
        
        return new double[]{Math.max(sy * 1000, 1.0), Math.max(sz * 1000, 0.5)};
    }

    private double getDoubleParam(Map<String, Object> params, String key, double defaultValue) {
        Object value = params.get(key);
        if (value == null) return defaultValue;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private String getStringParam(Map<String, Object> params, String key, String defaultValue) {
        Object value = params.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    private Map<String, Object> createResponse(double concentration, String modelType, String stabilityClass) {
        Map<String, Object> response = new HashMap<>();
        response.put("concentration", Math.max(concentration, 0.0));
        response.put("units", "µg/m³");
        response.put("model_type", modelType);
        response.put("stability_class", stabilityClass);
        return response;
    }
}