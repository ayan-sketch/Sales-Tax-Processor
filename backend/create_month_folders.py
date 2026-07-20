"""Create month folder structures for all active clients.
Run this from the backend/ directory."""
import sys, os
# This script must be run from the backend/ directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
sys.path.insert(0, script_dir)

from app.db.session import SessionLocal
from app.models.client import Client
from app.services.folder_service import ensure_client_folder_structure, FINANCIAL_MONTHS

db = SessionLocal()
try:
    clients = db.query(Client).filter(Client.is_active == True).all()
    print(f"Creating month folders for {len(clients)} clients...")
    for c in clients:
        name = c.business_name or c.client_name
        try:
            folders = ensure_client_folder_structure(name)  # No month = create all 12
            print(f"  OK: {name} ({len(folders)} categories x 12 months)")
        except Exception as e:
            print(f"  ERR: {name}: {e}")
finally:
    db.close()
