import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Paper, Typography, Chip } from '@mui/material';
import './MapView.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MapView = ({ modelResults, weatherData }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [plumeLayers, setPlumeLayers] = useState([]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-98.5795, 39.8283],
      zoom: 9,
      pitch: 0,
      bearing: 0,
    });

    map.current.on('load', () => {
      // Add base layers
      map.current.addSource('terrain', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      // Add heatmap layer for plume visualization
      map.current.addLayer({
        id: 'plume-heatmap',
        type: 'heatmap',
        source: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'concentration'], 0, 0, 100, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0, 0, 255, 0)',
            0.25,
            '#00ff00',
            0.5,
            '#ffff00',
            0.75,
            '#ff8800',
            1,
            '#ff0000',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': 0.7,
        },
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update plume visualization when modelResults change
  useEffect(() => {
    if (!map.current || !modelResults) return;

    const { grid, concentration } = modelResults;
    if (!grid || !concentration) return;

    // Generate GeoJSON features from model results
    const features = grid.map((point, idx) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lon, point.lat],
      },
      properties: {
        concentration: concentration[idx],
        z: point.z,
      },
    }));

    const source = map.current.getSource('plume-heatmap');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [modelResults]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Info Panel */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: 2,
          maxWidth: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 10,
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