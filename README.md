# Dispersion Modeling Platform

## Overview
This project provides a web-based platform for atmospheric dispersion modeling, offering real-time visualization and analysis of pollutant plumes. It combines a Java backend with a React frontend to deliver a responsive and interactive user experience.

## Features
- **Backend**: Java Spring Boot application for robust data processing and API services.
- **Frontend**: React application for a dynamic and responsive user interface.
- **Mapping**: Interactive maps using OpenStreetMaps and `react-leaflet` for plume visualization.
- **API Endpoints**: Comprehensive API for managing weather data, model results, and event simulations.

## Project Structure
- `java-backend/`: Contains the Spring Boot application.
- `frontend/`: Contains the React frontend application.

## Setup and Installation

### Prerequisites
- Java 17 or later
- Maven 3.6 or later
- Node.js 16 or later
- npm 8 or later

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/dispersion-modeling-platform.git
   cd dispersion-modeling-platform
   ```

2. **Install all dependencies:**
   ```sh
   npm run install:all
   ```

## Running the Application

1. **Start the backend server:**
   ```sh
   npm run start:backend
   ```
   The backend will be available at `http://localhost:8080`.

2. **Start the frontend application:**
   ```sh
   npm run start:frontend
   ```
   The frontend will be available at `http://localhost:3000`.

## Building for Production

1. **Build the frontend:**
   ```sh
   npm run build:frontend
   ```
   The optimized static assets will be placed in `frontend/build`.

2. **Build the backend:**
   ```sh
   npm run build:backend
   ```
   The executable JAR file will be located in `java-backend/target`.
