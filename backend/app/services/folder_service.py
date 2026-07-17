"""
Folder Service
Scans the local file system and provides folder tree navigation
for the document module.
"""
import os
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.models.document import Document
from app.models.client import Client


def get_storage_base() -> Path:
    """Return the base storage path."""
    return Path(settings.STORAGE_PATH)


def scan_folder_tree_with_clients(db: Session) -> list[dict]:
    """
    Merge filesystem folder tree with all clients from the database.
    Every active client appears as a top-level folder node, populated
    with subfolders if they exist on disk.
    """
    fs_tree = scan_folder_tree()
    fs_names = {n["name"].lower() for n in fs_tree}

    clients = db.query(Client).filter(Client.is_active == True).all()
    storage_base = get_storage_base()
    clients_storage = get_clients_storage()

    for client in clients:
        name = (client.business_name or client.client_name).strip()
        if not name:
            continue

        if name.lower() in fs_names:
            continue

        rel_path = "Clients/" + name
        node = {
            "name": name,
            "path": rel_path,
            "type": "folder",
            "document_count": 0,
            "children": [],
        }
        client_dir = clients_storage / name
        if client_dir.exists():
            node["children"] = scan_folder_tree(client_dir, depth=1, max_depth=4)
            try:
                node["document_count"] = sum(1 for f in client_dir.iterdir() if f.is_file())
            except PermissionError:
                pass
        fs_tree.append(node)
        fs_names.add(name.lower())

    fs_tree.sort(key=lambda n: n["name"].lower())
    return fs_tree


def get_clients_storage() -> Path:
    """Return the clients storage directory."""
    path = get_storage_base() / "Clients"
    path.mkdir(parents=True, exist_ok=True)
    return path


def scan_folder_tree(base_path: Optional[Path] = None, depth: int = 0, max_depth: int = 4) -> list[dict]:
    """
    Recursively scan directory structure and return nested folder tree.
    
    Returns list of:
    {
        "name": str,
        "path": str (relative to storage base),
        "type": "folder" | "file",
        "document_count": int,
        "children": [...]
    }
    """
    if base_path is None:
        base_path = get_clients_storage()

    if not base_path.exists():
        return []

    _MONTH_SORT = {m.lower(): i for i, m in enumerate(FINANCIAL_MONTHS)}

    def _sort_key(e):
        idx = _MONTH_SORT.get(e.name.lower())
        if idx is not None:
            return (0, idx)
        return (1, 0, e.name.lower())

    result = []

    try:
        entries = sorted(base_path.iterdir(), key=_sort_key)
    except PermissionError:
        return []

    for entry in entries:
        if entry.name.startswith('.'):
            continue  # Skip hidden files

        node = {
            "name": entry.name,
            "path": str(entry.relative_to(get_storage_base())),
            "type": "folder" if entry.is_dir() else "file",
            "document_count": 0,
            "children": [],
        }

        if entry.is_dir():
            if depth < max_depth:
                node["children"] = scan_folder_tree(entry, depth + 1, max_depth)
            # Count files in this folder (non-recursive)
            try:
                node["document_count"] = sum(1 for f in entry.iterdir() if f.is_file())
            except PermissionError:
                pass
        else:
            node["document_count"] = 1

        result.append(node)

    return result


