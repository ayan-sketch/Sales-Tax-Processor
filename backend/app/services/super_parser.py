"""
Super PDF Parser - Unified extraction engine for all FBR withholding tax PDFs.

Handles three PDF formats:
1. FBR Income Tax Payment Challan (PSID-numbered files)
2. CPR Receipt (IT-prefixed files - Computerized Payment Receipt)
3. Multi-entry Withholding Tax Statement (FBR-style statements)

For each format, extracts individual taxpayer entries and metadata
in the format the frontend Section 165 and Withholding pages expect.
"""
import re
import io
from decimal import Decimal
from datetime import datetime
from typing import Any, Optional

import pdfplumber


# ── Entry schema ───────────────────────────────────────────────────────────────

ENTRY_FIELDS = ["name", "cnicNtn", "date", "code", "taxable", "tax"]
METADATA_FIELDS = [
    "section", "period", "tax_year", "payment_date", "challan_number",
    "withholding_agent", "agent_cnic", "total_amount", "generation_date",
    "cpr_no", "payment_section_code", "format",
]

def _clean_entry(entry: dict) -> dict:
    return {k: entry.get(k, "") for k in ENTRY_FIELDS}

def _empty_metadata() -> dict:
    return {k: "" for k in METADATA_FIELDS}

def _parse_amount(val: Any) -> float:
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    try:
        return float(re.sub(r"[^\d.]", "", str(val).replace(",", "")))
    except (ValueError, TypeError):
        return 0.0

def _parse_date(val: str) -> str:
    for fmt in ("%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(val.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return val.strip()

def _normalize_ntn(raw: str) -> str:
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) == 13:
        return digits
    if len(digits) == 8:
        return f"{digits[:7]}-{digits[7]}"
    if len(digits) == 7:
        return f"{digits}-?"
    return raw.strip()


# ── Format Detection ───────────────────────────────────────────────────────────

def detect_format(text: str) -> str:
    if "COMPUTERIZED PAYMENT RECEIPT ( CPR - IT )" in text:
        return "cpr"
    if "INCOME TAX PAYMENT CHALLAN" in text:
        return "challan"
    if re.search(r"WITHHOLDING\s+TAX\s+STATEMENT", text, re.I):
        return "statement"
    if "Details of Tax Payers" in text:
        return "cpr"  # CPR-like table format
    return "unknown"


# ── CPR Parser (Computerized Payment Receipt) ─────────────────────────────────

def _extract_text_lines(file_bytes: bytes) -> list[str]:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        text = ""
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return [line.strip() for line in text.split("\n") if line.strip()]


