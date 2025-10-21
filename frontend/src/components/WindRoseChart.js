import React from 'react';
import { Box, useTheme } from '@mui/material';

const WindRoseChart = ({ windSpeed, windDirection, size = 150 }) => {
  const theme = useTheme();
  const radius = size / 2 - 10;
  const center = { x: size / 2, y: size / 2 };
  
  // Convert wind direction to radians (meteorological to mathematical)
  const angle = ((270 - windDirection) * Math.PI) / 180;
  
  // Calculate arrow endpoint
  const arrowLength = (windSpeed / 10) * radius; // Scale arrow length based on wind speed
  const endX = center.x + Math.cos(angle) * arrowLength;
  const endY = center.y + Math.sin(angle) * arrowLength;
  
  // Calculate arrow head points
  const headLength = 10;
  const headAngle = Math.PI / 6; // 30 degrees
  const head1X = endX - headLength * Math.cos(angle - headAngle);
  const head1Y = endY - headLength * Math.sin(angle - headAngle);
  const head2X = endX - headLength * Math.cos(angle + headAngle);
  const head2Y = endY - headLength * Math.sin(angle + headAngle);

  return (
    <Box sx={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size}>
        {/* Compass ring */}
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke={theme.palette.divider}
          strokeWidth="1"
        />
        
        {/* Cardinal directions */}
        <text x={center.x} y={20} textAnchor="middle" fill={theme.palette.text.secondary}>N</text>
        <text x={size - 10} y={center.y + 5} textAnchor="middle" fill={theme.palette.text.secondary}>E</text>
        <text x={center.x} y={size - 10} textAnchor="middle" fill={theme.palette.text.secondary}>S</text>
        <text x={10} y={center.y + 5} textAnchor="middle" fill={theme.palette.text.secondary}>W</text>
        
        {/* Wind vector */}
        <line
          x1={center.x}
          y1={center.y}
          x2={endX}
          y2={endY}
          stroke={theme.palette.primary.main}
          strokeWidth="2"
        />
        
        {/* Arrow head */}
        <line
          x1={endX}
          y1={endY}
          x2={head1X}
          y2={head1Y}
          stroke={theme.palette.primary.main}
          strokeWidth="2"
        />
        <line
          x1={endX}
          y1={endY}
          x2={head2X}
          y2={head2Y}
          stroke={theme.palette.primary.main}
          strokeWidth="2"
        />
        
        {/* Wind speed label */}
        <text
          x={center.x}
          y={center.y - radius - 5}
          textAnchor="middle"
          fill={theme.palette.text.primary}
          fontSize="12"
        >
          {`${windSpeed} m/s`}
        </text>
      </svg>
    </Box>
  );
};

export default WindRoseChart;