def get_folder_contents_db(
    db: Session,
    folder_path: str,
    page: int = 1,
    limit: int = 25,
) -> tuple[list[Document], int]:
    """
    Get documents from database that match a folder path prefix.
    """
    # Normalize path separators
    normalized = folder_path.replace("\\", "/").strip("/")

    query = db.query(Document).filter(Document.is_deleted == False)

    if normalized:
        db_path_pattern = normalized.replace("/", "\\")
        query = query.filter(Document.file_path.ilike(f"%{db_path_pattern}%"))

    total = query.count()
    documents = (
        query
        .order_by(Document.upload_date.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return documents, total


def search_folder_names(query_str: str, max_results: int = 20) -> list[dict]:
    """
    Search folder names matching a query string.
    """
    base = get_clients_storage()
    results = []
    query_lower = query_str.lower()

    for root, dirs, files in os.walk(base):
        for dirname in dirs:
            if query_lower in dirname.lower():
                root_path = Path(root) / dirname
                results.append({
                    "name": dirname,
                    "path": str(root_path.relative_to(get_storage_base())),
                    "type": "folder",
                    "document_count": sum(1 for f in root_path.iterdir() if f.is_file()),
                    "children": [],
                })
                if len(results) >= max_results:
                    return results

    return results


FINANCIAL_MONTHS = [
    "July", "August", "September", "October", "November", "December",
    "January", "February", "March", "April", "May", "June",
]


def get_month_name(month: int, default: str = "") -> str:
    """Convert month number (1-12) to financial year month name (July-June)."""
    if 1 <= month <= 12:
        return FINANCIAL_MONTHS[month - 1]
    return default


def _make_categories(month_path: Path) -> dict[str, Path]:
    return {
        "Sales_Tax": month_path / "Sales_Tax",
        "236H": month_path / "Withholding" / "236H",
        "153": month_path / "Withholding" / "153",
        "165": month_path / "Withholding" / "165",
        "KPRA": month_path / "KPRA",
        "Working_Files": month_path / "Working_Files",
    }


def _make_year_categories(year_path: Path) -> dict[str, Path]:
    return {
        "Notices": year_path / "Notices",
        "Income_Tax": year_path / "Income_Tax",
    }


def ensure_client_folder_structure(
    client_name: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> dict[str, Path]:
    """
    Create the full folder structure for a client.

    storage/Clients/{ClientName}/{Year}/
        Notices/
        Income_Tax/
        {Month}/
            Sales_Tax/
            Withholding/
                236H/
                153/
            KPRA/
            Working_Files/

    When *month* is None, creates all 12 month directories and returns
    a merged dict with all category-keys pointing to the *last* month's
    directories (for backward-compatible callers that ignore the month
    level).  When *month* is provided only that month's structure is
    created.
    """
    base = get_clients_storage() / client_name
    current_year = year or __import__('datetime').datetime.now().year
    year_path = base / str(current_year)

    year_cats = _make_year_categories(year_path)
    for path in year_cats.values():
        path.mkdir(parents=True, exist_ok=True)

    if month is not None:
        month_name = get_month_name(month)
        month_path = year_path / month_name
        cats = _make_categories(month_path)
        for path in cats.values():
            path.mkdir(parents=True, exist_ok=True)
        return {**cats, **year_cats}

    # No month given — create all 12 months
    for m in range(1, 13):
        month_name = get_month_name(m)
        month_path = year_path / month_name
        cats = _make_categories(month_path)
        for path in cats.values():
            path.mkdir(parents=True, exist_ok=True)

    # Return last month's categories plus year-level for backward compat
    last_month = year_path / get_month_name(12)
    return {**_make_categories(last_month), **year_cats}


def get_folder_for_category(
    client_name: str,
    category: str,
    tax_year: Optional[int] = None,
    tax_month: Optional[int] = None,
) -> Path:
    """
    Get the appropriate folder path for a document category.

    Month-level categories:  Clients/{ClientName}/{Year}/{Month}/{Category}/…
    Year-level categories:   Clients/{ClientName}/{Year}/{Category}/…
    """
    base = get_clients_storage() / client_name
    current_year = tax_year or __import__('datetime').datetime.now().year
    year_path = base / str(current_year)

    category_map = {
        "Sales Tax Return": "Sales_Tax",
        "236H": "236H",
        "153": "153",
        "165": "165",
        "KPRA": "KPRA",
        "Income Tax Return": "Income_Tax",
        "Working File": "Working_Files",
        "Notice": "Notices",
        "Other": "Working_Files",
    }

    folder_key = category_map.get(category, "Working_Files")

    year_level_keys = {"Notices", "Income_Tax"}
    if folder_key in year_level_keys:
        year_cats = _make_year_categories(year_path)
        for p in year_cats.values():
            p.mkdir(parents=True, exist_ok=True)
        return year_cats.get(folder_key, year_cats["Notices"])

    categories = ensure_client_folder_structure(client_name, tax_year, tax_month)
    return categories.get(folder_key, categories["Working_Files"])


def move_document_file(
    current_path: str,
    new_folder: Path,
) -> tuple[str, str]:
    """
    Move a file to a new folder. Returns (new_path, new_filename).
    """
    source = Path(current_path)
    if not source.exists():
        raise FileNotFoundError(f"Source file not found: {current_path}")

    new_folder.mkdir(parents=True, exist_ok=True)
    destination = new_folder / source.name

    # Handle name conflicts
    counter = 1
    while destination.exists():
        stem = source.stem
        ext = source.suffix
        destination = new_folder / f"{stem}_{counter}{ext}"
        counter += 1

    import shutil
    shutil.move(str(source), str(destination))
    return str(destination), destination.name


def copy_document_file(
    current_path: str,
    new_folder: Path,
) -> tuple[str, str]:
    """
    Copy a file to a new folder. Returns (new_path, new_filename).
    """
    import shutil

    source = Path(current_path)
    if not source.exists():
        raise FileNotFoundError(f"Source file not found: {current_path}")

    new_folder.mkdir(parents=True, exist_ok=True)
    destination = new_folder / source.name

    # Handle name conflicts
    counter = 1
    while destination.exists():
        stem = source.stem
        ext = source.suffix
        destination = new_folder / f"{stem}_{counter}{ext}"
        counter += 1

    shutil.copy2(str(source), str(destination))
    return str(destination), destination.name