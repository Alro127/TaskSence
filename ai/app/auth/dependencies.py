"""FastAPI dependencies for authenticated AI endpoints."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_auth = HTTPBearer(
    scheme_name="BearerAuth",
    description="Paste ACCESS JWT token from TaskSense backend",
)


def get_current_user_id(
    request: Request,
    _: HTTPAuthorizationCredentials = Depends(bearer_auth),
) -> int:
    user_id = getattr(request.state, "user_id", None)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return int(user_id)


def get_current_jwt_token(
    request: Request,
    _: HTTPAuthorizationCredentials = Depends(bearer_auth),
) -> str:
    token = getattr(request.state, "jwt_token", None)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return str(token)
