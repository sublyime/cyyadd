# Java Spring Boot Backend for Dispersion Modeling

## Overview
This backend is a Spring Boot application that provides a RESTful API for the Dispersion Modeling Platform. It manages data for weather, chemical releases, atmospheric plumes, and monitoring stations.

## Features
- **REST API**: Exposes endpoints for creating, reading, and deleting data.
- **Data Models**: Defines the data structures for `Chemical`, `Event`, `Plume`, `Station`, and `Weather`.
- **Service Layer**: Contains the business logic for interacting with the data.
- **Repository Layer**: Uses Spring Data JPA for database interactions.

## API Endpoints
- `GET /api/stations`: Fetches all monitoring stations.
- `GET /api/plumes`: Fetches all plume data.
- `GET /api/weather`: Fetches all weather data.
- `GET /api/events`: Fetches all release events.
- `POST /api/events`: Creates a new release event.
- `DELETE /api/events/{id}`: Deletes a release event by its ID.
- `GET /api/chemicals`: Fetches all available chemicals.

## Setup and Running

### Prerequisites
- Java 17 or later
- Maven 3.6 or later

### Running the Application
1. **Navigate to the `java-backend` directory:**
   ```sh
   cd java-backend
   ```

2. **Run the application using Maven:**
   ```sh
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080`.

### Building the Application
To build the application into a JAR file, run the following command:
```sh
mvn package
```
The JAR file will be created in the `target` directory.