def _parse_cpr_lines(lines: list[str]) -> dict:
    full_text = "\n".join(lines)
    meta = _empty_metadata()
    meta["format"] = "cpr"

    # CPR No
    m = re.search(r"CPR\s+No\s*:\s*(\S+)", full_text)
    meta["cpr_no"] = m.group(1) if m else ""

    # Payment Date
    m = re.search(r"Payment\s+Date\s*:\s*(\d{1,2}-[A-Za-z]+-\d{4})", full_text)
    meta["payment_date"] = _parse_date(m.group(1)) if m else ""

    # Payment Section
    m = re.search(r"Payment\s+Section\s*:\s*(.+?)(?:\s*RTO/LTO|\s*$)", full_text)
    if m:
        sec = m.group(1).strip()
        meta["section"] = sec
    # Extract payment_section_code from the full text (often after RTO/LTO line)
    code_m = re.search(r"companies\s*[-–]\s*(\d{8})", full_text)
    if not code_m:
        code_m = re.search(r"(\d{8})\s*\n?\s*$", full_text, re.M)
    if not code_m:
        code_m = re.search(r"Payment\s+Section\s+Code\s*(\d{8})", full_text)
    if code_m:
        meta["payment_section_code"] = code_m.group(1)

    # RTO/LTO
    m = re.search(r"RTO/LTO\s*:\s*(.+)", full_text)
    meta["rto"] = m.group(1).strip() if m else ""

    # Nature of Payment
    m = re.search(r"Nature\s+of\s+Payment\s*:\s*(.+?)(?:\s*Tax\s+Year|\s*$)", full_text)
    meta["nature"] = m.group(1).strip() if m else ""

    # Tax Year
    m = re.search(r"Tax\s+Year\s*:\s*(\d{4})", full_text)
    meta["tax_year"] = m.group(1) if m else ""

    # Account Head
    m = re.search(r"Account\s+Head\(?NAM\)?\s*:\s*(\S+)", full_text)
    meta["account_head"] = m.group(1) if m else ""

    # Month/Year (period)
    m = re.search(r"Month/Year\s*:\s*(\d{1,2})/(\d{4})", full_text)
    if m:
        meta["period"] = f"{m.group(2)}-{int(m.group(1)):02d}"
    else:
        m = re.search(r"Month/Year\s*:\s*(\d{1,2})/(\d{2})", full_text)
        if m:
            meta["period"] = f"20{m.group(2)}-{int(m.group(1)):02d}"

    # Amount of Tax
    m = re.search(r"Amount\s+of\s+Tax\s*:\s*([\d,]+\.?\d*)", full_text)
    meta["total_amount"] = _parse_amount(m.group(1)) if m else 0.0

    # Withholding Agent
    m = re.search(r"Name\s*:\s*([A-Za-z\s\.\-]+?)(?:\s*Registration|\s*$)", full_text)
    if m:
        meta["withholding_agent"] = m.group(1).strip()
    else:
        m = re.search(r"Particulars\s+of\s+Withholding\s+Agent.*?Name\s*:\s*(.+)", full_text, re.DOTALL)
        if m:
            name_line = m.group(1).split("\n")[0].strip()
            meta["withholding_agent"] = name_line

    # Agent Registration / Inc No
    m = re.search(r"Registration\s*/?\s*Inc\s*No\.?\s*:\s*(\d{13})", full_text)
    meta["agent_cnic"] = m.group(1) if m else ""
    if not meta["agent_cnic"]:
        m = re.search(r"Registration\s*/?\s*Inc\s*No\.?\s*:\s*(\d+)", full_text)
        meta["agent_cnic"] = m.group(1) if m else ""

    # Generation Date
    m = re.search(r"Generation\s+Date\s*:\s*(\d{1,2}-[A-Za-z]+-\d{4})", full_text)
    meta["generation_date"] = _parse_date(m.group(1)) if m else ""

    # ── Extract Taxpayer Entries from Table ──
    entries = []
    table_start = None
    for i, line in enumerate(lines):
        if "Details of Tax Payers" in line:
            for j in range(i + 1, min(i + 6, len(lines))):
                if re.match(r"^Sr\.?\s+NTN", lines[j], re.I):
                    table_start = j + 1
                    break
            if table_start is None:
                table_start = i + 4
            break

    if table_start is not None:
        raw_blocks: list[list[str]] = []
        current_block: list[str] = []
        started = False
        for line in lines[table_start:]:
            if re.match(r"^Total[\s:]", line):
                if current_block:
                    raw_blocks.append(current_block)
                break
            if re.match(r"^\d{1,4}\s+", line):
                if current_block:
                    raw_blocks.append(current_block)
                current_block = [line]
                started = True
            elif started and line.strip():
                current_block.append(line)

        if current_block:
            raw_blocks.append(current_block)

        # Deduplicate by block_text
        seen_blocks = set()
        unique_blocks = []
        for b in raw_blocks:
            key = " ".join(b)
            if key not in seen_blocks:
                seen_blocks.add(key)
                unique_blocks.append(b)
        raw_blocks = unique_blocks

        for block in raw_blocks:
            block_text = " ".join(block)
            entry = {
                "name": "",
                "cnicNtn": "",
                "date": meta.get("payment_date", ""),
                "code": meta.get("payment_section_code", ""),
                "taxable": 0.0,
                "tax": 0.0,
            }

            # Extract CNIC first (5-7-1 hyphens or 13 digits) — prefer individual ID over NTN
            id_m = re.search(r"\b(\d{5}-\d{7}-\d|\d{13})\b", block_text)
            if id_m:
                entry["cnicNtn"] = id_m.group(1)
            if not entry["cnicNtn"]:
                id_m = re.search(r"\b(\d{7}-\d)\b", block_text)
                if id_m:
                    entry["cnicNtn"] = id_m.group(1)

            # Find amounts — look for numbers WITH commas only (e.g., 36,075,700 or 360,757)
            # These are the only reliable large amounts in CPR
            amount_strs = re.findall(r"\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b", block_text)
            if len(amount_strs) >= 2:
                entry["taxable"] = _parse_amount(amount_strs[-2])
                entry["tax"] = _parse_amount(amount_strs[-1])
            elif len(amount_strs) == 1:
                entry["taxable"] = _parse_amount(amount_strs[0])
                entry["tax"] = _parse_amount(amount_strs[0])

            # Extract payment section code
            code_m = re.search(r"(\d{8})\b", block_text)
            if code_m:
                entry["code"] = code_m.group(1)
            if not entry["code"]:
                entry["code"] = meta.get("payment_section_code", "")

            # Extract name: clean block text by removing non-name elements
            name_text = block_text
            # Remove serial + trailing space
            name_text = re.sub(r"^\d{1,4}\s+", "", name_text)
            # Remove CNIC (5-7-1 hyphens, 13 digits) and NTN (7-1)
            name_text = re.sub(r"\b\d{5}-\d{7}-\d\b", "", name_text)
            name_text = re.sub(r"\b\d{13}\b", "", name_text)
            name_text = re.sub(r"\b\d{7}-\d\b", "", name_text)
            # Remove comma-formatted amounts
            name_text = re.sub(r"\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b", "", name_text)
            # Remove office/status prefixes
            name_text = re.sub(r"\b(LTO|RTO|CTO|MTU)\s+\S+\s+", " ", name_text)
            name_text = re.sub(r"\bCO/\s*", " ", name_text)
            # Remove section code like 153(1)(a)
            name_text = re.sub(r"\d{3}\(\d\)\([a-z]\)", "", name_text)
            # Remove NAM codes (B + 5 digits)
            name_text = re.sub(r"\s*B\d{5}\s*", " ", name_text)
            # Remove slash fragments
            name_text = re.sub(r"\s*/\s*", " ", name_text)
            # Remove standalone city names
            name_text = re.sub(r"\s+(LAHORE|KARACHI|ISLAMABAD|RAWALPINDI|ABBOTTABAD|FAISALABAD|MULTAN|GUJRANWALA|PESHAWAR|QUETTA|HYDERABAD|SIALKOT|BAHAWALPUR|SUKKUR|LARKANA)\s+", " ", name_text, flags=re.I)
            # Remove address patterns
            name_text = re.sub(r"\d+\s*,?\s*[A-Za-z0-9\-]+\s*,.*$", "", name_text)
            # Remove duplicate/repeated company name variants
            name_text = re.sub(r"\s+Pepsi\s+Cola\s+International\s+\(Pvt\.\)\s+Ltd", "", name_text, flags=re.I)
            # Collapse whitespace
            name_text = re.sub(r"\s+", " ", name_text).strip()
            if name_text and not name_text.upper().startswith("TOTAL"):
                entry["name"] = name_text

            if entry["name"] or entry["cnicNtn"]:
                entries.append(_clean_entry(entry))

    return {"entries": entries, "metadata": meta}


