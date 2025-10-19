# Dispersion Modeling Backend

## Features
- FastAPI backend
- PostgreSQL + PostGIS spatial support
- SQLAlchemy ORM
- Alembic migrations
- Models: Chemicals, Release Events, Weather Data, Audit Logs

## Setup
1. Ensure PostgreSQL is running with PostGIS enabled.
2. Set credentials in `.env` (already set for you).
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Run Alembic migrations to create tables:
   ```sh
   alembic upgrade head
   ```
5. Start the API:
   ```sh
   uvicorn main:app --reload
   ```

## Environment Variables
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- POSTGRES_HOST
- POSTGRES_PORT

## Notes
- Make sure your database has PostGIS enabled: `CREATE EXTENSION postgis;`
- This backend is ready for further API and modeling logic.
