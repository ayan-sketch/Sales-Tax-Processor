"""
Parser for withholding statement files (PDF and Excel).
Extracts multiple rows from a single file for bulk import.
"""
import io
import re
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, List
from dataclasses import dataclass, field

import pdfplumber
import openpyxl


@dataclass
class StatementRowExtract:
    """Single row extracted from a statement file."""
    line_number: int
    ntn: Optional[str] = None
    client_name: Optional[str] = None
    section_type: Optional[str] = None  # "236H" or "153"
    period: Optional[str] = None        # YYYY-MM
    challan_number: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    warnings: list = field(default_factory=list)


@dataclass
class StatementParseResult:
    """Result from parsing a statement file."""
    rows: List[StatementRowExtract]
    filename: str
    total_rows: int
    parsed_rows: int
    errors: list = field(default_factory=list)


# --------------- Excel Parser ---------------

# Known column name variations in withholding statements
COLUMN_ALIASES = {
    "ntn": ["ntn", "tax id", "taxpayer id", "taxpayer_id", "id"],
    "name": ["name", "client name", "client_name", "taxpayer name", "taxpayer_name", "party name", "party_name"],
    "section": ["section", "section type", "section_type", "type", "section_code"],
    "period": ["period", "tax period", "tax_period", "month", "year/month", "year_month"],
    "challan": ["challan no", "challan number", "challan_number", "challan#", "psid", "receipt no", "receipt_no"],
    "amount": ["amount", "tax amount", "tax_amount", "amount paid", "amount_paid", "paid", "value", "total"],
    "date": ["date", "payment date", "payment_date", "paid on", "paid_on", "deposit date", "deposit_date"],
}


def _find_column(headers: List[str], aliases: List[str]) -> Optional[int]:
    """Find column index matching any of the given aliases."""
    for i, h in enumerate(headers):
        h_clean = h.strip().lower()
        for alias in aliases:
            if h_clean == alias or h_clean.startswith(alias):
                return i
    return None


def _normalize_ntn(raw: str) -> Optional[str]:
    """Normalize NTN to 7-1 format."""
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) == 8:
        return f"{digits[:7]}-{digits[7]}"
    if len(digits) == 7:
        return f"{digits}-?"
    return None


def _parse_statement_period(raw: str) -> Optional[str]:
    """Parse period from various formats to YYYY-MM."""
    raw = raw.strip()
    # Try YYYY-MM or YYYY/MM
    m = re.match(r"(\d{4})[-/](\d{1,2})", raw)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    # Try MM/YYYY
    m = re.match(r"(\d{1,2})[-/](\d{4})", raw)
    if m:
        return f"{m.group(2)}-{int(m.group(1)):02d}"
    return None


