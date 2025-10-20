package com.example.refactoredbackend.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class DispersionService {

    /**
     * Gaussian Plume Model for continuous releases
     * C(x,y,z) = (Q / (2*π*u*σy*σz)) * exp(-y²/(2*σy²)) * [exp(-(z-H)²/(2*σz²)) + exp(-(z+H)²/(2*σz²))]
     */
    public Map<String, Object> calculatePlume(Map<String, Double> params) {
        double x = params.getOrDefault("x", 0.0);
        double y = params.getOrDefault("y", 0.0);
        double z = params.getOrDefault("z", 1.5);
        double Q = params.getOrDefault("Q", 10.0);  // emission rate g/s
        double u = params.getOrDefault("u", 5.0);   // wind speed m/s
        double H = params.getOrDefault("H", 50.0);  // stack height m
        double sy = params.getOrDefault("sy", 10.0); // lateral sigma m
        double sz = params.getOrDefault("sz", 8.0);  // vertical sigma m

        if (u <= 0 || sy <= 0 || sz <= 0 || x <= 0) {
            return createResponse(0.0);
        }

        double PI = Math.PI;
        double denominator = 2 * PI * u * sy * sz;
        
        double crosswindTerm = Math.exp(-Math.pow(y, 2) / (2 * Math.pow(sy, 2)));
        
        double verticalTermDirect = Math.exp(-Math.pow(z - H, 2) / (2 * Math.pow(sz, 2)));
        double verticalTermReflected = Math.exp(-Math.pow(z + H, 2) / (2 * Math.pow(sz, 2)));
        
        double concentration = (Q / denominator) * crosswindTerm * (verticalTermDirect + verticalTermReflected);
        
        // Convert from g/m³ to µg/m³
        concentration *= 1_000_000;

        return createResponse(concentration);
    }

    /**
     * Puff Model for puff releases
     * Similar to plume but with time decay factor
     */
    public Map<String, Object> calculatePuff(Map<String, Double> params) {
        double x = params.getOrDefault("x", 0.0);
        double y = params.getOrDefault("y", 0.0);
        double z = params.getOrDefault("z", 1.5);
        double Q = params.getOrDefault("Q", 10.0);
        double u = params.getOrDefault("u", 5.0);
        double H = params.getOrDefault("H", 50.0);
        double t = params.getOrDefault("t", 60.0); // time since release
        double sy = params.getOrDefault("sy", 10.0);
        double sz = params.getOrDefault("sz", 8.0);

        if (u <= 0 || sy <= 0 || sz <= 0 || t <= 0) {
            return createResponse(0.0);
        }

        // Time-dependent sigma growth
        double syEffective = sy + 0.1 * t;
        double szEffective = sz + 0.05 * t;
        
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

        return createResponse(concentration);
    }

    /**
     * Instantaneous Release Model
     */
    public Map<String, Object> calculateInstantaneous(Map<String, Double> params) {
        double x = params.getOrDefault("x", 0.0);
        double y = params.getOrDefault("y", 0.0);
        double z = params.getOrDefault("z", 1.5);
        double Q = params.getOrDefault("Q", 100.0); // total amount released g
        double u = params.getOrDefault("u", 5.0);
        double H = params.getOrDefault("H", 50.0);
        String stability = params.getOrDefault("stability", 3.0).toString(); // stability class

        if (u <= 0 || x <= 0) {
            return createResponse(0.0);
        }

        // Calculate time of travel
        double t = x / u;
        
        // Stability-dependent dispersion parameters (Pasquill-Gifford)
        double[] sigmas = getSigmasByStability(stability, x);
        double sy = sigmas[0];
        double sz = sigmas[1];

        double syEffective = sy + 0.1 * t;
        double szEffective = sz + 0.05 * t;

        double PI = Math.PI;
        double denominator = Math.pow(2 * PI, 1.5) * syEffective * szEffective;
        
        double concentration = (Q / denominator) * 
            Math.exp(-Math.pow(y, 2) / (2 * Math.pow(syEffective, 2))) *
            (Math.exp(-Math.pow(z - H, 2) / (2 * Math.pow(szEffective, 2))) +
             Math.exp(-Math.pow(z + H, 2) / (2 * Math.pow(szEffective, 2))));

        concentration *= 1_000_000;

        return createResponse(concentration);
    }

    private double[] getSigmasByStability(String stability, double x) {
        // Pasquill-Gifford dispersion parameters (simplified)
        // Returns [sigma_y, sigma_z]
        double xkm = x / 1000.0;
        
        double sy, sz;
        switch (stability.toUpperCase()) {
            case "A", "1": // Very Unstable
                sy = 0.22 * xkm * (1 + 0.0001 * xkm);
                sz = 0.20 * xkm;
                break;
            case "B", "2": // Unstable
                sy = 0.16 * xkm * (1 + 0.0001 * xkm);
                sz = 0.12 * xkm;
                break;
            case "C", "3": // Slightly Unstable
                sy = 0.11 * xkm * (1 + 0.0001 * xkm);
                sz = 0.08 * xkm * (1 + 0.0002 * xkm);
                break;
            case "D", "4": // Neutral
                sy = 0.08 * xkm * (1 + 0.0001 * xkm);
                sz = 0.06 * xkm * (1 + 0.0015 * xkm);
                break;
            case "E", "5": // Slightly Stable
                sy = 0.06 * xkm * (1 + 0.0001 * xkm);
                sz = 0.03 * xkm * (1 + 0.0003 * xkm);
                break;
            case "F", "6": // Stable
                sy = 0.03 * xkm * (1 + 0.0001 * xkm);
                sz = 0.016 * xkm * (1 + 0.0003 * xkm);
                break;
            default:
                sy = 0.1 * xkm;
                sz = 0.06 * xkm;
        }
        
        return new double[]{Math.max(sy, 1.0), Math.max(sz, 0.5)};
    }

    private Map<String, Object> createResponse(double concentration) {
        Map<String, Object> response = new HashMap<>();
        response.put("concentration", Math.max(concentration, 0.0));
        response.put("units", "µg/m³");
        return response;
    }
}