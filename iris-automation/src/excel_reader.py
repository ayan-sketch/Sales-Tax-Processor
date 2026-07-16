import openpyxl
from pathlib import Path


def read_excel(path: str | Path) -> list[dict]:
    """Read Excel file, first row = headers, subsequent rows = data."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Excel file not found: {path}")

    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [str(h).strip() if h else "" for h in rows[0]]
    records = []
    for row in rows[1:]:
        if not any(v is not None and str(v).strip() for v in row):
            continue
        records.append(dict(zip(headers, [str(v or "").strip() for v in row])))
    wb.close()
    return records
