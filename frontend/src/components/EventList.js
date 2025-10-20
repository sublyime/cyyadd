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
  IconButton,
  TablePagination,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    chemical: null,
    type: 'continuous',
    lat: '',
    lon: '',
    amount: '',
    heat: '',
    terrain: '',
  });

  const [chemicals, setChemicals] = useState([]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/events`);
      setEvents(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events. Please try again later.');
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChemicals = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/chemicals`);
      setChemicals(res.data);
    } catch (err) {
      console.warn('Chemicals endpoint not fully available:', err.message);
      // Fallback to some default chemicals
      setChemicals([
        { id: 1, name: 'SO2', state: 'gas' },
        { id: 2, name: 'NO2', state: 'gas' },
        { id: 3, name: 'PM2.5', state: 'particulate' },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchChemicals();
  }, [fetchEvents, fetchChemicals]);

  const handleAddEvent = async () => {
    if (!formData.chemical || !formData.lat || !formData.lon || !formData.amount) {
      setError('Missing required fields');
      return;
    }

    try {
      setLoading(true);
      const eventPayload = {
        chemical: formData.chemical,
        type: formData.type,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
        amount: parseFloat(formData.amount),
        heat: formData.heat ? parseFloat(formData.heat) : 0,
        terrain: formData.terrain,
      };

      await axios.post(`${API_BASE}/events`, eventPayload);
      
      setFormData({
        chemical: null,
        type: 'continuous',
        lat: '',
        lon: '',
        amount: '',
        heat: '',
        terrain: '',
      });
      setOpenDialog(false);
      await fetchEvents();
      setError(null);
    } catch (err) {
      setError(`Failed to create event: ${err.response?.data?.message || err.message}`);
      console.error('Create event error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        await axios.delete(`${API_BASE}/events/${id}`);
        await fetchEvents();
      } catch (err) {
        setError(`Failed to delete event: ${err.message}`);
        console.error('Delete event error:', err);
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEventTypeColor = (type) => {
    const colors = {
      continuous: 'primary',
      instantaneous: 'error',
      puff: 'warning',
    };
    return colors[type] || 'default';
  };

  const displayedEvents = events.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
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
              <>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Chemical</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell align="right"><strong>Location</strong></TableCell>
                      <TableCell align="right"><strong>Amount (g)</strong></TableCell>
                      <TableCell><strong>Time</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedEvents.map((event) => (
                      <TableRow key={event.id} hover>
                        <TableCell>
                          <strong>{event.chemical?.name || 'Unknown'}</strong>
                          {event.chemical?.state && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              ({event.chemical.state})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.type}
                            color={getEventTypeColor(event.type)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {event.lat?.toFixed(4)}, {event.lon?.toFixed(4)}
                        </TableCell>
                        <TableCell align="right">{event.amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          {event.time ? new Date(event.time).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Delete event"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={events.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
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
              value={formData.chemical?.id || ''}
              onChange={(e) => {
                const selected = chemicals.find(c => c.id === e.target.value);
                setFormData({ ...formData, chemical: selected });
              }}
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
                size="small"
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
                size="small"
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
            size="small"
          />

          <TextField
            label="Heat Release (optional, BTU/s)"
            type="number"
            value={formData.heat}
            onChange={(e) => setFormData({ ...formData, heat: e.target.value })}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
            size="small"
          />

          <TextField
            label="Terrain Description"
            value={formData.terrain}
            onChange={(e) => setFormData({ ...formData, terrain: e.target.value })}
            fullWidth
            multiline
            rows={2}
            size="small"
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