def parse_statement_excel(file_bytes: bytes, filename: str) -> StatementParseResult:
    """
    Parse an Excel (.xlsx/.xls) withholding statement.
    Reads header row, maps columns, extracts all data rows.
    """
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    if ws is None:
        ws = wb.worksheets[0]

    rows_iter = ws.iter_rows(values_only=True)
    headers = []
    parsed_rows = []
    errors = []
    line_no = 0

    for row in rows_iter:
        line_no += 1
        # Filter None values
        row_vals = [str(v) if v is not None else "" for v in row]

        if not headers:
            # First non-empty row is header
            if any(v.strip() for v in row_vals):
                headers = row_vals
            continue

        # Skip completely empty rows
        if not any(v.strip() for v in row_vals):
            continue

        # Map columns
        ntn_col = _find_column(headers, COLUMN_ALIASES["ntn"])
        name_col = _find_column(headers, COLUMN_ALIASES["name"])
        section_col = _find_column(headers, COLUMN_ALIASES["section"])
        period_col = _find_column(headers, COLUMN_ALIASES["period"])
        challan_col = _find_column(headers, COLUMN_ALIASES["challan"])
        amount_col = _find_column(headers, COLUMN_ALIASES["amount"])
        date_col = _find_column(headers, COLUMN_ALIASES["date"])

        extract = StatementRowExtract(line_number=line_no)

        # Extract NTN
        if ntn_col is not None and ntn_col < len(row_vals):
            raw = row_vals[ntn_col].strip()
            if raw:
                ntn = _normalize_ntn(raw)
                if ntn:
                    extract.ntn = ntn
                else:
                    extract.warnings.append(f"Could not parse NTN from '{raw}'")

        # Extract name
        if name_col is not None and name_col < len(row_vals):
            name = row_vals[name_col].strip()
            if name:
                extract.client_name = name

        # Extract section
        if section_col is not None and section_col < len(row_vals):
            section = row_vals[section_col].strip().upper()
            if "236" in section or "236H" in section:
                extract.section_type = "236H"
            elif "153" in section:
                extract.section_type = "153"

        # Extract period
        if period_col is not None and period_col < len(row_vals):
            raw = row_vals[period_col].strip()
            if raw:
                period = _parse_statement_period(raw)
                if period:
                    extract.period = period
                else:
                    extract.warnings.append(f"Could not parse period from '{raw}'")

        # Extract challan number
        if challan_col is not None and challan_col < len(row_vals):
            raw = row_vals[challan_col].strip()
            if raw:
                extract.challan_number = raw

        # Extract amount
        if amount_col is not None and amount_col < len(row_vals):
            raw = row_vals[amount_col].strip()
            if raw:
                try:
                    # Remove currency symbols and commas
                    clean = re.sub(r"[^\d.]", "", raw)
                    if clean:
                        extract.amount = Decimal(clean)
                except Exception:
                    extract.warnings.append(f"Could not parse amount from '{raw}'")

        # Extract date
        if date_col is not None and date_col < len(row_vals):
            raw = row_vals[date_col].strip()
            if raw:
                for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%Y/%m/%d"):
                    try:
                        extract.payment_date = datetime.strptime(raw, fmt).date()
                        break
                    except ValueError:
                        continue

        # Only add rows that have at least an NTN or name
        if extract.ntn or extract.client_name:
            parsed_rows.append(extract)
        else:
            errors.append(f"Row {line_no}: No identifiable NTN or client name found")

    wb.close()

    return StatementParseResult(
        rows=parsed_rows,
        filename=filename,
        total_rows=line_no - 1,
        parsed_rows=len(parsed_rows),
        errors=errors,
    )


# --------------- PDF Statement Parser ---------------

def _split_text_line(line: str) -> List[str]:
    """
    Split a single text line into multiple fields using common delimiters.
    Used as fallback when pdfplumber can't detect tables.
    Tries tab first, then multiple spaces, then comma.
    """
    line = line.strip()
    if not line:
        return []
    
    # Try tab split first (most reliable for structured PDFs)
    parts = line.split("\t")
    if len(parts) > 1:
        return [p.strip() for p in parts]
    
    # Try splitting on 2+ consecutive spaces (common in PDF layouts)
    parts = re.split(r"\s{2,}", line)
    if len(parts) > 1:
        return [p.strip() for p in parts]
    
    # Try comma split
    parts = line.split(",")
    if len(parts) > 1:
        return [p.strip() for p in parts]
    
    # No delimiters found - return as single element
    return [line]


def _try_parse_text_line_as_row(line: str, line_number: int) -> Optional[StatementRowExtract]:
    """
    Try to extract fields from a single text line without column headers.
    Used when table extraction fails and we have raw text lines.
    Looks for patterns like NTN numbers, amounts, dates, section codes, etc.
    """
    extract = StatementRowExtract(line_number=line_number)
    
    # Extract NTN (7-1 format or 8 digits)
    ntn_match = re.search(r"\b(\d{7}[-\s]?\d)\b", line)
    if ntn_match:
        ntn = _normalize_ntn(ntn_match.group(1))
        if ntn:
            extract.ntn = ntn
    
    # Extract section type
    if re.search(r"236[-\s]?[Hh]", line):
        extract.section_type = "236H"
    elif re.search(r"\b153\b", line):
        extract.section_type = "153"
    
    # Extract period (YYYY-MM, MM/YYYY, etc.)
    period = _parse_statement_period(line)
    if period:
        extract.period = period
    
    # Extract amount (look for numbers with commas or decimal points)
    amount_match = re.search(r"(?:Rs\.?|PKR|amount|tax)\s*:?\s*([\d,]+\.?\d*)", line, re.IGNORECASE)
    if amount_match:
        try:
            clean = re.sub(r"[^\d.]", "", amount_match.group(1))
            if clean:
                extract.amount = Decimal(clean)
        except Exception:
            pass
    
    if not extract.amount:
        # Try standalone large numbers (likely amounts)
        amount_match2 = re.search(r"\b([\d,]{4,}\.?\d*)\b", line)
        if amount_match2:
            try:
                clean = re.sub(r"[^\d.]", "", amount_match2.group(1))
                if clean and Decimal(clean) > 0:
                    extract.amount = Decimal(clean)
            except Exception:
                pass
    
    # Extract PSID / challan number
    psid_match = re.search(r"PSID\s*#?\s*:?\s*(\d{10,})", line, re.IGNORECASE)
    if psid_match:
        extract.challan_number = psid_match.group(1).strip()
    
    # Extract payment date
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%Y/%m/%d", "%d-%b-%Y"):
        date_match = re.search(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}-[A-Za-z]+-\d{4})", line)
        if date_match:
            try:
                extract.payment_date = datetime.strptime(date_match.group(1), fmt).date()
                break
            except ValueError:
                continue
    
    # Extract client name (look for text that looks like a name - after a label or standalone)
    name_match = re.search(r"(?:name|taxpayer|party|company)\s*:?\s*([A-Za-z][A-Za-z\s\.]{2,50})", line, re.IGNORECASE)
    if name_match:
        extract.client_name = name_match.group(1).strip()
    
    return extract


