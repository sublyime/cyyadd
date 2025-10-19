import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from 'react-leaflet-heatmap-layer-v3';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, Chip } from '@mui/material';
import './MapView.css';

const MapView = ({ modelResults, weatherData }) => {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    if (!modelResults) return;
    const { grid, concentration } = modelResults;
    if (!grid || !concentration) return;

    const points = grid.map((point, idx) => [
      point.lat,
      point.lon,
      concentration[idx], // intensity
    ]);
    setHeatmapData(points);
  }, [modelResults]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {heatmapData.length > 0 && (
          <HeatmapLayer
            fitBoundsOnLoad
            fitBoundsOnUpdate
            points={heatmapData}
            longitudeExtractor={(m) => m[1]}
            latitudeExtractor={(m) => m[0]}
            intensityExtractor={(m) => parseFloat(m[2])}
            gradient={{
              0.25: '#00ff00',
              0.5: '#ffff00',
              0.75: '#ff8800',
              1.0: '#ff0000'
            }}
            radius={20}
            blur={15}
            max={modelResults.max_concentration || 1.0}
          />
        )}
      </MapContainer>

      {/* Info Panel */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: 2,
          maxWidth: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1000, // Ensure it's above the map
        }}
      >
        <Typography variant="h6" gutterBottom>
          Dispersion Model
        </Typography>

        {weatherData && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Weather</Typography>
            <Chip
              label={`Wind: ${weatherData.wind_speed?.toFixed(1)} m/s`}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`Temp: ${weatherData.temperature?.toFixed(1)}°C`}
              size="small"
            />
          </Box>
        )}

        {modelResults && (
          <Box>
            <Typography variant="subtitle2">Model Results</Typography>
            <Typography variant="body2">
              Max Concentration: {modelResults.max_concentration?.toFixed(2)} µg/m³
            </Typography>
            <Typography variant="body2">
              Stability: {modelResults.stability}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapView;
