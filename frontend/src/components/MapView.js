import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polyline, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, Grid, Card, CardContent, Slider, Switch, 
  FormControlLabel, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import { Wind, Thermometer, Droplets, Gauge } from 'lucide-react';
import { fetchWeatherData } from '../utils/weatherService';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ modelResults, weatherData, onMapClick, selectedLocation: propSelectedLocation, showEventDialog = false }) => {
  const [gridMarkers, setGridMarkers] = useState([]);
  const [showWindVector, setShowWindVector] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [opacityLevel, setOpacityLevel] = useState(0.7);
  const [viewMode, setViewMode] = useState('standard');
  const [animationFrame, setAnimationFrame] = useState(0);
  const [timeRings, setTimeRings] = useState([]);
  const [downwindCorridor, setDownwindCorridor] = useState(null);

  // Update visualization when weather data or location changes
  useEffect(() => {
    console.log('MapView: Visualization update triggered', {
      location: propSelectedLocation,
      weather: weatherData
    });

    if (!propSelectedLocation?.lat || !propSelectedLocation?.lng) {
      console.log('MapView: No valid location selected');
      return;
    }

    // Get weather data with fallbacks
    const safeWeather = {
      wind_speed: weatherData?.wind_speed ?? 2.9,
      wind_direction: weatherData?.wind_direction ?? 270,
      temperature: weatherData?.temperature ?? 83.1,
      humidity: weatherData?.humidity ?? 79.9,
      pressure: weatherData?.pressure ?? 30.06,
      stability_class: weatherData?.stability_class ?? 'D'
    };

    // Constants for unit conversion and scaling
    const MILES_TO_METERS = 1609.34;          // 1 mile = 1609.34 meters
    const HOURS_TO_SECONDS = 3600;            // 1 hour = 3600 seconds
    const METERS_PER_DEGREE = 111000;         // Approximate at mid-latitudes
    const PROJECTION_HOURS = 3;               // How many hours to project downwind

    // Calculate scale factor for the current latitude
    const scale = Math.cos(propSelectedLocation.lat * Math.PI / 180) * METERS_PER_DEGREE;

    // Convert wind speed from mph to m/s and ensure it's a number
    const windSpeedMS = (Number(safeWeather.wind_speed) || 2.9) * MILES_TO_METERS / HOURS_TO_SECONDS;
    
    // Convert wind direction to radians (meteorological to mathematical)
    // Wind direction is FROM this direction, so we add 180° to get the flow direction
    const windDirectionRad = ((450 - (Number(safeWeather.wind_direction) || 270)) % 360) * Math.PI / 180;

    // Calculate plume dimensions based on atmospheric stability
    const stabilityFactor = {
      'A': 0.25, // Very unstable - wide dispersion
      'B': 0.20,
      'C': 0.15,
      'D': 0.10, // Neutral
      'E': 0.07,
      'F': 0.05  // Very stable - narrow dispersion
    }[safeWeather.stability_class] || 0.10;

    // Calculate corridor length in degrees (distance traveled in PROJECTION_HOURS)
    const corridorLength = (windSpeedMS * HOURS_TO_SECONDS * PROJECTION_HOURS) / scale;    
    console.log('Wind calculations:', {
      windSpeed: safeWeather.wind_speed,
      windDirection: safeWeather.wind_direction,
      windSpeedMS,
      corridorLength,
      windDirectionDeg: (windDirectionRad * 180 / Math.PI)
    });

    // Create corridor polygon points with expanding width
    const corridorPoints = (() => {
      // Base width depends on stability class
      const baseWidth = corridorLength * stabilityFactor;
      const endWidth = baseWidth * 3;  // Wider at the end for plume spread
      
      return [
        [propSelectedLocation.lat, propSelectedLocation.lng], // Origin point
        
        // Left side expanding outward
        [
          propSelectedLocation.lat + baseWidth * Math.cos(windDirectionRad + Math.PI/2),
          propSelectedLocation.lng + baseWidth * Math.sin(windDirectionRad + Math.PI/2)
        ],
        [
          propSelectedLocation.lat + (corridorLength * Math.cos(windDirectionRad)) + endWidth * Math.cos(windDirectionRad + Math.PI/2),
          propSelectedLocation.lng + (corridorLength * Math.sin(windDirectionRad)) + endWidth * Math.sin(windDirectionRad + Math.PI/2)
        ],
        
        // End point
        [
          propSelectedLocation.lat + (corridorLength * Math.cos(windDirectionRad)),
          propSelectedLocation.lng + (corridorLength * Math.sin(windDirectionRad))
        ],
        
        // Right side expanding outward
        [
          propSelectedLocation.lat + (corridorLength * Math.cos(windDirectionRad)) - endWidth * Math.cos(windDirectionRad + Math.PI/2),
          propSelectedLocation.lng + (corridorLength * Math.sin(windDirectionRad)) - endWidth * Math.sin(windDirectionRad + Math.PI/2)
        ],
        [
          propSelectedLocation.lat - baseWidth * Math.cos(windDirectionRad + Math.PI/2),
          propSelectedLocation.lng - baseWidth * Math.sin(windDirectionRad + Math.PI/2)
        ]
      ];
    })();
    
    console.log('Corridor points:', corridorPoints);
    setDownwindCorridor(corridorPoints);

    // Update time rings
    const ringIntervals = [0.5, 1, 1.5, 2, 2.5, 3]; // hours
    const newTimeRings = ringIntervals.map(hours => {
      const radiusMeters = windSpeedMS * HOURS_TO_SECONDS * hours;
      const radiusDegrees = radiusMeters / scale;
      return {
        center: [propSelectedLocation.lat, propSelectedLocation.lng],
        radius: radiusDegrees,
        hours: hours,
        distanceMeters: radiusMeters
      };
    });
    
    console.log('Time rings:', newTimeRings);
    setTimeRings(newTimeRings);
  }, [weatherData, propSelectedLocation]);

  // Calculate grid-based visualization from model results
  useEffect(() => {
    if (!modelResults) return;
    console.log('Processing model results:', modelResults);
    
    // Handle grid-based results
    if (modelResults.grid) {
      const markers = modelResults.grid.map((point, idx) => {
        const maxConc = modelResults.max_concentration || 1;
        const intensity = Math.min(modelResults.concentration[idx] / maxConc, 1);
        const radius = 8 + intensity * 20;
        return {
          position: point,
          intensity,
          radius
        };
      });
      setGridMarkers(markers);
    }
  }, [modelResults]);

  useEffect(() => {
    console.log('Model results updated:', modelResults);
  }, [modelResults]);

  useEffect(() => {
    if (!modelResults) return;
    console.log('Processing model results:', modelResults);
    
    // Handle grid-based results
    if (modelResults.grid) {
      const markers = modelResults.grid.map((point, idx) => {
        const maxConc = modelResults.max_concentration || 1;
        const intensity = Math.min(modelResults.concentration[idx] / maxConc, 1);
        const radius = 8 + intensity * 20;
        
        return {
          lat: point.lat,
          lon: point.lon,
          concentration: modelResults.concentration[idx],
          intensity,
          radius,
        };
      });
      setGridMarkers(markers);
    }
    // Handle point-based results
    else if (modelResults.points) {
      const markers = modelResults.points.map(point => ({
        lat: point.latitude || point.lat,
        lon: point.longitude || point.lon,
        concentration: point.concentration,
        intensity: point.concentration / (modelResults.max_concentration || 1),
        radius: 8 + (point.concentration / (modelResults.max_concentration || 1)) * 20,
      }));
      setGridMarkers(markers);
    }
  }, [modelResults]);

  // Animated pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getColorForIntensity = (intensity) => {
    if (intensity < 0.2) return '#4A90E2'; // Blue
    if (intensity < 0.4) return '#50C878'; // Green
    if (intensity < 0.6) return '#FFD700'; // Gold
    if (intensity < 0.8) return '#FF8C00'; // Orange
    return '#FF4444'; // Red
  };



  // Utility function for future use - converts color to rgba
  // const getColorWithAlpha = (intensity, alpha) => {
  //   const color = getColorForIntensity(intensity);
  //   const r = parseInt(color.slice(1, 3), 16);
  //   const g = parseInt(color.slice(3, 5), 16);
  //   const b = parseInt(color.slice(5, 7), 16);
  //   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  // };

  // Animation frame handling
  useEffect(() => {
    let frameId;
    const animate = () => {
      setAnimationFrame(prev => (prev + 1) % 360);
      frameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const maxConcentration = useMemo(() => {
    return modelResults?.max_concentration || 0;
  }, [modelResults]);

  // Calculate animation scale factor
  const pulseScale = useMemo(() => {
    return 1 + Math.sin(animationFrame / 10) * 0.15;
  }, [animationFrame]);

  // Wind vector calculation with fallback
  const windVector = useMemo(() => {
    if (!propSelectedLocation) return null;

    // Use fallback weather data if needed
    const defaultWeather = {
      wind_speed: 2.9,
      wind_direction: 270,
    };
    
    const wind = weatherData || defaultWeather;
    const length = wind.wind_speed * 0.005; // Scaled for visibility
    const angle = (wind.wind_direction - 90) * Math.PI / 180;
    
    return {
      start: [propSelectedLocation.lat, propSelectedLocation.lng],
      end: [
        propSelectedLocation.lat + length * Math.cos(angle),
        propSelectedLocation.lng + length * Math.sin(angle)
      ]
    };
  }, [weatherData, propSelectedLocation]);

  // Map click handler component
  const MapClickHandler = () => {
    const [isLoading, setIsLoading] = useState(false);

    useMapEvents({
      click: async (e) => {
        console.log('Map clicked at:', {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });

        try {
          setIsLoading(true);
          
          // Fetch live weather data
          const weatherData = await fetchWeatherData(e.latlng.lat, e.latlng.lng);
          console.log('Fetched weather data:', weatherData);
          
          // Pass location and weather to parent
          if (onMapClick) {
            onMapClick(
              {
                lat: e.latlng.lat,
                lng: e.latlng.lng
              },
              weatherData
            );
          }

          // Fetch live weather data
          const fetchedWeather = await fetchWeatherData(e.latlng.lat, e.latlng.lng);
          console.log('Fetched weather data:', fetchedWeather);
          
          // Create a complete location object with weather data
          const locationData = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
          };
          
          // Notify parent component with both location and weather
          if (onMapClick) {
            onMapClick(locationData, fetchedWeather);
          }
        } catch (error) {
          console.error('Error fetching weather data:', error);
          // Use fallback weather data on error
          if (onMapClick) {
            onMapClick(e.latlng);
          }
        } finally {
          setIsLoading(false);
        }
      },
    });

    return isLoading ? (
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <CircularProgress size={24} />
        <Typography variant="caption" style={{ marginLeft: 10 }}>
          Fetching weather data...
        </Typography>
      </div>
    ) : null;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={9}
        style={{ height: '100%', width: '100%', filter: viewMode === 'night' ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
      >
        <MapClickHandler />
        
        {/* Downwind Corridor */}
        {downwindCorridor && (
          <>
            <Polygon
              positions={downwindCorridor}
              pathOptions={{
                color: '#6366f1',
                weight: 1,
                fillColor: '#6366f1',
                fillOpacity: 0.1,
              }}
            >
              <Popup>
                Wind Direction: {weatherData?.wind_direction || 270}° ({weatherData?.wind_speed || 2.9} mph)
              </Popup>
            </Polygon>
          </>
        )}

        {/* Time Rings */}
        {timeRings.map((ring, index) => (
          <CircleMarker
            key={`ring-${index}`}
            center={ring.center}
            radius={40 + index * 20} // Visual radius that increases with time
            pathOptions={{
              color: '#6366f1',
              weight: 2,
              opacity: 0.6,
              fill: false,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              {`${ring.hours} hours - ${(ring.distanceMeters / 1609.34).toFixed(1)} miles`}
            </Popup>
          </CircleMarker>
        ))}

        {propSelectedLocation && (
          <CircleMarker
            center={[propSelectedLocation.lat, propSelectedLocation.lng]}
            radius={8}
            pathOptions={{
              fillColor: '#4a90e2',
              fillOpacity: 0.7,
              color: '#2171cd',
              weight: 2
            }}
          >
            <Popup>
              <div style={{ minWidth: '250px', padding: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  Local Weather Conditions
                </h4>
                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Wind size={16} style={{ marginRight: '8px' }} />
                    <div>
                      <strong>Wind:</strong> {(weatherData?.wind_speed || 2.9).toFixed(1)} mph at {(weatherData?.wind_direction || 270).toFixed(0)}°
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Thermometer size={16} style={{ marginRight: '8px' }} />
                    <div>
                      <strong>Temperature:</strong> {(weatherData?.temperature || 83.1).toFixed(1)}°F
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Droplets size={16} style={{ marginRight: '8px' }} />
                    <div>
                      <strong>Humidity:</strong> {(weatherData?.humidity || 79.9).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Gauge size={16} style={{ marginRight: '8px' }} />
                    <div>
                      <strong>Pressure:</strong> {(weatherData?.pressure || 30.06).toFixed(2)} inHg
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Concentration Grid Visualization */}
        {gridMarkers.map((marker, idx) => (
          <CircleMarker
            key={`plume-${idx}`}
            center={marker.position}
            radius={marker.radius * pulseScale * opacityLevel}
            pathOptions={{
              fillColor: getColorForIntensity(marker.intensity),
              fillOpacity: opacityLevel,
              color: getColorForIntensity(marker.intensity),
              weight: 1
            }}
          >
            <Popup>
              Relative Concentration: {(marker.intensity * 100).toFixed(1)}%
            </Popup>
          </CircleMarker>
        ))}

        <TileLayer
          url={viewMode === 'satellite' 
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Wind vector */}
        {showWindVector && windVector && (
          <Polyline
            positions={[windVector.start, windVector.end]}
            color="#FF4444"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          >
            <Popup>
              <Typography variant="body2">
                Wind Direction: {(weatherData?.wind_direction || 270).toFixed(0)}°<br/>
                Wind Speed: {(weatherData?.wind_speed || 2.9).toFixed(1)} m/s
              </Typography>
            </Popup>
          </Polyline>
        )}

        {/* Concentration markers with animation */}
        {gridMarkers.map((marker, idx) => (
          <CircleMarker
            key={idx}
            center={[marker.lat, marker.lon]}
            radius={marker.radius * (marker.intensity > 0.7 ? pulseScale : 1)}
            fillColor={getColorForIntensity(marker.intensity)}
            color={getColorForIntensity(marker.intensity)}
            weight={2}
            opacity={opacityLevel}
            fillOpacity={opacityLevel * 0.6}
          >
            <Popup>
              <Box sx={{ p: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Concentration Data
                </Typography>
                <Typography variant="body2">
                  <strong>Value:</strong> {marker.concentration.toFixed(4)} µg/m³
                </Typography>
                <Typography variant="body2">
                  <strong>Intensity:</strong> {(marker.intensity * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {marker.lat.toFixed(4)}, {marker.lon.toFixed(4)}
                </Typography>
              </Box>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Enhanced Control Panel */}
      <Paper
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: 2,
          maxWidth: 320,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1976d2', mb: 2 }}>
          🎛️ Map Controls
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            Map Style
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
            fullWidth
          >
            <ToggleButton value="standard">Standard</ToggleButton>
            <ToggleButton value="satellite">Satellite</ToggleButton>
            <ToggleButton value="night">Night</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            Opacity: {(opacityLevel * 100).toFixed(0)}%
          </Typography>
          <Slider
            value={opacityLevel}
            onChange={(e, val) => setOpacityLevel(val)}
            min={0.1}
            max={1}
            step={0.1}
            marks
            size="small"
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showWindVector}
              onChange={(e) => setShowWindVector(e.target.checked)}
              color="primary"
            />
          }
          label="Show Wind Vector"
          sx={{ mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={showContours}
              onChange={(e) => setShowContours(e.target.checked)}
              color="primary"
            />
          }
          label="Show Contours"
        />
      </Paper>

      {/* Enhanced Info Panel */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: 2.5,
          maxWidth: 400,
          maxHeight: 'calc(100vh - 60px)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          borderRadius: 3,
          boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          📊 Live Analysis
        </Typography>

        {weatherData && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
              Weather Conditions
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Wind size={18} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Wind</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {weatherData.wind_speed?.toFixed(1)} m/s
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Thermometer size={18} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Temp</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {weatherData.temperature?.toFixed(1)}°C
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Droplets size={18} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Humidity</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {weatherData.humidity?.toFixed(0)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Gauge size={18} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Pressure</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {weatherData.pressure?.toFixed(0)} mb
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {modelResults && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
              Model Results
            </Typography>
            <Card variant="outlined" sx={{ mb: 2, background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                  Maximum Concentration
                </Typography>
                <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 800, textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                  {maxConcentration.toFixed(4)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  µg/m³
                </Typography>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Stability:</Typography>
                      <Typography variant="body2">{modelResults.stability || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Points:</Typography>
                      <Typography variant="body2">{modelResults.grid?.length || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>

            {/* Enhanced Legend */}
            <Box sx={{ p: 2, background: 'linear-gradient(135deg, #e0e7ff 0%, #cfd9ff 100%)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: '#1e40af' }}>
                Concentration Scale
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { color: '#4A90E2', label: 'Very Low', range: '< 20%' },
                  { color: '#50C878', label: 'Low', range: '20-40%' },
                  { color: '#FFD700', label: 'Medium', range: '40-60%' },
                  { color: '#FF8C00', label: 'High', range: '60-80%' },
                  { color: '#FF4444', label: 'Very High', range: '> 80%' }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      backgroundColor: item.color, 
                      borderRadius: '50%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      border: '2px solid white'
                    }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {item.range}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {!modelResults && (
          <Box sx={{ 
            py: 4, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
            borderRadius: 2,
            border: '2px dashed #cbd5e1'
          }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#64748b' }}>
              🚀 Ready to Model
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Run a dispersion model from the Modeling tab to visualize results on the map
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapView;