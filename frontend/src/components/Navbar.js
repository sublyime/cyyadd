import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import EventIcon from '@mui/icons-material/Event';
import CloudIcon from '@mui/icons-material/Cloud';
import ModelTrainIcon from '@mui/icons-material/ModelTraining';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';

const Navbar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpMenuAnchor, setHelpMenuAnchor] = useState(null);

  const menuItems = [
    { label: 'Map', icon: <MapIcon />, path: '/' },
    { label: 'Events', icon: <EventIcon />, path: '/events' },
    { label: 'Weather', icon: <CloudIcon />, path: '/weather' },
    { label: 'Modeling', icon: <ModelTrainIcon />, path: '/modeling' },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleHelpMenuOpen = (e) => {
    setHelpMenuAnchor(e.currentTarget);
  };

  const handleHelpMenuClose = () => {
    setHelpMenuAnchor(null);
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            🌫️ Dispersion Modeling System
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                color="inherit"
                onClick={handleHelpMenuOpen}
                startIcon={<InfoIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Help
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box
          sx={{
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6">Menu</Typography>
            <IconButton
              onClick={() => setMobileMenuOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1 }}>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.path}
                onClick={() => handleMenuClick(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>

          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              fullWidth
              startIcon={<InfoIcon />}
              onClick={() => {
                setMobileMenuOpen(false);
                handleHelpMenuOpen({ currentTarget: document.body });
              }}
            >
              Help
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Help Menu */}
      <Menu
        anchorEl={helpMenuAnchor}
        open={Boolean(helpMenuAnchor)}
        onClose={handleHelpMenuClose}
      >
        <MenuItem onClick={handleHelpMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} />
          About
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open('https://docs.example.com', '_blank');
            handleHelpMenuClose();
          }}
        >
          <InfoIcon sx={{ mr: 1 }} />
          Documentation
        </MenuItem>
        <MenuItem onClick={handleHelpMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;