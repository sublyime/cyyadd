import React from 'react';
import { Card, CardContent, Typography, Box, Paper } from '@mui/material';
import { Wind, Thermometer, Droplets, Gauge } from 'lucide-react';
import { styled } from '@mui/material/styles';
import WindRoseChart from './WindRoseChart';

const WeatherContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 80,
  left: 20,
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  width: '320px',
  maxWidth: '90vw'
}));

const WeatherCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)'
  }
});

const WeatherCardContent = styled(CardContent)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '12px'
});

const WindRoseContainer = styled(Box)({
  marginTop: '16px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '8px',
  padding: '8px'
});

const StabilityIndicator = styled(Typography)({
  marginTop: '8px',
  textAlign: 'center',
  color: 'rgba(0, 0, 0, 0.6)'
});

const WeatherDisplay = ({ weatherData }) => {
  if (!weatherData) return null;

  const cards = [
    {
      icon: Wind,
      label: 'Wind',
      value: weatherData.wind_speed || 0,
      unit: 'm/s',
      color: '#6366f1'
    },
    {
      icon: Thermometer,
      label: 'Temp',
      value: weatherData.temperature || 0,
      unit: '°C',
      color: '#ec4899'
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: weatherData.humidity || 0,
      unit: '%',
      color: '#0ea5e9'
    },
    {
      icon: Gauge,
      label: 'Pressure',
      value: weatherData.pressure || 0,
      unit: 'mb',
      color: '#f59e0b'
    }
  ];

  return (
    <WeatherContainer>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
        {cards.map(({ icon: Icon, label, value, unit, color }) => (
          <WeatherCard key={label}>
            <WeatherCardContent>
              <Icon size={24} color={color} />
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  {label}
                </Typography>
                <Typography variant="h6">
                  {value} {unit}
                </Typography>
              </div>
            </WeatherCardContent>
          </WeatherCard>
        ))}
      </Box>
      
      <WindRoseContainer>
        <WindRoseChart
          windSpeed={weatherData.wind_speed}
          windDirection={weatherData.wind_direction}
          size={150}
        />
      </WindRoseContainer>

      <StabilityIndicator variant="body2">
        Stability Class: {weatherData.stability_class || 'N/A'}
      </StabilityIndicator>
    </WeatherContainer>
  );
};

export default WeatherDisplay;