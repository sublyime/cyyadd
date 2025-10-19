import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import './WeatherPanel.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const WeatherPanel = ({ setWeatherData }) => {
  const [tab, setTab] = useState(0);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);

  // Form state for new station
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lon: '',
    provider: 'open-meteo',
  });

  // Fetch all stations on mount
  useEffect(() => {
    fetchStations();
    fetchLatestWeather();
    const interval = setInterval(fetchLatestWeather, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/stations`);
      setStations(res.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch stations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestWeather = async () => {
    try {
      const res = await axios.get(`${API_BASE}/weather/latest`);
      setWeather(res.data);
      setWeatherData(res.data.data);
    } catch (err) {
      console.warn('No weather data available yet');
    }
  };

  const fetchWeatherByCoords = async (lat, lon, provider) => {
    try {
      setLoading(true);
      const endpoint = provider === 'noaa' ? '/weather/noaa' : '/weather/open-meteo';
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        params: { lat, lon },
      });
      
      // Store in database
      await axios.post(`${API_BASE}/weather/store`, res.data);
      
      setWeather({ timestamp: new Date().toISOString(), data: res.data });
      setWeatherData(res.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch weather: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.lat || !formData.lon) {
      setError('All fields required');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/stations`, null, {
        params: formData,
      });
      setFormData({ name: '', lat: '', lon: '', provider: 'open-meteo' });
      fetchStations();
      setError(null);
    } catch (err) {
      setError(`Failed to add station: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchWeather = (station) => {
    fetchWeatherByCoords(station.lat, station.lon, station.provider);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudIcon /> Weather Data Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3 }}>
        <Tab label="Current Weather" />
        <Tab label="Stations" />
        <Tab label="Add Station" />
      </Tabs>

      {/* Current Weather Tab */}
      {tab === 0 && (
        <Card>
          <CardContent>
            {weather ? (
              <Box>
                <Typography variant="h6">
                  Latest Data: {new Date(weather.timestamp).toLocaleString()}
                </Typography>
                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Parameter</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(weather.data).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell align="right">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography color="textSecondary">No weather data available</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stations Tab */}
      {tab === 1 && (
        <Card>
          <CardContent>
            {loading ? (
              <CircularProgress />
            ) : stations.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Latitude</TableCell>
                    <TableCell>Longitude</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell>{station.name}</TableCell>
                      <TableCell>{station.lat.toFixed(4)}</TableCell>
                      <TableCell>{station.lon.toFixed(4)}</TableCell>
                      <TableCell>{station.provider}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleFetchWeather(station)}
                          disabled={loading}
                        >
                          Fetch
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="textSecondary">No stations registered</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Station Tab */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleAddStation} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Station Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Latitude"
                  type="number"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  inputProps={{ min: -90, max: 90, step: 0.0001 }}
                />
                <TextField
                  label="Longitude"
                  type="number"
                  value={formData.lon}
                  onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  inputProps={{ min: -180, max: 180, step: 0.0001 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>Provider</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {['open-meteo', 'noaa'].map((p) => (
                    <label key={p}>
                      <input
                        type="radio"
                        value={p}
                        checked={formData.provider === p}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      />
                      {' '}{p}
                    </label>
                  ))}
                </Box>
              </Box>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Add Station'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default WeatherPanel;