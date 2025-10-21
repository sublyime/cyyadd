import React, { useState } from 'react';
import { 
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Outlet
} from 'react-router-dom';
import MapView from './components/MapView';
import EventList from './components/EventList';
import WeatherPanel from './components/WeatherPanel';
import ModelingPanel from './components/ModelingPanel';
import Navbar from './components/Navbar';
import './App.css';

function Layout() {
  return (
    <div className="App">
      <Navbar />
      <Outlet />
    </div>
  );
}

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [modelResults, setModelResults] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapClick = (location, weather) => {
    console.log('Map clicked:', { location, weather });
    setSelectedLocation(location);
    setWeatherData(weather);
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Layout />}>
        <Route 
          index
          element={
            <MapView 
              weatherData={weatherData} 
              modelResults={modelResults}
              selectedLocation={selectedLocation}
              onMapClick={handleMapClick}
            />
          }
        />
        <Route 
          path="events" 
          element={<EventList />} 
        />
        <Route 
          path="weather" 
          element={<WeatherPanel setWeatherData={setWeatherData} />}
        />
        <Route 
          path="modeling" 
          element={<ModelingPanel setModelResults={setModelResults} />}
        />
      </Route>
    ),
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );

  return <RouterProvider router={router} />;
}

export default App;