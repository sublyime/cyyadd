import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './components/MapView';
import EventList from './components/EventList';
import WeatherPanel from './components/WeatherPanel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/weather" element={<WeatherPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
