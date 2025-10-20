import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, Chip, Grid, Card, CardContent } from '@mui/material';
import './MapView.css';

// Fix for default marker icons in leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ modelResults, weatherData }) => {
  const [gridMarkers, setGridMarkers] = useState([]);

  useEffect(() => {
    if (!modelResults?.grid) return;
    
    // Create circle markers for grid points with opacity based on concentration
    const markers = modelResults.grid.map((point, idx) => {
      const maxConc = modelResults.max_concentration || 1;
      const intensity = Math.min(modelResults.concentration[idx] / maxConc, 1);
      const radius = 5 + intensity * 15;
      
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

  const getColorForIntensity = (intensity) => {
    if (intensity < 0.2) return '#0000ff'; // Blue - low
    if (intensity < 0.4) return '#00ff00'; // Green - low-med
    if (intensity < 0.6) return '#ffff00'; // Yellow - medium
    if (intensity < 0.8) return '#ff8800'; // Orange - high
    return '#ff0000'; // Red - very high
  };

  const maxConcentration = useMemo(() => {
    return modelResults?.max_concentration || 0;
  }, [modelResults]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Grid concentration markers */}
        {gridMarkers.map((marker, idx) => (
          <CircleMarker
            key={idx}
            center={[marker.lat, marker.lon]}
            radius={marker.radius}
            fillColor={getColorForIntensity(marker.intensity)}
            color={getColorForIntensity(marker.intensity)}
            weight={2}
            opacity={0.7}
            fillOpacity={0.6}
          >
            <Popup>
              <Typography variant="body2">
                Concentration: {marker.concentration.toFixed(4)} µg/m³
              </Typography>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Info Panel */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: 2,
          maxWidth: 380,
          maxHeight: 'calc(100vh - 60px)',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          zIndex: 1000,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          📊 Dispersion Model
        </Typography>

        {weatherData && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Weather Conditions</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Chip
                  label={`Wind: ${weatherData.wind_speed?.toFixed(1)} m/s`}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`Temp: ${weatherData.temperature?.toFixed(1)}°C`}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`Humidity: ${weatherData.humidity?.toFixed(0)}%`}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`Pressure: ${weatherData.pressure?.toFixed(0)} mb`}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {modelResults && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Model Results</Typography>
            <Card variant="outlined" sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Max Concentration:</strong>
                </Typography>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                  {maxConcentration.toFixed(4)} µg/m³
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Stability:</strong> {modelResults.stability || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Points:</strong> {modelResults.grid?.length || 0}
                </Typography>
              </CardContent>
            </Card>

            {/* Concentration Legend */}
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Concentration Levels</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#0000ff', borderRadius: '50%' }} />
                  <Typography variant="caption">Very Low (&lt; 20%)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#00ff00', borderRadius: '50%' }} />
                  <Typography variant="caption">Low (20-40%)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#ffff00', borderRadius: '50%' }} />
                  <Typography variant="caption">Medium (40-60%)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#ff8800', borderRadius: '50%' }} />
                  <Typography variant="caption">High (60-80%)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#ff0000', borderRadius: '50%' }} />
                  <Typography variant="caption">Very High (&gt; 80%)</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {!modelResults && (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
            Run a model from the Modeling tab to see results on the map
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default MapView;