import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, Chip, Grid, Card, CardContent, Slider, Switch, FormControlLabel, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Wind, Thermometer, Droplets, Gauge } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ modelResults, weatherData }) => {
  const [gridMarkers, setGridMarkers] = useState([]);
  const [showWindVector, setShowWindVector] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [opacityLevel, setOpacityLevel] = useState(0.7);
  const [viewMode, setViewMode] = useState('standard');
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (!modelResults?.grid) return;
    
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

  const getColorWithAlpha = (intensity, alpha) => {
    const color = getColorForIntensity(intensity);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const maxConcentration = useMemo(() => {
    return modelResults?.max_concentration || 0;
  }, [modelResults]);

  const pulseScale = 1 + Math.sin(animationFrame / 10) * 0.15;

  // Wind vector calculation
  const windVector = useMemo(() => {
    if (!weatherData?.wind_speed || !weatherData?.wind_direction) return null;
    const centerLat = 39.8283;
    const centerLon = -98.5795;
    const length = weatherData.wind_speed * 0.01;
    const angle = (weatherData.wind_direction - 90) * Math.PI / 180;
    
    return {
      start: [centerLat, centerLon],
      end: [
        centerLat + length * Math.cos(angle),
        centerLon + length * Math.sin(angle)
      ]
    };
  }, [weatherData]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={9}
        style={{ height: '100%', width: '100%', filter: viewMode === 'night' ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
      >
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
                Wind Direction: {weatherData.wind_direction.toFixed(0)}°<br/>
                Wind Speed: {weatherData.wind_speed.toFixed(1)} m/s
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