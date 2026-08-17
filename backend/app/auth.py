from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from app.database import get_db
from app.models import User
from app.services.auth import decode_access_token, get_user_by_id

security = HTTPBearer(auto_error=False)

PUBLIC_PATHS = {
    "/api/v1/health",
    "/api/v1/auth/login",
}


async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if path in PUBLIC_PATHS or not path.startswith("/api/v1"):
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    token = auth_header.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token)
    if not user_id:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    request.state.user_id = user_id
    return await call_next(request)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    user_id = getattr(request.state, "user_id", None)
    if not user_id and credentials:
        user_id = decode_access_token(credentials.credentials)

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user
