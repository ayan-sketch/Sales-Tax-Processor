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
from datetime import datetime

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if DEV_AUTH_DISABLED:
        # Prefer the seeded dev user, then any admin, then the first available user
        user = (
            db.query(User).filter(User.username == "zainkhan").first()
            or db.query(User).filter(User.role == "admin").first()
            or db.query(User).first()
        )
        if user:
            logger.info("Development auth bypass enabled; returning default dev user: %s", user.username)
            return user
        logger.warning("Development auth bypass enabled but no users exist in the database")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    

    logger.info("=== AUTH CHECK for request ===")
    logger.info(f"Token present: {token is not None}")
    if token:
        logger.info(f"Token first 20 chars: {token[:20]}...")
        logger.info(f"Token length: {len(token)}")

    payload = decode_access_token(token)

    if not payload:
        logger.error(f"=== AUTH FAILED: Token decode returned empty payload ===")
        logger.error(f"Token was None: {token is None}")
        raise credentials_exception

    username: str = payload.get("sub")
    user_id_raw = payload.get("user_id")

    logger.info(f"Decoded payload - sub: {username}, user_id: {user_id_raw}")

    if username is None:
        logger.error(f"=== AUTH FAILED: No 'sub' in payload ===")
        logger.error(f"Payload keys: {list(payload.keys())}")
        raise credentials_exception

    user = None
    if user_id_raw:
        logger.info(f"Looking up user by user_id: {user_id_raw}")
        user = db.query(User).filter(User.id == str(user_id_raw)).first()

    if user is None and user_id_raw:
        try:
            user = db.query(User).filter(User.id == UUID(str(user_id_raw))).first()
        except (ValueError, TypeError, AttributeError):
            pass

    if user is None:
        logger.info(f"Looking up user by username: {username}")
        user = db.query(User).filter(User.username == username).first()

    if user is None:
        logger.error(f"=== AUTH FAILED: No user found for username='{username}' ===")
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    try:
        user.last_activity_at = datetime.utcnow()
        db.commit()
    except Exception:
        db.rollback()

    return user

def is_admin(user: User) -> bool:
    return (user.role or "").lower() == "admin"


def scope_owned_clients(query, user: User):
    """Restrict a Client query to the current tenant; admins retain global access."""
    from app.models.client import Client
    return query if is_admin(user) else query.filter(Client.owner_id == str(user.id))


def scope_client_resource(query, model, user: User):
    """Restrict a client-linked model query through Client.owner_id."""
    if is_admin(user):
        return query
    from app.models.client import Client
    return query.join(Client, Client.id == model.client_id).filter(Client.owner_id == str(user.id))


def get_accessible_client(db: Session, client_id, user: User):
    from app.models.client import Client
    client = scope_owned_clients(db.query(Client), user).filter(Client.id == str(client_id)).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


def get_accessible_resource(db: Session, model, resource_id, user: User, detail: str = "Resource not found"):
    resource = scope_client_resource(db.query(model), model, user).filter(model.id == str(resource_id)).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return resource


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user
