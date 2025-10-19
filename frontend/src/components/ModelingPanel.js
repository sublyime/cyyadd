import React, { useState } from 'react';
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
} from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ModelTrainIcon from '@mui/icons-material/ModelTraining';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const STABILITY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F'];

const ModelingPanel = ({ setModelResults, weatherData }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Plume model state
  const [plumeForm, setPlumeForm] = useState({
    x: 100,
    y: 0,
    z: 1.5,
    Q: 10,
    u: weatherData?.windspeed_10m || 5,
    H: 50,
    sy: 10,
    sz: 8,
    terrain_height: 0,
    terrain_gradient: 0,
    building_height: 0,
  });

  // Puff model state
  const [puffForm, setPuffForm] = useState({
    ...plumeForm,
    t: 60,
  });

  // Instantaneous model state
  const [instantForm, setInstantForm] = useState({
    x: 100,
    y: 0,
    z: 1.5,
    Q: 100,
    u: weatherData?.windspeed_10m || 5,
    H: 50,
    stability: 'D',
    terrain_height: 0,
    terrain_gradient: 0,
    building_height: 0,
  });

  const runModel = async (endpoint, data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${API_BASE}${endpoint}`, data, {
        params: { use_weather: false },
      });
      setResults({ endpoint, data, result: res.data });
      setModelResults(res.data);
    } catch (err) {
      setError(`Model error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateGrid = async (modelType) => {
    try {
      setLoading(true);
      const form = modelType === 'plume' ? plumeForm : modelType === 'puff' ? puffForm : instantForm;
      
      // Generate a grid of points downwind
      const gridPoints = [];
      const distances = [50, 100, 200, 300, 500, 1000];
      const offsets = [-50, -25, 0, 25, 50];

      for (const x of distances) {
        for (const y of offsets) {
          const point = { ...form, x, y };
          const endpoint = modelType === 'instantaneous' ? '/model/instantaneous' : `/model/${modelType}`;
          const res = await axios.post(`${API_BASE}${endpoint}`, point, {
            params: { use_weather: false },
          });
          gridPoints.push({
            x,
            y,
            concentration: res.data.concentration,
          });
        }
      }

      setResults({
        type: 'grid',
        modelType,
        gridData: gridPoints,
        maxConcentration: Math.max(...gridPoints.map((p) => p.concentration)),
      });
      setModelResults({
        grid: gridPoints,
        concentration: gridPoints.map((p) => p.concentration),
        max_concentration: Math.max(...gridPoints.map((p) => p.concentration)),
        stability: instantForm.stability,
      });
    } catch (err) {
      setError(`Grid generation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ModelTrainIcon /> Dispersion Modeling
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3 }}>
        <Tab label="Plume Model" />
        <Tab label="Puff Model" />
        <Tab label="Instantaneous Release" />
      </Tabs>

      {/* Plume Model Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Plume Parameters</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Downwind Distance (m)"
                    type="number"
                    value={plumeForm.x}
                    onChange={(e) => setPlumeForm({ ...plumeForm, x: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Crosswind Distance (m)"
                    type="number"
                    value={plumeForm.y}
                    onChange={(e) => setPlumeForm({ ...plumeForm, y: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Height (m)"
                    type="number"
                    value={plumeForm.z}
                    onChange={(e) => setPlumeForm({ ...plumeForm, z: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Emission Rate Q (g/s)"
                    type="number"
                    value={plumeForm.Q}
                    onChange={(e) => setPlumeForm({ ...plumeForm, Q: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Wind Speed u (m/s)"
                    type="number"
                    value={plumeForm.u}
                    onChange={(e) => setPlumeForm({ ...plumeForm, u: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Stack Height H (m)"
                    type="number"
                    value={plumeForm.H}
                    onChange={(e) => setPlumeForm({ ...plumeForm, H: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Lateral Sigma sy (m)"
                    type="number"
                    value={plumeForm.sy}
                    onChange={(e) => setPlumeForm({ ...plumeForm, sy: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Vertical Sigma sz (m)"
                    type="number"
                    value={plumeForm.sz}
                    onChange={(e) => setPlumeForm({ ...plumeForm, sz: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Terrain Height (m)"
                    type="number"
                    value={plumeForm.terrain_height}
                    onChange={(e) => setPlumeForm({ ...plumeForm, terrain_height: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Building Height (m)"
                    type="number"
                    value={plumeForm.building_height}
                    onChange={(e) => setPlumeForm({ ...plumeForm, building_height: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={() => runModel('/model/plume', plumeForm)}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Run Plume Model'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => generateGrid('plume')}
                    disabled={loading}
                  >
                    Generate Grid
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results && results.type !== 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Result</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body1">
                      Concentration: <strong>{results.result.concentration.toFixed(6)}</strong> {results.result.units}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Instantaneous Release Tab */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Instantaneous Release Parameters</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Downwind Distance (m)"
                    type="number"
                    value={instantForm.x}
                    onChange={(e) => setInstantForm({ ...instantForm, x: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Crosswind Distance (m)"
                    type="number"
                    value={instantForm.y}
                    onChange={(e) => setInstantForm({ ...instantForm, y: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Height (m)"
                    type="number"
                    value={instantForm.z}
                    onChange={(e) => setInstantForm({ ...instantForm, z: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Total Amount Released Q (g)"
                    type="number"
                    value={instantForm.Q}
                    onChange={(e) => setInstantForm({ ...instantForm, Q: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Wind Speed u (m/s)"
                    type="number"
                    value={instantForm.u}
                    onChange={(e) => setInstantForm({ ...instantForm, u: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Stack Height H (m)"
                    type="number"
                    value={instantForm.H}
                    onChange={(e) => setInstantForm({ ...instantForm, H: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Stability Class</InputLabel>
                    <Select
                      value={instantForm.stability}
                      onChange={(e) => setInstantForm({ ...instantForm, stability: e.target.value })}
                      label="Stability Class"
                    >
                      {STABILITY_CLASSES.map((cls) => (
                        <MenuItem key={cls} value={cls}>
                          {cls} - {
                            cls === 'A' ? 'Very Unstable' :
                            cls === 'B' ? 'Unstable' :
                            cls === 'C' ? 'Slightly Unstable' :
                            cls === 'D' ? 'Neutral' :
                            cls === 'E' ? 'Slightly Stable' :
                            'Stable'
                          }
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Terrain Height (m)"
                    type="number"
                    value={instantForm.terrain_height}
                    onChange={(e) => setInstantForm({ ...instantForm, terrain_height: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Building Height (m)"
                    type="number"
                    value={instantForm.building_height}
                    onChange={(e) => setInstantForm({ ...instantForm, building_height: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={() => runModel('/model/instantaneous', instantForm)}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Run Instantaneous Model'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => generateGrid('instantaneous')}
                    disabled={loading}
                  >
                    Generate Grid
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results && results.type !== 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Result</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body1">
                      Concentration: <strong>{results.result.concentration.toFixed(6)}</strong> {results.result.units}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            )}

            {results && results.type === 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Grid Results</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Max Concentration: {results.maxConcentration.toFixed(4)} µg/m³
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.gridData.slice(0, 20)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="concentration" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Puff Model Tab */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Puff Parameters</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Downwind Distance (m)"
                    type="number"
                    value={puffForm.x}
                    onChange={(e) => setPuffForm({ ...puffForm, x: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Crosswind Distance (m)"
                    type="number"
                    value={puffForm.y}
                    onChange={(e) => setPuffForm({ ...puffForm, y: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Height (m)"
                    type="number"
                    value={puffForm.z}
                    onChange={(e) => setPuffForm({ ...puffForm, z: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Emission Rate Q (g/s)"
                    type="number"
                    value={puffForm.Q}
                    onChange={(e) => setPuffForm({ ...puffForm, Q: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Wind Speed u (m/s)"
                    type="number"
                    value={puffForm.u}
                    onChange={(e) => setPuffForm({ ...puffForm, u: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Stack Height H (m)"
                    type="number"
                    value={puffForm.H}
                    onChange={(e) => setPuffForm({ ...puffForm, H: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Time Since Release (s)"
                    type="number"
                    value={puffForm.t}
                    onChange={(e) => setPuffForm({ ...puffForm, t: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Lateral Sigma sy (m)"
                    type="number"
                    value={puffForm.sy}
                    onChange={(e) => setPuffForm({ ...puffForm, sy: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <TextField
                    label="Vertical Sigma sz (m)"
                    type="number"
                    value={puffForm.sz}
                    onChange={(e) => setPuffForm({ ...puffForm, sz: parseFloat(e.target.value) })}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={() => runModel('/model/puff', puffForm)}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Run Puff Model'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results && results.type !== 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Result</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body1">
                      Concentration: <strong>{results.result.concentration.toFixed(6)}</strong> {results.result.units}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            )}

            {results && results.type === 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Grid Results</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Max Concentration: {results.maxConcentration.toFixed(4)} µg/m³
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.gridData.slice(0, 20)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="concentration" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ModelingPanel;