import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { Wind, Thermometer, Droplets, Gauge } from 'lucide-react';
import * as d3 from 'd3';

// Initialize Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ modelResults, weatherData, onMapClick, selectedLocation: propSelectedLocation, showEventDialog = false }) => {
  // UI state
  const [timeRings, setTimeRings] = useState([]);
  const [downwindCorridor, setDownwindCorridor] = useState(null);
  const [concentrationMarkers, setConcentrationMarkers] = useState([]);
  const [modelType, setModelType] = useState(null);

  // Constants
  const MILES_TO_METERS = 1609.34;
  const HOURS_TO_SECONDS = 3600;
  const METERS_PER_DEGREE_LAT = 111321.5;
  const PROJECTION_HOURS = 3;
  const MPH_TO_MS = MILES_TO_METERS / HOURS_TO_SECONDS;



  // Handle model results
  useEffect(() => {
    if (modelResults?.type && modelResults?.grid) {
      setModelType(modelResults.type);
      
      // Create concentration markers from grid data
      const markers = modelResults.grid.map(point => {
        const normalizedConc = point.concentration / modelResults.max_concentration;
        const color = d3.interpolateRdYlBu(1 - normalizedConc);
        return {
          position: [propSelectedLocation.lat, propSelectedLocation.lng + (point.y / METERS_PER_DEGREE_LAT)],
          concentration: point.concentration,
          color: color,
          opacity: Math.max(0.2, normalizedConc)
        };
      });
      setConcentrationMarkers(markers);
    }
  }, [modelResults, propSelectedLocation, METERS_PER_DEGREE_LAT]);

  // Current weather data with proper units
  const weather = useMemo(() => {
    if (!weatherData) return null;
    return {
      windSpeed: weatherData?.wind_speed ?? 6.5,        // mph
      windDirection: weatherData?.wind_direction ?? 270, // degrees
      temperature: weatherData?.temperature ?? 70,       // °F
      humidity: weatherData?.humidity ?? 70,            // %
      pressure: weatherData?.pressure ?? 29.92,         // inHg
      stabilityClass: weatherData?.stability_class ?? 'D'
    };
  }, [weatherData]);

  // Calculate plume dimensions based on weather and location
  const plumeCalc = useMemo(() => {
    if (!weather || !propSelectedLocation?.lat || !propSelectedLocation?.lng) {
      return null;
    }

    // Calculate scale factors for the current latitude
    const safeLat = Math.max(-85, Math.min(85, propSelectedLocation.lat));
    const latRad = safeLat * Math.PI / 180;
    const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(latRad);

    // Convert wind speed to m/s for calculations
    const windSpeedMS = weather.windSpeed * MPH_TO_MS;
    
    // Convert meteorological wind direction to mathematical angle
    const windAngleRad = (90 - ((weather.windDirection + 180) % 360)) * Math.PI / 180;

    // Calculate plume dimensions
    const distanceMeters = Math.max(100, windSpeedMS * HOURS_TO_SECONDS * PROJECTION_HOURS);
    
    // Stability-based width factors
    const stabilityFactor = {
      'A': 0.20, // Very unstable
      'B': 0.15, // Moderately unstable
      'C': 0.12, // Slightly unstable
      'D': 0.09, // Neutral
      'E': 0.06, // Slightly stable
      'F': 0.04  // Very stable
    }[weather.stabilityClass] || 0.09;

    // Base dimensions in meters
    const baseWidthMeters = distanceMeters * stabilityFactor;
    const endWidthMeters = baseWidthMeters * 3;  // Wider at end for dispersion

    return {
      windAngleRad,
      distanceMeters,
      metersPerDegreeLon,
      baseWidthMeters,
      endWidthMeters
    };
  }, [weather, propSelectedLocation, MPH_TO_MS]);

  // Update visualization
  useEffect(() => {
    if (!plumeCalc || !propSelectedLocation) return;

    const {
      windAngleRad,
      distanceMeters,
      metersPerDegreeLon,
      baseWidthMeters,
      endWidthMeters
    } = plumeCalc;

    // Convert dimensions to degrees
    const latDistance = distanceMeters / METERS_PER_DEGREE_LAT;
    const lonDistance = distanceMeters / metersPerDegreeLon;
    
    const baseWidthLat = baseWidthMeters / METERS_PER_DEGREE_LAT;
    const baseWidthLon = baseWidthMeters / metersPerDegreeLon;
    const endWidthLat = endWidthMeters / METERS_PER_DEGREE_LAT;
    const endWidthLon = endWidthMeters / metersPerDegreeLon;

    // Direction vectors
    const cos = Math.cos(windAngleRad);
    const sin = Math.sin(windAngleRad);
    const perpCos = -sin;  // Perpendicular vector
    const perpSin = cos;

    // Safety check for coordinates
    const checkValidCoord = (coord) => (
      isNaN(coord) ? 0 : Math.max(-180, Math.min(180, coord))
    );

    // Create corridor polygon
    const corridorPoints = [
      // Origin
      [
        checkValidCoord(propSelectedLocation.lat),
        checkValidCoord(propSelectedLocation.lng)
      ],
      // Left start
      [
        checkValidCoord(propSelectedLocation.lat + (baseWidthLat * perpCos)),
        checkValidCoord(propSelectedLocation.lng + (baseWidthLon * perpSin))
      ],
      // Left end
      [
        checkValidCoord(propSelectedLocation.lat + (latDistance * cos) + (endWidthLat * perpCos)),
        checkValidCoord(propSelectedLocation.lng + (lonDistance * sin) + (endWidthLon * perpSin))
      ],
      // End point
      [
        checkValidCoord(propSelectedLocation.lat + (latDistance * cos)),
        checkValidCoord(propSelectedLocation.lng + (lonDistance * sin))
      ],
      // Right end
      [
        checkValidCoord(propSelectedLocation.lat + (latDistance * cos) - (endWidthLat * perpCos)),
        checkValidCoord(propSelectedLocation.lng + (lonDistance * sin) - (endWidthLon * perpSin))
      ],
      // Right start
      [
        checkValidCoord(propSelectedLocation.lat - (baseWidthLat * perpCos)),
        checkValidCoord(propSelectedLocation.lng - (baseWidthLon * perpSin))
      ]
    ];

    setDownwindCorridor(corridorPoints);

    // Update time rings
    const intervals = [0.5, 1, 1.5, 2, 2.5, 3];
    const newRings = intervals.map(hours => {
      const radiusMeters = weather.windSpeed * MPH_TO_MS * HOURS_TO_SECONDS * hours;
      const radiusLat = radiusMeters / METERS_PER_DEGREE_LAT;
      const radiusLon = radiusMeters / metersPerDegreeLon;
      const radiusDeg = (radiusLat + radiusLon) / 2;

      return {
        center: [propSelectedLocation.lat, propSelectedLocation.lng],
        radius: radiusDeg,
        hours: hours,
        distanceMeters: radiusMeters,
        distanceMiles: radiusMeters / MILES_TO_METERS
      };
    });

    setTimeRings(newRings);
  }, [plumeCalc, propSelectedLocation, MPH_TO_MS, weather?.windSpeed]);

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {propSelectedLocation && (
          <CircleMarker
            center={[propSelectedLocation.lat, propSelectedLocation.lng]}
            radius={8}
            color="#ff4444"
            fillColor="#ff4444"
            fillOpacity={0.8}
          />
        )}

        {downwindCorridor && (
          <Polygon
            positions={downwindCorridor}
            pathOptions={{
              color: '#4444ff',
              fillColor: '#4444ff',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        )}

        {timeRings.map((ring, index) => (
          <CircleMarker
            key={index}
            center={ring.center}
            radius={ring.radius * 100}
            pathOptions={{
              color: '#4444ff',
              fillColor: 'transparent',
              weight: 1,
              dashArray: '5,5'
            }}
          >
            <Popup>
              Time: {ring.hours} hours<br />
              Distance: {Math.round(ring.distanceMiles)} miles
            </Popup>
          </CircleMarker>
        ))}

        {/* Concentration markers */}
        {concentrationMarkers.map((marker, index) => (
          <CircleMarker
            key={index}
            center={marker.position}
            radius={5}
            pathOptions={{
              color: marker.color,
              fillColor: marker.color,
              fillOpacity: marker.opacity,
              weight: 1
            }}
          >
            <Popup>
              Concentration: {marker.concentration.toFixed(6)} mg/m³
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          p: 1
        }}
      >
        {modelResults && (
          <Chip
            label={`${modelType?.toUpperCase()} MODEL - Max Conc: ${modelResults.max_concentration.toFixed(6)} mg/m³`}
            color="primary"
            sx={{ mb: 1 }}
          />
        )}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          p: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Weather Conditions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  <Wind size={16} /> Wind
                </Typography>
                <Typography variant="h5">{weather?.windSpeed ?? 'N/A'} mph</Typography>
                <Typography variant="subtitle2">Direction: {weather?.windDirection ?? 'N/A'}°</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  <Thermometer size={16} /> Temperature
                </Typography>
                <Typography variant="h5">{weather?.temperature ?? 'N/A'}°F</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  <Droplets size={16} /> Humidity
                </Typography>
                <Typography variant="h5">{weather?.humidity ?? 'N/A'}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  <Gauge size={16} /> Pressure
                </Typography>
                <Typography variant="h5">{weather?.pressure ?? 'N/A'} inHg</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MapView;