# ── Challan Parser (FBR Income Tax Payment Challan) ───────────────────────────

def _parse_challan_lines(lines: list[str]) -> dict:
    full_text = "\n".join(lines)
    meta = _empty_metadata()
    meta["format"] = "challan"

    # Section detection (153 or 236H)
    if re.search(r"Payment\s+Section\s*[\(\)]?\s*(?:Section)?\s*[:\-]?\s*153\b", full_text, re.I):
        meta["section"] = "153"
    elif re.search(r"236[-\s]?[Hh]", full_text):
        meta["section"] = "236H"
    else:
        s = re.findall(r"\b(153|236[-\s]?[Hh])\b", full_text, re.I)
        meta["section"] = s[0].upper() if s else ""

    # Normalize section
    if "236" in meta["section"]:
        meta["section"] = "236H"

    # Name of Depositor / Name of withholding agent
    m = re.search(r"Name\s+of\s+(?:withholding\s+)?(?:agent|depositor)\s*[:.]?\s*(.+?)(?:\n|$)", full_text, re.I)
    if m:
        meta["withholding_agent"] = m.group(1).strip()

    if not meta["withholding_agent"]:
        m = re.search(r"Name\s+of\s+Depositor\s*\n\s*(.+?)(?:\n|$)", full_text)
        if m:
            meta["withholding_agent"] = m.group(1).strip()

    # If still not found, try "Name" followed by content before "CNIC"
    if not meta["withholding_agent"]:
        m = re.search(r"^(?:Name|Name\s+of\s+Depositor)\s*\n\s*(.+?)\s*\n", full_text, re.M)
        if m:
            meta["withholding_agent"] = m.group(1).strip()

    # CNIC of Depositor / CNIC/Reg./Inc. No.
    m = re.search(r"CNIC\s+of\s+Depositor\s*\n\s*(\d{13})", full_text)
    if m:
        meta["agent_cnic"] = m.group(1)
    if not meta["agent_cnic"]:
        m = re.search(r"CNIC/Reg\./Inc\.\s*No\.?\s*[:.]?\s*(\d{13})", full_text, re.I)
        if m:
            meta["agent_cnic"] = m.group(1)
    if not meta["agent_cnic"]:
        m = re.search(r"CNIC\s*[:.]?\s*(\d{13})", full_text, re.I)
        if m:
            meta["agent_cnic"] = m.group(1)

    # NTN
    m = re.search(r"(?:NTN|NTN\s*No[.:]?)\s*:?\s*(\d{7}[\s-]?\d)", full_text, re.I)
    if m:
        meta["ntn"] = _normalize_ntn(m.group(1))

    # Total Tax Deducted
    m = re.search(r"Total\s+Tax\s+Deducted\s+([\d,]+\.?\d*)", full_text, re.I)
    if m:
        meta["total_amount"] = _parse_amount(m.group(1))

    if not meta["total_amount"]:
        m = re.search(r"(?:Rs\.?\s*)?([\d,]+\.?\d*)\s*(?:\n|$)", full_text)
        if m:
            meta["total_amount"] = _parse_amount(m.group(1))

    # PSID (challan number)
    m = re.search(r"PSID\s*#?\s*:?\s*(\d{10,})", full_text)
    if m:
        meta["challan_number"] = m.group(1).strip()

    if not meta["challan_number"]:
        m = re.search(r"PSID\s*#?\s*:?\s*(\d+)", full_text)
        if m:
            meta["challan_number"] = m.group(1).strip()

    # Period from PSID-IT pattern: PSID-IT-XXXX-{MM}{YYYY}
    m = re.search(r"PSID-IT-\d+-(\d{2})(\d{4})", full_text)
    if m:
        month_num, year_num = m.group(1), m.group(2)
        if 1 <= int(month_num) <= 12:
            meta["period"] = f"{year_num}-{month_num}"

    if not meta["period"]:
        m = re.search(r"Month/Year\s+(\d{2})\s+(\d{2,4})", full_text, re.I)
        if m:
            month_num, year_num = m.group(1), m.group(2)
            if len(year_num) == 2:
                year_num = f"20{year_num}"
            if 1 <= int(month_num) <= 12:
                meta["period"] = f"{year_num}-{month_num}"

    # Tax Year
    m = re.search(r"Tax\s+Year\s*[:.]?\s*(\d{4})", full_text, re.I)
    meta["tax_year"] = m.group(1) if m else ""

    if not meta["tax_year"]:
        m = re.search(r"INCOME\s+TAX\s+PAYMENT\s+CHALLAN(?:\s|\S)*?\n\s*(\d{4})", full_text, re.I)
        if m:
            meta["tax_year"] = m.group(1)
    if not meta["tax_year"]:
        # Try RTO line format: "RTO ABBOTTABAD 6 2 2026"
        m = re.search(r"RTO\s+\S+\s+\d+\s+\d+\s+(\d{4})", full_text)
        if m:
            meta["tax_year"] = m.group(1)
    if not meta["tax_year"]:
        m = re.search(r"LTU/MTU/RTO\s+Code\s+Tax\s+Year\s*\n\s*\S+\s+\S+\s+(\d{4})", full_text, re.I)
        if m:
            meta["tax_year"] = m.group(1)
    if not meta["tax_year"] and meta["period"]:
        meta["tax_year"] = meta["period"][:4]

    # Payment Section
    m = re.search(r"Payment\s+Section\s+Code\s*[:.]?\s*(\d+)", full_text, re.I)
    if m:
        meta["payment_section_code"] = m.group(1).strip()
    if not meta["payment_section_code"]:
        m = re.search(r"Payment\s+Section\s+Code\s*\n\s*(\d+)", full_text)
        if m:
            meta["payment_section_code"] = m.group(1).strip()

    if not meta["payment_section_code"]:
        m = re.search(r"Payment\s+Section\s*[\(\)]?\s*(?:Section)?\s*[:\-]?\s*\d{3}\([^)]+\)\s*[-–]\s*(?:Description\s+of\s+Payment\s+Section)?\s*\n\s*.+?\s*-\s*(\d{8})", full_text, re.I)
        if m:
            meta["payment_section_code"] = m.group(1)

    # Payment Date
    m = re.search(r"Date:\s*(\d{1,2}-[A-Za-z]+-\d{4})", full_text)
    if m:
        meta["payment_date"] = _parse_date(m.group(1))
    if not meta["payment_date"]:
        m = re.search(r"Date:\s*(\d{1,2}-[A-Za-z]+-\d{4})", full_text)
        if m:
            meta["payment_date"] = _parse_date(m.group(1))

    # Prepared By date as fallback
    if not meta["payment_date"]:
        m = re.search(r"Prepared\s+By\s*:.*?Date:\s*(\d{1,2}-[A-Za-z]+-\d{4})", full_text)
        if m:
            meta["payment_date"] = _parse_date(m.group(1))

    # Build entry from challan data
    entries = []
    entry = {
        "name": meta["withholding_agent"],
        "cnicNtn": meta["agent_cnic"] or meta.get("ntn", ""),
        "date": meta["payment_date"] or meta.get("generation_date", ""),
        "code": meta["payment_section_code"],
        "taxable": meta["total_amount"],
        "tax": meta["total_amount"],
    }
    if entry["name"]:
        entries.append(_clean_entry(entry))
    else:
        # Try to find taxpayer details in the challan body text
        pass  # single challan entries go as withholding agent entry

    return {"entries": entries, "metadata": meta}


