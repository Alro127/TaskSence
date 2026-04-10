"""JWT authentication middleware for the AI service."""

from __future__ import annotations

import logging
from typing import Any

import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

_EXEMPT_PATHS = {
    "/health",
    "/openapi.json",
    "/docs",
    "/docs/oauth2-redirect",
    "/redoc",
}


class JwtAuthMiddleware(BaseHTTPMiddleware):
    """Require a valid Bearer token and attach verified claims to request.state."""

    def __init__(self, app: ASGIApp, secret: str) -> None:
        super().__init__(app)
        self._secret = secret

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in _EXEMPT_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return _unauthorized("Missing Bearer token")

        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            return _unauthorized("Missing Bearer token")

        try:
            claims: dict[str, Any] = jwt.decode(token, self._secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return _unauthorized("Token has expired")
        except jwt.InvalidTokenError:
            return _unauthorized("Invalid token")

        if claims.get("type") != "ACCESS":
            return _unauthorized("Invalid token type")

        raw_user_id = claims.get("userId")
        try:
            user_id = int(raw_user_id)
        except (TypeError, ValueError):
            return _unauthorized("Token missing userId claim")

        request.state.user_id = user_id
        request.state.jwt_claims = claims
        request.state.jwt_token = token

        return await call_next(request)


def _unauthorized(detail: str) -> JSONResponse:
    logger.warning("[auth] unauthorized request: %s", detail)
    return JSONResponse(status_code=401, content={"detail": detail})
