# Changelog

## [1.0.0] - 2023-11-21

### Major Changes
- **Backend Refactoring**: The Python Flask backend has been completely replaced with a more robust and scalable Java Spring Boot application. This provides a more structured and maintainable codebase for future development.
- **Map Integration**: The mapping component has been migrated from Mapbox to OpenStreetMaps, using `react-leaflet`. This removes the need for a Mapbox access token and aligns with open-source alternatives.

### Frontend Improvements
- **UI Refresh**: The user interface has been updated and improved with the Material UI component library for a more modern and consistent look and feel.
- **API Integration**: The frontend has been updated to communicate with the new Java backend, including new endpoints for `events` and `chemicals`.
- **Dependency Updates**: The frontend dependencies have been updated to their latest versions, and `react-leaflet-heatmap-layer-v3` has been added for plume visualization.

### Project Cleanup
- **Removed Old Backend**: The `backend` directory containing the old Python code has been completely removed.
- **Removed Virtual Environment**: All references to a Python virtual environment (`venv`) have been removed from the project.
- **Documentation**: Added comprehensive documentation, including `README.md` files for each part of the project, as well as `PREINSTALL.md`, `POSTINSTALL.md`, and this `CHANGELOG.md`.
