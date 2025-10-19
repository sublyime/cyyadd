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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    chemical_id: '',
    type: 'continuous',
    lat: '',
    lon: '',
    amount: '',
    heat: '',
    terrain: '',
  });

  const [chemicals, setChemicals] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchChemicals();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/events`);
      setEvents(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChemicals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/chemicals`);
      setChemicals(res.data);
    } catch (err) {
      console.warn('Chemicals endpoint not available:', err.message);
    }
  };

  const handleAddEvent = async () => {
    if (!formData.chemical_id || !formData.lat || !formData.lon || !formData.amount) {
      setError('Missing required fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/events`, formData);
      setFormData({
        chemical_id: '',
        type: 'continuous',
        lat: '',
        lon: '',
        amount: '',
        heat: '',
        terrain: '',
      });
      setOpenDialog(false);
      fetchEvents();
      setError(null);
    } catch (err) {
      setError(`Failed to create event: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        await axios.delete(`${API_BASE}/events/${id}`);
        fetchEvents();
      } catch (err) {
        setError(`Failed to delete event: ${err.message}`);
      }
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      continuous: 'primary',
      instantaneous: 'error',
      puff: 'warning',
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon /> Release Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Event
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && !events.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            {events.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Chemical</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location (Lat, Lon)</TableCell>
                    <TableCell align="right">Amount (g)</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <strong>{event.chemical?.name || 'Unknown'}</strong>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.type}
                          color={getEventTypeColor(event.type)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {event.lat?.toFixed(4)}, {event.lon?.toFixed(4)}
                      </TableCell>
                      <TableCell align="right">{event.amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(event.time).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No release events recorded
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Release Event</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Chemical</InputLabel>
            <Select
              value={formData.chemical_id}
              onChange={(e) => setFormData({ ...formData, chemical_id: e.target.value })}
              label="Chemical"
            >
              {chemicals.map((chem) => (
                <MenuItem key={chem.id} value={chem.id}>
                  {chem.name} ({chem.state})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Release Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              label="Release Type"
            >
              <MenuItem value="continuous">Continuous</MenuItem>
              <MenuItem value="instantaneous">Instantaneous</MenuItem>
              <MenuItem value="puff">Puff</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Latitude"
                type="number"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                fullWidth
                inputProps={{ min: -90, max: 90, step: 0.0001 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Longitude"
                type="number"
                value={formData.lon}
                onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                fullWidth
                inputProps={{ min: -180, max: 180, step: 0.0001 }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Amount Released (g)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
          />

          <TextField
            label="Heat Release (optional, BTU/s)"
            type="number"
            value={formData.heat}
            onChange={(e) => setFormData({ ...formData, heat: e.target.value })}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
          />

          <TextField
            label="Terrain Description"
            value={formData.terrain}
            onChange={(e) => setFormData({ ...formData, terrain: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEvent} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventList;