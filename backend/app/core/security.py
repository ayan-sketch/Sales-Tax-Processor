from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import jwt
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        logger.info(f"=== JWT DECODE START ===")
        logger.info(f"Token (first 30 chars): {token[:30]}...")
        logger.info(f"Token length: {len(token)}")
        logger.info(f"Algorithm: {settings.JWT_ALGORITHM}")
        logger.info(f"Secret (first 10 chars): {settings.JWT_SECRET[:10]}...")
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        logger.info(f"=== JWT DECODE SUCCESS ===")
        logger.info(f"Payload keys: {list(payload.keys())}")
        logger.info(f"sub (username): {payload.get('sub')}")
        logger.info(f"user_id: {payload.get('user_id')}")
        logger.info(f"exp (epoch): {payload.get('exp')}")
        logger.info(f"iat (epoch): {payload.get('iat')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.error("=== JWT DECODE FAILED: ExpiredSignatureError ===")
        logger.error(f"Token has expired. The exp claim indicates token should no longer be accepted.")
        return {}
    except jwt.JWTClaimsError as e:
        logger.error(f"=== JWT DECODE FAILED: JWTClaimsError ===")
        logger.error(f"Claims error: {e}")
        return {}
    except Exception as e:
        logger.error(f"=== JWT DECODE FAILED: {type(e).__name__} ===")
        logger.error(f"Error: {e}")
        return {}