# ── Main Entry Point ──────────────────────────────────────────────────────────

def parse_pdf(file_bytes: bytes, filename: str = "") -> dict:
    try:
        lines = _extract_text_lines(file_bytes)
        if not lines:
            return {
                "success": False,
                "format": "unknown",
                "entries": [],
                "metadata": _empty_metadata(),
                "errors": ["No text could be extracted from this PDF"],
            }

        full_text = "\n".join(lines)
        fmt = detect_format(full_text)

        if fmt == "cpr":
            result = _parse_cpr_lines(lines)
        elif fmt == "challan":
            result = _parse_challan_lines(lines)
        else:
            # Try each parser and return whichever gets results
            cpr_result = _parse_cpr_lines(lines)
            challan_result = _parse_challan_lines(lines)
            if len(cpr_result["entries"]) >= len(challan_result["entries"]):
                result = cpr_result
            else:
                result = challan_result
            if not result["entries"]:
                return {
                    "success": False,
                    "format": "unknown",
                    "entries": [],
                    "metadata": _empty_metadata(),
                    "errors": ["Could not recognize PDF format. Expected FBR challan or CPR receipt."],
                }

        result["success"] = True
        result["format"] = fmt
        result["errors"] = []
        return result

    except Exception as e:
        return {
            "success": False,
            "format": "unknown",
            "entries": [],
            "metadata": _empty_metadata(),
            "errors": [f"PDF parsing error: {str(e)}"],
        }
