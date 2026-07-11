"""Reset and initialize the SQLite database with tables and seed user."""
import sys
import os

# Ensure we can import from the backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, Base
from app.models.user import User
from app.models.client import Client
from app.models.sales_tax import SalesTaxRecord
from app.models.withholding import WithholdingRecord
from app.models.document import Document
from app.models.task import Task
from app.models.report import Report
from app.models.backup import Backup
from app.models.setting import Setting
from app.models.notification import Notification
from app.core.security import get_password_hash
from app.db.session import SessionLocal
import uuid

# Create all tables
Base.metadata.create_all(bind=engine)
print("Tables created successfully", flush=True)

# Verify
from sqlalchemy import inspect, text
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables: {tables}", flush=True)

# Seed user
db = SessionLocal()
db.query(User).delete()

user = User(
    id=uuid.uuid4(),
    full_name="Zain Khan",
    username="zainkhan",
    password_hash=get_password_hash("zk@123"),
    email="zain@example.com",
    is_active=True
)
db.add(user)
db.commit()
print(f"User created: {user.username}", flush=True)

# Verify
result = db.execute(text("SELECT username, email, is_active FROM users")).fetchall()
print(f"Users in DB: {result}", flush=True)
db.close()