def parse_statement_pdf(file_bytes: bytes, filename: str) -> StatementParseResult:
    """
    Parse a PDF withholding statement.
    Uses pdfplumber table extraction to read tabular data.
    Falls back to intelligent text line parsing when tables can't be detected.
    """
    text_rows = []
    line_no = 0
    used_table_extraction = False

    try:
        with pdfplumber.open(file_bytes) as pdf:
            for page in pdf.pages:
                # Try table extraction first
                tables = page.extract_tables()
                if tables:
                    used_table_extraction = True
                    for table in tables:
                        for row in table:
                            line_no += 1
                            text_rows.append([str(c) if c else "" for c in row])
                else:
                    # Fallback to text line extraction
                    text = page.extract_text()
                    if text:
                        for line in text.split("\n"):
                            line_no += 1
                            text_rows.append([line.strip()])
    except Exception as e:
        return StatementParseResult(
            rows=[],
            filename=filename,
            total_rows=0,
            parsed_rows=0,
            errors=[f"Failed to parse PDF: {str(e)}"],
        )

    if not text_rows:
        return StatementParseResult(
            rows=[],
            filename=filename,
            total_rows=0,
            parsed_rows=0,
            errors=["No extractable data found in PDF statement"],
        )

    # Parse header row and data rows (same logic as Excel)
    headers = []
    parsed_rows = []
    errors = []
    row_idx = 0

    for row_vals in text_rows:
        row_idx += 1
        if not headers:
            # First row with content is header
            if any(v.strip() for v in row_vals):
                # If we have table extraction, use first row as headers directly
                # If text fallback (single column per row), try to split the line into header columns
                if used_table_extraction or len(row_vals) > 1:
                    headers = row_vals
                else:
                    # Text fallback: try to split the header line into columns
                    headers = _split_text_line(row_vals[0])
                    if len(headers) <= 1:
                        # Can't detect column headers, skip header detection
                        # and try pattern-based parsing for all rows
                        headers = row_vals
            continue

        if not any(v.strip() for v in row_vals):
            continue

        ntn_col = _find_column(headers, COLUMN_ALIASES["ntn"])
        name_col = _find_column(headers, COLUMN_ALIASES["name"])
        section_col = _find_column(headers, COLUMN_ALIASES["section"])
        period_col = _find_column(headers, COLUMN_ALIASES["period"])
        challan_col = _find_column(headers, COLUMN_ALIASES["challan"])
        amount_col = _find_column(headers, COLUMN_ALIASES["amount"])
        date_col = _find_column(headers, COLUMN_ALIASES["date"])

        extract = StatementRowExtract(line_number=row_idx)

        # Check if we have multi-column data (table extraction worked)
        if len(row_vals) > 1 or used_table_extraction:
            # Standard column-based extraction
            if ntn_col is not None and ntn_col < len(row_vals):
                raw = row_vals[ntn_col].strip()
                if raw:
                    ntn = _normalize_ntn(raw)
                    if ntn:
                        extract.ntn = ntn

            if name_col is not None and name_col < len(row_vals):
                name = row_vals[name_col].strip()
                if name:
                    extract.client_name = name

            if section_col is not None and section_col < len(row_vals):
                section = row_vals[section_col].strip().upper()
                if "236" in section or "236H" in section:
                    extract.section_type = "236H"
                elif "153" in section:
                    extract.section_type = "153"

            if period_col is not None and period_col < len(row_vals):
                raw = row_vals[period_col].strip()
                if raw:
                    period = _parse_statement_period(raw)
                    if period:
                        extract.period = period

            if challan_col is not None and challan_col < len(row_vals):
                raw = row_vals[challan_col].strip()
                if raw:
                    extract.challan_number = raw

            if amount_col is not None and amount_col < len(row_vals):
                raw = row_vals[amount_col].strip()
                if raw:
                    try:
                        clean = re.sub(r"[^\d.]", "", raw)
                        if clean:
                            extract.amount = Decimal(clean)
                    except Exception:
                        pass

            if date_col is not None and date_col < len(row_vals):
                raw = row_vals[date_col].strip()
                if raw:
                    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%Y/%m/%d"):
                        try:
                            extract.payment_date = datetime.strptime(raw, fmt).date()
                            break
                        except ValueError:
                            continue
        else:
            # Text fallback: single column per row
            # First try splitting the line into columns
            split_parts = _split_text_line(row_vals[0])
            
            if len(split_parts) > 1:
                # We managed to split - use column mapping
                if ntn_col is not None and ntn_col < len(split_parts):
                    raw = split_parts[ntn_col].strip()
                    if raw:
                        ntn = _normalize_ntn(raw)
                        if ntn:
                            extract.ntn = ntn

                if name_col is not None and name_col < len(split_parts):
                    name = split_parts[name_col].strip()
                    if name:
                        extract.client_name = name

                if section_col is not None and section_col < len(split_parts):
                    section = split_parts[section_col].strip().upper()
                    if "236" in section or "236H" in section:
                        extract.section_type = "236H"
                    elif "153" in section:
                        extract.section_type = "153"

                if period_col is not None and period_col < len(split_parts):
                    raw = split_parts[period_col].strip()
                    if raw:
                        period = _parse_statement_period(raw)
                        if period:
                            extract.period = period

                if challan_col is not None and challan_col < len(split_parts):
                    raw = split_parts[challan_col].strip()
                    if raw:
                        extract.challan_number = raw

                if amount_col is not None and amount_col < len(split_parts):
                    raw = split_parts[amount_col].strip()
                    if raw:
                        try:
                            clean = re.sub(r"[^\d.]", "", raw)
                            if clean:
                                extract.amount = Decimal(clean)
                        except Exception:
                            pass

                if date_col is not None and date_col < len(split_parts):
                    raw = split_parts[date_col].strip()
                    if raw:
                        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%Y/%m/%d"):
                            try:
                                extract.payment_date = datetime.strptime(raw, fmt).date()
                                break
                            except ValueError:
                                continue
            else:
                # Can't split - use pattern-based extraction from the full line
                pattern_extract = _try_parse_text_line_as_row(row_vals[0], row_idx)
                if pattern_extract:
                    extract = pattern_extract

        if extract.ntn or extract.client_name:
            parsed_rows.append(extract)
        else:
            errors.append(f"Row {row_idx}: No identifiable NTN or client name found")

    return StatementParseResult(
        rows=parsed_rows,
        filename=filename,
        total_rows=row_idx - 1,
        parsed_rows=len(parsed_rows),
        errors=errors,
    )


def parse_statement(file_bytes: bytes, filename: str) -> StatementParseResult:
    """
    Parse a withholding statement file (PDF or Excel).
    Detects format by file extension.
    """
    lower = filename.lower()
    if lower.endswith((".xlsx", ".xls")):
        return parse_statement_excel(file_bytes, filename)
    elif lower.endswith(".pdf"):
        return parse_statement_pdf(file_bytes, filename)
    else:
        return StatementParseResult(
            rows=[],
            filename=filename,
            total_rows=0,
            parsed_rows=0,
            errors=[f"Unsupported file format: {filename}. Supported: .pdf, .xlsx, .xls"],
        )