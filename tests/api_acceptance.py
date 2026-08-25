"""Final release API acceptance without paid model calls."""
from fastapi.testclient import TestClient
from src.api.server import app

client = TestClient(app)

def test_release_surface():
    root = client.get("/", follow_redirects=False)
    assert root.status_code in (302, 307)
    assert root.headers["location"] == "/demo/"
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"
    assert client.get("/demo/").status_code == 200
    capabilities = client.get("/api/v1/capabilities").json()
    assert capabilities["agents"] == capabilities["skills"] == 17
    assert len(capabilities["human_in_the_loop"]["checkpoints"]) == 3

def test_agents_skills_and_packs():
    experts = client.get("/api/v1/experts")
    skills = client.get("/api/v1/skills")
    packs = client.get("/api/v1/style-packs")
    assert experts.status_code == skills.status_code == packs.status_code == 200
    assert len(experts.json()) == skills.json()["count"] == 17
    assert len(packs.json()["packs"]) >= 4
