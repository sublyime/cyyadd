import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Grid, Card, CardContent, Chip, CircularProgress } from '@mui/material';
import { Wind, Thermometer, Droplets, Gauge } from 'lucide-react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      console.log('Map clicked at:', lat, lng);
      
      try {
        const response = await axios.get(`${API_BASE}/weather/location`, {
          params: { lat, lon: lng }
        });
        
        const weatherData = response.data;
        console.log('Weather data received:', weatherData);
        
        onMapClick({ lat, lng }, weatherData);
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Use default weather if fetch fails
        const defaultWeather = {
          wind_speed: 6.5,
          wind_direction: 270,
          temperature: 70,
          humidity: 70,
          pressure: 29.92,
          stability_class: 'D'
        };
        onMapClick({ lat, lng }, defaultWeather);
      }
    },
  });
  return null;
}

const MapView = ({ modelResults, weatherData, onMapClick, selectedLocation }) => {
  const [timeRings, setTimeRings] = useState([]);
  const [downwindCorridor, setDownwindCorridor] = useState(null);
  const [concentrationMarkers, setConcentrationMarkers] = useState([]);
  const [modelType, setModelType] = useState(null);
  const [loading, setLoading] = useState(false);

  const MILES_TO_METERS = 1609.34;
  const HOURS_TO_SECONDS = 3600;
  const METERS_PER_DEGREE_LAT = 111321.5;
  const PROJECTION_HOURS = 3;
  const MPH_TO_MS = MILES_TO_METERS / HOURS_TO_SECONDS;

  // Handle model results
  useEffect(() => {
    if (modelResults?.grid && selectedLocation) {
      setModelType(modelResults.type);
      setLoading(false);
      
      const markers = modelResults.grid.map(point => {
        const normalizedConc = point.concentration / (modelResults.max_concentration || 1);
        const color = d3.interpolateRdYlBu(1 - normalizedConc);
        
        // Calculate position based on wind direction and distance
        const windAngleRad = weatherData ? 
          ((270 - ((weatherData.wind_direction + 180) % 360)) * Math.PI / 180) : 0;
        
        const cos = Math.cos(windAngleRad);
        const sin = Math.sin(windAngleRad);
        
        const latOffset = (point.x * cos - point.y * sin) / METERS_PER_DEGREE_LAT;
        const lonOffset = (point.x * sin + point.y * cos) / (METERS_PER_DEGREE_LAT * Math.cos(selectedLocation.lat * Math.PI / 180));
        
        return {
          position: [selectedLocation.lat + latOffset, selectedLocation.lng + lonOffset],
          concentration: point.concentration,
          color: color,
          opacity: Math.max(0.2, normalizedConc * 0.8)
        };
      });
      setConcentrationMarkers(markers);
    }
  }, [modelResults, selectedLocation, weatherData, METERS_PER_DEGREE_LAT]);

  const weather = useMemo(() => {
    if (!weatherData) return null;
    return {
      windSpeed: weatherData?.wind_speed ?? 6.5,
      windDirection: weatherData?.wind_direction ?? 270,
      temperature: weatherData?.temperature ?? 70,
      humidity: weatherData?.humidity ?? 70,
      pressure: weatherData?.pressure ?? 29.92,
      stabilityClass: weatherData?.stability_class ?? 'D'
    };
  }, [weatherData]);

  const plumeCalc = useMemo(() => {
    if (!weather || !selectedLocation?.lat || !selectedLocation?.lng) {
      return null;
    }

    const safeLat = Math.max(-85, Math.min(85, selectedLocation.lat));
    const latRad = safeLat * Math.PI / 180;
    const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(latRad);

    const windSpeedMS = weather.windSpeed * MPH_TO_MS;
    const windAngleRad = (90 - ((weather.windDirection + 180) % 360)) * Math.PI / 180;

    const distanceMeters = Math.max(100, windSpeedMS * HOURS_TO_SECONDS * PROJECTION_HOURS);
    
    const stabilityFactor = {
      'A': 0.20, 'B': 0.15, 'C': 0.12, 'D': 0.09, 'E': 0.06, 'F': 0.04
    }[weather.stabilityClass] || 0.09;

    const baseWidthMeters = distanceMeters * stabilityFactor;
    const endWidthMeters = baseWidthMeters * 3;

    return {
      windAngleRad,
      distanceMeters,
      metersPerDegreeLon,
      baseWidthMeters,
      endWidthMeters
    };
  }, [weather, selectedLocation, MPH_TO_MS, METERS_PER_DEGREE_LAT, PROJECTION_HOURS, HOURS_TO_SECONDS]);

  useEffect(() => {
    if (!plumeCalc || !selectedLocation) return;

    const {
      windAngleRad,
      distanceMeters,
      metersPerDegreeLon,
      baseWidthMeters,
      endWidthMeters
    } = plumeCalc;

    const latDistance = distanceMeters / METERS_PER_DEGREE_LAT;
    const lonDistance = distanceMeters / metersPerDegreeLon;
    
    const baseWidthLat = baseWidthMeters / METERS_PER_DEGREE_LAT;
    const baseWidthLon = baseWidthMeters / metersPerDegreeLon;
    const endWidthLat = endWidthMeters / METERS_PER_DEGREE_LAT;
    const endWidthLon = endWidthMeters / metersPerDegreeLon;

    const cos = Math.cos(windAngleRad);
    const sin = Math.sin(windAngleRad);
    const perpCos = -sin;
    const perpSin = cos;

    const checkValidCoord = (coord) => (
      isNaN(coord) ? 0 : Math.max(-180, Math.min(180, coord))
    );

    const corridorPoints = [
      [checkValidCoord(selectedLocation.lat), checkValidCoord(selectedLocation.lng)],
      [
        checkValidCoord(selectedLocation.lat + (baseWidthLat * perpCos)),
        checkValidCoord(selectedLocation.lng + (baseWidthLon * perpSin))
      ],
      [
        checkValidCoord(selectedLocation.lat + (latDistance * cos) + (endWidthLat * perpCos)),
        checkValidCoord(selectedLocation.lng + (lonDistance * sin) + (endWidthLon * perpSin))
      ],
      [
        checkValidCoord(selectedLocation.lat + (latDistance * cos)),
        checkValidCoord(selectedLocation.lng + (lonDistance * sin))
      ],
      [
        checkValidCoord(selectedLocation.lat + (latDistance * cos) - (endWidthLat * perpCos)),
        checkValidCoord(selectedLocation.lng + (lonDistance * sin) - (endWidthLon * perpSin))
      ],
      [
        checkValidCoord(selectedLocation.lat - (baseWidthLat * perpCos)),
        checkValidCoord(selectedLocation.lng - (baseWidthLon * perpSin))
      ]
    ];

    setDownwindCorridor(corridorPoints);

    const intervals = [0.5, 1, 1.5, 2, 2.5, 3];
    const newRings = intervals.map(hours => {
      const radiusMeters = weather.windSpeed * MPH_TO_MS * HOURS_TO_SECONDS * hours;
      const radiusLat = radiusMeters / METERS_PER_DEGREE_LAT;
      const radiusLon = radiusMeters / metersPerDegreeLon;
      const radiusDeg = (radiusLat + radiusLon) / 2;

      return {
        center: [selectedLocation.lat, selectedLocation.lng],
        radius: radiusDeg,
        hours: hours,
        distanceMeters: radiusMeters,
        distanceMiles: radiusMeters / MILES_TO_METERS
      };
    });

    setTimeRings(newRings);
  }, [plumeCalc, selectedLocation, MPH_TO_MS, weather, HOURS_TO_SECONDS, METERS_PER_DEGREE_LAT, MILES_TO_METERS]);

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
        
        <MapClickHandler onMapClick={onMapClick} />
        
        {selectedLocation && (
          <CircleMarker
            center={[selectedLocation.lat, selectedLocation.lng]}
            radius={8}
            pathOptions={{
              color: '#ff4444',
              fillColor: '#ff4444',
              fillOpacity: 0.8,
              weight: 2
            }}
          >
            <Popup>
              Release Location<br />
              {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </Popup>
          </CircleMarker>
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
          >
            <Popup>Downwind Dispersion Corridor</Popup>
          </Polygon>
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
              Concentration: {marker.concentration.toFixed(6)} µg/m³
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            p: 3
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Running dispersion model...</Typography>
        </Box>
      )}

      {modelResults && (
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
          <Chip
            label={`${modelType?.toUpperCase()} MODEL - Max: ${modelResults.max_concentration?.toFixed(6)} µg/m³`}
            color="primary"
            sx={{ mb: 1 }}
          />
        </Box>
      )}

      {weather && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            p: 2,
            minWidth: 300
          }}
        >
          <Typography variant="h6" gutterBottom>
            Weather Conditions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                    <Wind size={16} /> Wind
                  </Typography>
                  <Typography variant="h6">{weather.windSpeed.toFixed(1)} mph</Typography>
                  <Typography variant="caption">Dir: {weather.windDirection.toFixed(0)}°</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                    <Thermometer size={16} /> Temp
                  </Typography>
                  <Typography variant="h6">{weather.temperature.toFixed(1)}°F</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                    <Droplets size={16} /> Humidity
                  </Typography>
                  <Typography variant="h6">{weather.humidity.toFixed(0)}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                    <Gauge size={16} /> Pressure
                  </Typography>
                  <Typography variant="h6">{weather.pressure.toFixed(2)} inHg</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`Stability Class: ${weather.stabilityClass}`} 
              color="primary" 
              size="small"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MapView;