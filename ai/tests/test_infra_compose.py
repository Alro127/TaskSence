"""Regression checks for infra Docker compose wiring."""

from __future__ import annotations

from pathlib import Path


COMPOSE = Path(__file__).resolve().parents[2] / "infra" / "docker" / "compose.yaml"


def _compose_text() -> str:
    return COMPOSE.read_text(encoding="utf-8")


def test_infra_compose_uses_declared_service_hostnames():
    text = _compose_text()

    assert "jdbc:postgresql://tasksense-postgres:5432/taskdb" in text
    assert "psql -h tasksense-postgres" in text
    assert "SPRING_DATA_REDIS_HOST: tasksense-redis" in text
    assert "jdbc:postgresql://postgres:5432/taskdb" not in text
    assert "psql -h postgres" not in text
    assert "SPRING_DATA_REDIS_HOST: redis" not in text


def test_infra_compose_supplies_ai_database_and_auth_env():
    text = _compose_text()

    for expected in [
        "POSTGRES_HOST: tasksense-postgres",
        "POSTGRES_PORT: 5432",
        "POSTGRES_DB: taskdb",
        "POSTGRES_USER: postgres",
        "POSTGRES_PASSWORD: postgres",
        "POSTGRES_SSLMODE: disable",
        "SECURITY_JWT_SECRET: ${SECURITY_JWT_SECRET:?SECURITY_JWT_SECRET is required}",
    ]:
        assert expected in text


def test_spring_healthcheck_matches_controller_path():
    text = _compose_text()

    assert "http://localhost:8080/api/v1/health" in text
    assert "http://localhost:8080/api/v1/health/status" not in text
