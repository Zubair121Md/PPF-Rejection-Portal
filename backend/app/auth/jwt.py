from datetime import datetime, timedelta
from typing import Any, Dict
from uuid import UUID

from jose import jwt, JWTError

from ..config import get_settings
from ..models import UserRole
from ..schemas import TokenData


settings = get_settings()


def create_access_token(*, user_id: UUID, role: UserRole) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expires_minutes)
    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role.value,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_access_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        role = payload.get("role")
        if user_id is None or role is None:
            raise JWTError("Invalid token payload")
        return TokenData(user_id=UUID(user_id), role=UserRole(role))
    except JWTError as e:
        raise e

