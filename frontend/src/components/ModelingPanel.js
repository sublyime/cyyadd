import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Typography,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ModelTrainIcon from '@mui/icons-material/ModelTraining';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const STABILITY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F'];

const ModelingPanel = ({ setModelResults, weatherData, selectedLocation }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [chemicals, setChemicals] = useState([
    { id: 1, name: 'SO2', state: 'gas', molecular_weight: 64.07 },
    { id: 2, name: 'NO2', state: 'gas', molecular_weight: 46.01 },
    { id: 3, name: 'CO', state: 'gas', molecular_weight: 28.01 },
    { id: 4, name: 'NH3', state: 'gas', molecular_weight: 17.03 },
    { id: 5, name: 'H2S', state: 'gas', molecular_weight: 34.08 },
    { id: 6, name: 'Cl2', state: 'gas', molecular_weight: 70.90 },
  ]);
  const [selectedChemical, setSelectedChemical] = useState(chemicals[0]);

  // Plume model state
  const [plumeForm, setPlumeForm] = useState({
    Q: 10,
    release_height: 50,
    z: 1.5,
  });

  // Puff model state
  const [puffForm, setPuffForm] = useState({
    Q: 10,
    release_height: 50,
    z: 1.5,
    t: 60,
  });

  // Instantaneous model state
  const [instantForm, setInstantForm] = useState({
    Q: 100,
    release_height: 50,
    z: 1.5,
  });

  const buildModelParams = (formData, modelType) => {
    if (!selectedLocation) {
      throw new Error('Please select a location on the map first');
    }
    if (!weatherData) {
      throw new Error('Weather data not available for selected location');
    }

    const params = {
      ...formData,
      lat: selectedLocation.lat,
      lon: selectedLocation.lng,
      wind_speed: weatherData.wind_speed,
      wind_direction: weatherData.wind_direction,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure,
      stability_class: weatherData.stability_class,
      molecular_weight: selectedChemical.molecular_weight,
      chemical_name: selectedChemical.name,
      model_type: modelType
    };

    return params;
  };

  const runSinglePoint = useCallback(async (modelType) => {
    try {
      setLoading(true);
      setError(null);

      let formData;
      switch (modelType) {
        case 'puff':
          formData = puffForm;
          break;
        case 'instantaneous':
          formData = instantForm;
          break;
        default:
          formData = plumeForm;
      }

      const params = buildModelParams(formData, modelType);
      params.x = 100;
      params.y = 0;

      const endpoint = modelType === 'instantaneous' 
        ? '/model/instantaneous' 
        : `/model/${modelType}`;
      
      const res = await axios.post(`${API_BASE}${endpoint}`, params);
      
      setResults({ 
        type: 'single', 
        modelType,
        result: res.data,
        params: params
      });
    } catch (err) {
      setError(err.message || 'Model calculation failed');
      console.error('Model error:', err);
    } finally {
      setLoading(false);
    }
  }, [plumeForm, puffForm, instantForm, selectedLocation, weatherData, selectedChemical]);

  const generateGrid = useCallback(async (modelType) => {
    try {
      setLoading(true);
      setError(null);

      let formData;
      switch (modelType) {
        case 'puff':
          formData = puffForm;
          break;
        case 'instantaneous':
          formData = instantForm;
          break;
        default:
          formData = plumeForm;
      }

      const params = buildModelParams(formData, modelType);
      
      const response = await axios.post(`${API_BASE}/model/run-grid`, params);
      
      setResults({
        type: 'grid',
        modelType,
        gridData: response.data.grid,
        maxConcentration: response.data.max_concentration
      });
      
      setModelResults(response.data);
    } catch (err) {
      setError(err.message || 'Grid generation failed');
      console.error('Grid error:', err);
    } finally {
      setLoading(false);
    }
  }, [plumeForm, puffForm, instantForm, selectedLocation, weatherData, selectedChemical, setModelResults]);

  const renderLocationInfo = () => {
    if (!selectedLocation) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please click on the map to select a release location
        </Alert>
      );
    }

    if (!weatherData) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Loading weather data for selected location...
        </Alert>
      );
    }

    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" gutterBottom>
          <strong>Release Location:</strong> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2">Wind: {weatherData.wind_speed} mph @ {weatherData.wind_direction}°</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">Temp: {weatherData.temperature}°F</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">Humidity: {weatherData.humidity}%</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">Stability: Class {weatherData.stability_class}</Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderModelForm = (formData, setFormData, modelType) => {
    const isDisabled = !selectedLocation || !weatherData || loading;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Model Parameters</Typography>
              
              {renderLocationInfo()}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Chemical</InputLabel>
                  <Select
                    value={selectedChemical.id}
                    onChange={(e) => {
                      const chem = chemicals.find(c => c.id === e.target.value);
                      setSelectedChemical(chem);
                    }}
                    label="Chemical"
                  >
                    {chemicals.map((chem) => (
                      <MenuItem key={chem.id} value={chem.id}>
                        {chem.name} (MW: {chem.molecular_weight})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label={modelType === 'instantaneous' ? 'Total Release (g)' : 'Emission Rate (g/s)'}
                  type="number"
                  value={formData.Q}
                  onChange={(e) => setFormData({ ...formData, Q: parseFloat(e.target.value) })}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                />

                <TextField
                  label="Release Height (m)"
                  type="number"
                  value={formData.release_height}
                  onChange={(e) => setFormData({ ...formData, release_height: parseFloat(e.target.value) })}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                />

                <TextField
                  label="Receptor Height (m)"
                  type="number"
                  value={formData.z}
                  onChange={(e) => setFormData({ ...formData, z: parseFloat(e.target.value) })}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                />

                {modelType === 'puff' && (
                  <TextField
                    label="Time Since Release (s)"
                    type="number"
                    value={formData.t}
                    onChange={(e) => setFormData({ ...formData, t: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                    disabled={isDisabled}
                  />
                )}

                <Button
                  variant="contained"
                  onClick={() => runSinglePoint(modelType)}
                  disabled={isDisabled}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Calculate Point'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => generateGrid(modelType)}
                  disabled={isDisabled}
                  fullWidth
                >
                  {loading ? 'Generating...' : 'Generate Grid & Display on Map'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {results && results.type === 'single' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Calculation Result</Typography>
                <Paper sx={{ p: 3, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {results.result.concentration.toFixed(6)}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    {results.result.units}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Model: {results.result.model_type} | Stability: Class {results.result.stability_class}
                  </Typography>
                  <Typography variant="body2">
                    Chemical: {selectedChemical.name} (MW: {selectedChemical.molecular_weight})
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}

          {results && results.type === 'grid' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Grid Results</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Max Concentration: <strong>{results.maxConcentration.toFixed(6)}</strong> µg/m³
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Results displayed on map. Grid shows concentration at various downwind and crosswind distances.
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.gridData.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Concentration (µg/m³)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="concentration" fill="#8884d8" name="Concentration" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {!results && (
            <Card>
              <CardContent>
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  Select a location on the map and configure parameters to run the model
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ModelTrainIcon /> Dispersion Modeling
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Running dispersion model...
          </Typography>
        </Box>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={tab} 
          onChange={(e, val) => setTab(val)} 
          sx={{ borderBottom: '1px solid #e0e0e0' }}
          variant="fullWidth"
        >
          <Tab label="Gaussian Plume (Continuous)" />
          <Tab label="Puff Model (Time-varying)" />
          <Tab label="Instantaneous Release" />
        </Tabs>
      </Paper>

      {tab === 0 && renderModelForm(plumeForm, setPlumeForm, 'plume')}
      {tab === 1 && renderModelForm(puffForm, setPuffForm, 'puff')}
      {tab === 2 && renderModelForm(instantForm, setInstantForm, 'instantaneous')}
    </Box>
  );
};

export default ModelingPanel;