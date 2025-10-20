import React, { useState, useEffect, useCallback } from 'react';
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
  FormControlLabel,
  Radio,
  RadioGroup,
  Grid,
  IconButton,
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import DeleteIcon from '@mui/icons-material/Delete';
import './WeatherPanel.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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

  // Fetch stations and latest weather on mount
  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/stations`);
      setStations(res.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch stations: ${err.message}`);
      console.error('Fetch stations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatestWeather = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/weather/latest`);
      setWeather(res.data);
      if (res.data?.data) {
        setWeatherData(res.data.data);
      }
    } catch (err) {
      console.warn('No weather data available yet:', err.message);
    }
  }, [setWeatherData]);

  useEffect(() => {
    fetchStations();
    fetchLatestWeather();
    const interval = setInterval(fetchLatestWeather, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchStations, fetchLatestWeather]);

  const fetchWeatherByCoords = async (lat, lon, provider) => {
    try {
      setLoading(true);
      const endpoint = provider === 'noaa' ? '/weather/noaa' : '/weather/open-meteo';
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        params: { lat, lon },
      });
      
      // Store in database
      try {
        await axios.post(`${API_BASE}/weather/store`, res.data);
      } catch (storeErr) {
        console.warn('Failed to store weather data:', storeErr.message);
      }
      
      setWeather({ timestamp: new Date().toISOString(), data: res.data });
      setWeatherData(res.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch weather: ${err.message}`);
      console.error('Fetch weather error:', err);
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
      await fetchStations();
      setError(null);
    } catch (err) {
      setError(`Failed to add station: ${err.message}`);
      console.error('Add station error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchWeather = (station) => {
    fetchWeatherByCoords(station.lat, station.lon, station.provider);
  };

  const handleDeleteStation = async (id) => {
    if (window.confirm('Delete this station?')) {
      try {
        await axios.delete(`${API_BASE}/stations/${id}`);
        await fetchStations();
      } catch (err) {
        setError(`Failed to delete station: ${err.message}`);
        console.error('Delete station error:', err);
      }
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudIcon /> Weather Data Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3, borderBottom: '2px solid #e0e0e0' }}>
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
                <Typography variant="h6" gutterBottom>
                  Latest Data: {new Date(weather.timestamp).toLocaleString()}
                </Typography>
                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Parameter</strong></TableCell>
                      <TableCell align="right"><strong>Value</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(weather.data || {}).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key.replace(/_/g, ' ').toUpperCase()}</TableCell>
                        <TableCell align="right">
                          {typeof value === 'number' ? value.toFixed(2) : String(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography color="textSecondary">No weather data available. Fetch from a station to see data.</Typography>
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
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell align="right"><strong>Latitude</strong></TableCell>
                    <TableCell align="right"><strong>Longitude</strong></TableCell>
                    <TableCell><strong>Provider</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id} hover>
                      <TableCell>{station.name}</TableCell>
                      <TableCell align="right">{station.lat.toFixed(4)}</TableCell>
                      <TableCell align="right">{station.lon.toFixed(4)}</TableCell>
                      <TableCell>{station.provider}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleFetchWeather(station)}
                          disabled={loading}
                          sx={{ mr: 1 }}
                        >
                          Fetch
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteStation(station.id)}
                          disabled={loading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="textSecondary">No stations registered. Add one in the "Add Station" tab.</Typography>
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
                placeholder="e.g., Downtown Station"
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Latitude"
                    type="number"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    fullWidth
                    inputProps={{ min: -90, max: 90, step: 0.0001 }}
                    placeholder="-90 to 90"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Longitude"
                    type="number"
                    value={formData.lon}
                    onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                    fullWidth
                    inputProps={{ min: -180, max: 180, step: 0.0001 }}
                    placeholder="-180 to 180"
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Weather Provider</Typography>
                <RadioGroup
                  row
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                >
                  <FormControlLabel value="open-meteo" control={<Radio />} label="Open-Meteo" />
                  <FormControlLabel value="noaa" control={<Radio />} label="NOAA" />
                </RadioGroup>
              </Box>

              <Button type="submit" variant="contained" disabled={loading} fullWidth>
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