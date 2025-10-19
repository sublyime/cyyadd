# Post-Installation Guide

After successfully installing the prerequisites and project dependencies, you are ready to run the Dispersion Modeling Platform.

## 1. Environment Configuration

### Backend Configuration
If you need to customize the backend configuration, such as the database connection or server port, you can modify the `application.properties` file located in `java-backend/src/main/resources/`.

### Frontend Configuration
The frontend is configured to connect to the backend at `http://localhost:8080/api`. If your backend is running on a different URL, you can create a `.env` file in the `frontend` directory and set the `REACT_APP_API_URL` variable:

```
REACT_APP_API_URL=http://your-backend-url/api
```

## 2. Running the Application

To run the entire platform, you will need to start both the backend and frontend servers.

### Start the Backend
1. **Open a terminal** and navigate to the `java-backend` directory:
   ```sh
   cd java-backend
   ```
2. **Start the Spring Boot application:**
   ```sh
   mvn spring-boot:run
   ```
   The backend will now be running at `http://localhost:8080`.

### Start the Frontend
1. **Open a second terminal** and navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```
2. **Start the React development server:**
   ```sh
   npm start
   ```
   The frontend will open in your browser at `http://localhost:3000`.

## 3. Accessing the Application
Once both servers are running, you can access the Dispersion Modeling Platform by navigating to `http://localhost:3000` in your web browser.
