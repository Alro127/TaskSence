"""Tests for security-sensitive settings defaults."""

from __future__ import annotations

from app.config.config import get_settings


def test_default_cors_origins_are_explicit(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert "*" not in settings.cors_origins
    assert "http://localhost:5173" in settings.cors_origins


def test_jwt_secret_has_no_committed_fallback(monkeypatch):
    monkeypatch.delenv("SECURITY_JWT_SECRET", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.jwt_secret == ""
