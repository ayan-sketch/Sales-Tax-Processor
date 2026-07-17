import sys, os, shutil
sys.path.insert(0, r'C:\Users\Adil Gulzar Malik\Desktop\Tax Software GITHUB\sale-tax-software\backend')
os.chdir(r'C:\Users\Adil Gulzar Malik\Desktop\Tax Software GITHUB\sale-tax-software\backend')

from app.services.folder_service import get_clients_storage, FINANCIAL_MONTHS

clients_dir = get_clients_storage()
month_names_lower = {m.lower() for m in FINANCIAL_MONTHS}

removed = 0
for client_dir in clients_dir.iterdir():
    if not client_dir.is_dir():
        continue
    for year_dir in client_dir.iterdir():
        if not year_dir.is_dir() or not year_dir.name.isdigit():
            continue
        for entry in list(year_dir.iterdir()):
            if entry.is_dir() and entry.name.lower() not in month_names_lower:
                try:
                    shutil.rmtree(str(entry))
                    print(f"  Removed: {entry.relative_to(clients_dir.parent)}")
                    removed += 1
                except Exception as e:
                    print(f"  ERR removing {entry.name}: {e}")

print(f"\nRemoved {removed} old year-level category folders")
