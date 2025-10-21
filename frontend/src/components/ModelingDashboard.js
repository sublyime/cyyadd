import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wind, Thermometer, Droplets, Gauge, Activity, TrendingUp } from 'lucide-react';
import MapView from './MapView';
import WeatherDisplay from './WeatherDisplay';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const calculateStabilityClass = (temperature, windSpeed, cloudCover) => {
  // Simple stability class determination based on wind speed and cloud cover
  if (windSpeed < 2) return 'F';  // Very stable
  if (windSpeed < 3) return 'E';  // Stable
  if (windSpeed < 5) return 'D';  // Neutral
  if (windSpeed < 6) return 'C';  // Slightly unstable
  if (windSpeed < 8) return 'B';  // Unstable
  return 'A';  // Very unstable
};

const ModelingDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [modelResults, setModelResults] = useState(null);
  const [events] = useState([
    { id: 1, chemical: 'SO2', type: 'continuous', lat: 39.8283, lon: -98.5795, amount: 150.5, time: new Date() },
    { id: 2, chemical: 'NO2', type: 'instantaneous', lat: 39.9283, lon: -98.6795, amount: 85.2, time: new Date() }
  ]);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const pulseOpacity = 0.5 + Math.sin(animationFrame / 10) * 0.3;

  const handleMapClick = (latlng) => {
    console.log('ModelingDashboard: Map clicked at', latlng);
    
    // Update location
    setSelectedLocation({
      lat: latlng.lat,
      lng: latlng.lng
    });
    
    // Set weather data for the clicked location
    const defaultWeather = {
      wind_speed: 2.9,          // mph
      wind_direction: 270,      // degrees (W)
      temperature: 83.1,        // °F
      humidity: 79.9,           // %
      pressure: 30.06,          // inHg
      stability_class: '1/2',   // From image
      location: {
        lat: latlng.lat.toFixed(4),
        lng: latlng.lng.toFixed(4)
      }
    };
    
    console.log('ModelingDashboard: Setting weather data', defaultWeather);
    setWeatherData(defaultWeather);
    setShowEventDialog(true);
  };

  const runSimulation = async () => {
    if (!selectedLocation || !weatherData) {
      addNotification('Please select a location and weather data first', 'error');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/model/run`, {
        lat: selectedLocation.lat,
        lon: selectedLocation.lng,
        weather: weatherData,
        // Add other necessary parameters here
      });
      
      setModelResults(response.data);
      addNotification('Simulation completed successfully', 'success');
    } catch (err) {
      addNotification('Failed to run simulation: ' + err.message, 'error');
    }
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Weather Display */}
      <WeatherDisplay weatherData={weatherData} />

      {/* Notifications */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView
          weatherData={weatherData}
          modelResults={modelResults}
          onMapClick={handleMapClick}
          showEventDialog={showEventDialog}
        />
      </div>

      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {/* Event Dialog */}
        <Dialog open={showEventDialog} onClose={() => setShowEventDialog(false)}>
          <DialogTitle>New Dispersion Event</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Chemical</InputLabel>
              <Select value="" onChange={(e) => {}}>
                <MenuItem value="SO2">Sulfur Dioxide (SO2)</MenuItem>
                <MenuItem value="NO2">Nitrogen Dioxide (NO2)</MenuItem>
                <MenuItem value="CO">Carbon Monoxide (CO)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Amount (kg)"
              type="number"
              fullWidth
              margin="normal"
            />
            {weatherData && (
              <div style={{ marginTop: 16 }}>
                <Typography variant="subtitle1">Weather Conditions:</Typography>
                <Typography>Wind Speed: {weatherData.wind_speed} m/s</Typography>
                <Typography>Wind Direction: {weatherData.wind_direction}°</Typography>
                <Typography>Temperature: {weatherData.temperature}°C</Typography>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEventDialog(false)}>Cancel</Button>
            <Button onClick={runSimulation} color="primary">Run Simulation</Button>
          </DialogActions>
        </Dialog>

        {notifications.map(notif => (
          <div key={notif.id} style={{
            background: notif.type === 'success' ? '#10b981' : notif.type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease-out',
            fontWeight: 600
          }}>
            {notif.message}
          </div>
        ))}
      </div>

      {/* Navigation Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '16px 32px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity size={32} color="#667eea" />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1f2937' }}>
            Dispersion Modeling System
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {['dashboard', 'events', 'weather', 'modeling'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: 8,
                background: activeTab === tab 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: activeTab === tab ? 'white' : '#4b5563',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize',
                boxShadow: activeTab === tab ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {/* Header Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20,
              marginBottom: 32
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                padding: 24,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
                  <Wind size={120} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Wind size={24} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Wind Speed</span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>
                    {weatherData.wind_speed.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>m/s</div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: 16,
                padding: 24,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
                  <Thermometer size={120} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Thermometer size={24} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Temperature</span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>
                    {weatherData.temperature.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>°C</div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: 16,
                padding: 24,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
                  <Droplets size={120} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Droplets size={24} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Humidity</span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>
                    {weatherData.humidity}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>%</div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                borderRadius: 16,
                padding: 24,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
                  <Gauge size={120} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Gauge size={24} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Pressure</span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>
                    {weatherData.pressure.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>mb</div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              {/* Map Visualization */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 20,
                padding: 32,
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                position: 'relative',
                minHeight: 500
              }}>
                <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                  Live Dispersion Map
                </h2>
                
                <div style={{
                  width: '100%',
                  height: 400,
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                  borderRadius: 12,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #bae6fd'
                }}>
                  {/* Simulated map background */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                    opacity: 0.3
                  }} />
                  
                  {/* Concentration markers */}
                  {modelResults && [0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${20 + i * 15}%`,
                      top: `${30 + Math.sin(i) * 20}%`,
                      width: 60 + i * 10,
                      height: 60 + i * 10,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${
                        i < 2 ? 'rgba(74, 144, 226, 0.6)' :
                        i < 4 ? 'rgba(255, 215, 0, 0.6)' :
                        'rgba(255, 68, 68, 0.6)'
                      } 0%, transparent 70%)`,
                      opacity: pulseOpacity,
                      transform: `scale(${1 + Math.sin(animationFrame / 10 + i) * 0.1})`,
                      transition: 'all 0.3s ease',
                      boxShadow: `0 0 ${30 + i * 10}px ${
                        i < 2 ? 'rgba(74, 144, 226, 0.4)' :
                        i < 4 ? 'rgba(255, 215, 0, 0.4)' :
                        'rgba(255, 68, 68, 0.4)'
                      }`
                    }} />
                  ))}
                  
                  {/* Center marker */}
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 16,
                    height: 16,
                    background: '#ef4444',
                    borderRadius: '50%',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }} />
                  
                  {!modelResults && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: 16,
                      fontWeight: 600
                    }}>
                      <TrendingUp size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                      <div>Run a model to see dispersion results</div>
                    </div>
                  )}
                </div>

                {modelResults && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: 12,
                    border: '2px solid #fbbf24'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                          MAX CONCENTRATION
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#b45309' }}>
                          {modelResults.max_concentration.toFixed(4)} µg/m³
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>
                          Stability: <strong>{modelResults.stability}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#92400e' }}>
                          Updated: {modelResults.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Controls & Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Quick Actions */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                    Quick Actions
                  </h3>
                  
                  <button
                    onClick={runSimulation}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      border: 'none',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.3s ease',
                      marginBottom: 12
                    }}
                    onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                  >
                    🚀 Run Simulation
                  </button>
                  
                  <button
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      background: 'white',
                      color: '#4b5563',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginBottom: 12
                    }}
                    onMouseOver={e => e.target.style.borderColor = '#667eea'}
                    onMouseOut={e => e.target.style.borderColor = '#e5e7eb'}
                  >
                    📊 Export Data
                  </button>
                  
                  <button
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      background: 'white',
                      color: '#4b5563',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={e => e.target.style.borderColor = '#667eea'}
                    onMouseOut={e => e.target.style.borderColor = '#e5e7eb'}
                  >
                    🔄 Refresh Weather
                  </button>
                </div>

                {/* Concentration Legend */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                    Concentration Scale
                  </h3>
                  
                  {[
                    { color: '#4A90E2', label: 'Very Low', range: '< 20%', value: 15 },
                    { color: '#50C878', label: 'Low', range: '20-40%', value: 30 },
                    { color: '#FFD700', label: 'Medium', range: '40-60%', value: 50 },
                    { color: '#FF8C00', label: 'High', range: '60-80%', value: 70 },
                    { color: '#FF4444', label: 'Very High', range: '> 80%', value: 90 }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 16,
                      padding: 12,
                      background: idx % 2 === 0 ? '#f9fafb' : 'transparent',
                      borderRadius: 8,
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        background: item.color,
                        borderRadius: '50%',
                        marginRight: 16,
                        boxShadow: `0 4px 12px ${item.color}40`,
                        border: '3px solid white',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 2 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {item.range}
                        </div>
                      </div>
                      <div style={{
                        background: '#e5e7eb',
                        borderRadius: 8,
                        height: 8,
                        width: 100,
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: item.color,
                          height: '100%',
                          width: `${item.value}%`,
                          transition: 'width 1s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                  Release Events
                </h2>
                <button style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  + New Event
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: 16, textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 12 }}>
                        CHEMICAL
                      </th>
                      <th style={{ padding: 16, textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 12 }}>
                        TYPE
                      </th>
                      <th style={{ padding: 16, textAlign: 'right', fontWeight: 700, color: '#6b7280', fontSize: 12 }}>
                        LOCATION
                      </th>
                      <th style={{ padding: 16, textAlign: 'right', fontWeight: 700, color: '#6b7280', fontSize: 12 }}>
                        AMOUNT (g)
                      </th>
                      <th style={{ padding: 16, textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 12 }}>
                        TIME
                      </th>
                      <th style={{ padding: 16, textAlign: 'center', fontWeight: 700, color: '#6b7280', fontSize: 12 }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, idx) => (
                      <tr key={event.id} style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: idx % 2 === 0 ? '#fafafa' : 'white',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fafafa' : 'white'}
                      >
                        <td style={{ padding: 16 }}>
                          <div style={{ fontWeight: 700, color: '#1f2937' }}>{event.chemical}</div>
                        </td>
                        <td style={{ padding: 16 }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: event.type === 'continuous' ? '#dbeafe' : '#fee2e2',
                            color: event.type === 'continuous' ? '#1e40af' : '#991b1b'
                          }}>
                            {event.type}
                          </span>
                        </td>
                        <td style={{ padding: 16, textAlign: 'right', fontSize: 14, color: '#4b5563' }}>
                          {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
                        </td>
                        <td style={{ padding: 16, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                          {event.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: 16, fontSize: 14, color: '#6b7280' }}>
                          {event.time.toLocaleTimeString()}
                        </td>
                        <td style={{ padding: 16, textAlign: 'center' }}>
                          <button style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: 6,
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 12
                          }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modeling' && (
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
              {/* Parameters Panel */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 20,
                padding: 32,
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                height: 'fit-content'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                  Model Parameters
                </h2>

                {['Downwind Distance (m)', 'Crosswind Distance (m)', 'Height (m)', 'Emission Rate Q (g/s)', 'Wind Speed u (m/s)', 'Stack Height H (m)'].map((label, idx) => (
                  <div key={idx} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#4b5563' }}>
                      {label}
                    </label>
                    <input
                      type="number"
                      defaultValue={[100, 0, 1.5, 10, 5, 50][idx]}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: 10,
                        fontSize: 16,
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = '#667eea'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                ))}

                <button
                  onClick={runSimulation}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    marginTop: 8
                  }}
                >
                  Run Model
                </button>
              </div>

              {/* Results Panel */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 20,
                padding: 32,
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                  Results Visualization
                </h2>

                <div style={{
                  width: '100%',
                  height: 400,
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #bbf7d0'
                }}>
                  {modelResults ? (
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                      <div style={{ fontSize: 48, fontWeight: 800, color: '#15803d', marginBottom: 8 }}>
                        {modelResults.max_concentration.toFixed(4)}
                      </div>
                      <div style={{ fontSize: 18, color: '#166534', fontWeight: 600 }}>
                        µg/m³
                      </div>
                      <div style={{ marginTop: 24, fontSize: 14, color: '#4b5563' }}>
                        Stability Class: {modelResults.stability}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      <Activity size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
                      <div style={{ fontSize: 18, fontWeight: 600 }}>
                        Configure parameters and run model
                      </div>
                    </div>
                  )}
                  
                  {/* Animated background */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                    animation: 'pulse 3s ease-in-out infinite'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
        }

        button:active {
          transform: translateY(0);
        }

        input:focus {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ModelingDashboard;