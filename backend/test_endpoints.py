import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).resolve().parent))

from main import app

client = TestClient(app)

@pytest.mark.parametrize("endpoint", [
    ("/weather", "GET"),
    ("/stations", "GET"),
    ("/stations", "POST"),
])
def test_endpoints(endpoint):
    url, method = endpoint
    if method == "GET":
        response = client.get(url)
    elif method == "POST":
        response = client.post(url, json={"name": "Test Station", "latitude": 0.0, "longitude": 0.0})

    assert response.status_code in [200, 201], f"Failed at {url} with status {response.status_code}"

if __name__ == "__main__":
    pytest.main()