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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ModelTrainIcon from '@mui/icons-material/ModelTraining';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const STABILITY_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F'];

const ModelingPanel = ({ setModelResults, weatherData }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(0);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Plume model state
  const [plumeForm, setPlumeForm] = useState({
    x: 100,
    y: 0,
    z: 1.5,
    Q: 10,
    u: weatherData?.wind_speed || 5,
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
    u: weatherData?.wind_speed || 5,
    H: 50,
    stability: 'D',
    terrain_height: 0,
    terrain_gradient: 0,
    building_height: 0,
  });

  const runModel = useCallback(async (endpoint, data) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Sending model request:', { endpoint, data });
      const requestData = {
        ...data,
        wind_speed: weatherData?.wind_speed || data.u,
        wind_direction: weatherData?.wind_direction || 0,
        temperature: weatherData?.temperature || 20,
        stability_class: data.stability,
        release_height: data.H,
        source_strength: data.Q
      };
      const res = await axios.post(`${API_BASE}${endpoint}`, requestData);
      console.log('Model response:', res.data);
      setResults({ endpoint, data: requestData, result: res.data });
      setModelResults(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Model calculation failed';
      setError(`Model error: ${errorMsg}`);
      console.error('Model error:', err);
    } finally {
      setLoading(false);
    }
  }, [setModelResults, weatherData]);

  const generateGrid = useCallback(async (modelType) => {
    try {
      setGridLoading(0);
      setError(null);
      const form = modelType === 'plume' ? plumeForm : modelType === 'puff' ? puffForm : instantForm;
      
      const distances = [50, 100, 200, 300, 500, 1000];
      const offsets = [-50, -25, 0, 25, 50];
      const gridPoints = [];
      
      const promises = [];
      for (const x of distances) {
        for (const y of offsets) {
          const point = { ...form, x, y };
          const endpoint = modelType === 'instantaneous' ? '/model/instantaneous' : `/model/${modelType}`;
          promises.push(
            axios.post(`${API_BASE}${endpoint}`, point)
              .then(res => {
                gridPoints.push({
                  x,
                  y,
                  concentration: res.data.concentration,
                });
                setGridLoading(prev => prev + 1);
              })
              .catch(err => {
                console.error(`Grid point error at (${x}, ${y}):`, err);
              })
          );
        }
      }

      await Promise.all(promises);

      if (gridPoints.length === 0) {
        setError('Failed to generate grid data');
        return;
      }

      const maxConc = Math.max(...gridPoints.map((p) => p.concentration));
      const modelOutput = {
        type: modelType,
        grid: gridPoints,
        concentration: gridPoints.map((p) => p.concentration),
        max_concentration: maxConc,
        stability: modelType === 'instantaneous' ? instantForm.stability : 'N/A',
        metadata: {
          wind_speed: weatherData?.wind_speed,
          wind_direction: weatherData?.wind_direction,
          temperature: weatherData?.temperature,
          stability_class: modelType === 'instantaneous' ? instantForm.stability : 'D',
          release_height: form.H,
          source_strength: form.Q
        }
      };
      setResults({
        type: 'grid',
        modelType,
        gridData: gridPoints,
        maxConcentration: maxConc,
      });
      setModelResults(modelOutput);
    } catch (err) {
      setError(`Grid generation error: ${err.message}`);
      console.error('Grid error:', err);
    } finally {
      setGridLoading(0);
    }
  }, [plumeForm, puffForm, instantForm, setModelResults, weatherData]);

  const getGridProgress = () => {
    const total = 6 * 5; // 6 distances x 5 offsets
    return (gridLoading / total) * 100;
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ModelTrainIcon /> Dispersion Modeling
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">{error}</Typography>
      </Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={tab} 
          onChange={(e, val) => setTab(val)} 
          sx={{ borderBottom: '1px solid #e0e0e0' }}
          variant="fullWidth"
        >
          <Tab label="Plume Model" />
          <Tab label="Puff Model" />
          <Tab label="Instantaneous Release" />
        </Tabs>
      </Paper>

      {/* Model Status */}
      {(loading || gridLoading > 0) && (
        <Box sx={{ width: '100%', mb: 2 }}>
          {loading && <LinearProgress />}
          {gridLoading > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Calculating grid points... {Math.round(getGridProgress())}%
              </Typography>
              <LinearProgress variant="determinate" value={getGridProgress()} />
            </>
          )}
        </Box>
      )}

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
                    size="small"
                  />
                  <TextField
                    label="Crosswind Distance (m)"
                    type="number"
                    value={plumeForm.y}
                    onChange={(e) => setPlumeForm({ ...plumeForm, y: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Height (m)"
                    type="number"
                    value={plumeForm.z}
                    onChange={(e) => setPlumeForm({ ...plumeForm, z: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Emission Rate Q (g/s)"
                    type="number"
                    value={plumeForm.Q}
                    onChange={(e) => setPlumeForm({ ...plumeForm, Q: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Wind Speed u (m/s)"
                    type="number"
                    value={plumeForm.u}
                    onChange={(e) => setPlumeForm({ ...plumeForm, u: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Stack Height H (m)"
                    type="number"
                    value={plumeForm.H}
                    onChange={(e) => setPlumeForm({ ...plumeForm, H: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Lateral Sigma sy (m)"
                    type="number"
                    value={plumeForm.sy}
                    onChange={(e) => setPlumeForm({ ...plumeForm, sy: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Vertical Sigma sz (m)"
                    type="number"
                    value={plumeForm.sz}
                    onChange={(e) => setPlumeForm({ ...plumeForm, sz: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={() => runModel('/model/plume', plumeForm)}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Run Plume Model'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => generateGrid('plume')}
                    disabled={loading || gridLoading > 0}
                    fullWidth
                  >
                    {gridLoading > 0 ? `Generating... ${Math.round(getGridProgress())}%` : 'Generate Grid'}
                  </Button>
                  {gridLoading > 0 && <LinearProgress variant="determinate" value={getGridProgress()} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results && results.type !== 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Result</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mt: 2 }}>
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
                  <Typography variant="h6" gutterBottom>Grid Results</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Max Concentration: <strong>{results.maxConcentration.toFixed(4)}</strong> µg/m³
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
                    size="small"
                  />
                  <TextField
                    label="Crosswind Distance (m)"
                    type="number"
                    value={puffForm.y}
                    onChange={(e) => setPuffForm({ ...puffForm, y: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Height (m)"
                    type="number"
                    value={puffForm.z}
                    onChange={(e) => setPuffForm({ ...puffForm, z: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Emission Rate Q (g/s)"
                    type="number"
                    value={puffForm.Q}
                    onChange={(e) => setPuffForm({ ...puffForm, Q: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Wind Speed u (m/s)"
                    type="number"
                    value={puffForm.u}
                    onChange={(e) => setPuffForm({ ...puffForm, u: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Stack Height H (m)"
                    type="number"
                    value={puffForm.H}
                    onChange={(e) => setPuffForm({ ...puffForm, H: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Time Since Release (s)"
                    type="number"
                    value={puffForm.t}
                    onChange={(e) => setPuffForm({ ...puffForm, t: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Lateral Sigma sy (m)"
                    type="number"
                    value={puffForm.sy}
                    onChange={(e) => setPuffForm({ ...puffForm, sy: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Vertical Sigma sz (m)"
                    type="number"
                    value={puffForm.sz}
                    onChange={(e) => setPuffForm({ ...puffForm, sz: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={() => runModel('/model/puff', puffForm)}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Run Puff Model'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => generateGrid('puff')}
                    disabled={loading || gridLoading > 0}
                    fullWidth
                  >
                    {gridLoading > 0 ? `Generating... ${Math.round(getGridProgress())}%` : 'Generate Grid'}
                  </Button>
                  {gridLoading > 0 && <LinearProgress variant="determinate" value={getGridProgress()} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results && results.type !== 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Result</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mt: 2 }}>
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
                  <Typography variant="h6" gutterBottom>Grid Results</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Max Concentration: <strong>{results.maxConcentration.toFixed(4)}</strong> µg/m³
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.gridData.slice(0, 20)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="concentration" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
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
                    size="small"
                  />
                  <TextField
                    label="Crosswind Distance (m)"
                    type="number"
                    value={instantForm.y}
                    onChange={(e) => setInstantForm({ ...instantForm, y: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Height (m)"
                    type="number"
                    value={instantForm.z}
                    onChange={(e) => setInstantForm({ ...instantForm, z: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Total Amount Released Q (g)"
                    type="number"
                    value={instantForm.Q}
                    onChange={(e) => setInstantForm({ ...instantForm, Q: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Wind Speed u (m/s)"
                    type="number"
                    value={instantForm.u}
                    onChange={(e) => setInstantForm({ ...instantForm, u: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Stack Height H (m)"
                    type="number"
                    value={instantForm.H}
                    onChange={(e) => setInstantForm({ ...instantForm, H: parseFloat(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                  <FormControl fullWidth size="small">
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
                  <Button
                    variant="contained"
                    onClick={() => runModel('/model/instantaneous', instantForm)}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Run Instantaneous Model'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => generateGrid('instantaneous')}
                    disabled={loading || gridLoading > 0}
                    fullWidth
                  >
                    {gridLoading > 0 ? `Generating... ${Math.round(getGridProgress())}%` : 'Generate Grid'}
                  </Button>
                  {gridLoading > 0 && <LinearProgress variant="determinate" value={getGridProgress()} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results && results.type !== 'grid' && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Result</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mt: 2 }}>
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
                  <Typography variant="h6" gutterBottom>Grid Results</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Max Concentration: <strong>{results.maxConcentration.toFixed(4)}</strong> µg/m³
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.gridData.slice(0, 20)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="concentration" fill="#ffc658" />
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