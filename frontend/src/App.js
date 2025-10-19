import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './components/MapView';
import EventList from './components/EventList';
import WeatherPanel from './components/WeatherPanel';
import ModelingPanel from './components/ModelingPanel';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [modelResults, setModelResults] = useState(null);

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route 
            path="/" 
            element={<MapView modelResults={modelResults} weatherData={weatherData} />} 
          />
          <Route 
            path="/events" 
            element={<EventList />} 
          />
          <Route 
            path="/weather" 
            element={<WeatherPanel setWeatherData={setWeatherData} />} 
          />
          <Route 
            path="/modeling" 
            element={<ModelingPanel setModelResults={setModelResults} weatherData={weatherData} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;