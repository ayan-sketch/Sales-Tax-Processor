"""Reset the default admin password without wiping other data."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

USERNAME = "zainkhan"
PASSWORD = "zk@123"

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == USERNAME).first()
    if not user:
        print(f"[ERROR] User '{USERNAME}' not found. Run reset_db.py first.")
        raise SystemExit(1)

    user.password_hash = get_password_hash(PASSWORD)
    db.commit()
    print(f"[OK] Password updated for user '{USERNAME}'.")
    print(f"     Login with username: {USERNAME}")
    print(f"     Password: {PASSWORD}")
finally:
    db.close()
