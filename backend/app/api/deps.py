from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID
from jose import jwt, JWTError
from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.core.config import settings
from app.core.dev_auth import DEV_AUTH_DISABLED
import logging

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if DEV_AUTH_DISABLED:
        user = db.query(User).filter(User.username == "zainkhan").first()
        if user:
            logger.info("Development auth bypass enabled; returning default dev user")
            return user

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Debug: Log token (masked) and secret used
    logger.info(f"=== AUTH DEBUG ===")
    logger.info(f"Token (prefix): {token[:20]}...")
    logger.info(f"JWT_SECRET (prefix): {settings.JWT_SECRET[:20]}...")
    logger.info(f"JWT_ALGORITHM: {settings.JWT_ALGORITHM}")
    
    payload = decode_access_token(token)
    logger.info(f"Decoded payload: {payload}")
    
    if not payload:
        logger.warning("Token decode failed - empty payload returned")
        raise credentials_exception
    
    username: str = payload.get("sub")
    user_id_raw = payload.get("user_id")
    logger.info(f"Claims - username: {username}, user_id: {user_id_raw}")
    
    if username is None:
        logger.warning("No 'sub' claim in payload")
        raise credentials_exception
    
    user = None
    if user_id_raw:
        # Debug: Try plain string comparison first (column is String(36))
        user = db.query(User).filter(User.id == str(user_id_raw)).first()
        logger.info(f"User lookup by id='{user_id_raw}': {'FOUND' if user else 'NOT FOUND'}")

    if user is None and user_id_raw:
        # Fallback: try UUID object for backward compatibility
        try:
            user = db.query(User).filter(User.id == UUID(str(user_id_raw))).first()
            logger.info(f"User lookup by UUID('{user_id_raw}'): {'FOUND' if user else 'NOT FOUND'}")
        except (ValueError, TypeError, AttributeError) as e:
            logger.warning(f"UUID conversion failed for '{user_id_raw}': {e}")

    if user is None:
        user = db.query(User).filter(User.username == username).first()
        logger.info(f"User lookup by username '{username}': {'FOUND' if user else 'NOT FOUND'}")

    if user is None:
        logger.warning("User not found by any method - raising 401")
        raise credentials_exception
    
    logger.info(f"Authenticated user: {user.id} / {user.username} / active={user.is_active}")
    
    if not user.is_active:
        logger.warning(f"User {user.username} is inactive - raising 403")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    logger.info(f"Authentication SUCCESS for {user.username}")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user