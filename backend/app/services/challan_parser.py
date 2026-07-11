"""
Parser for FBR withholding challan PDFs (236H and 153).
Handles text-extractable PDFs and returns a structured result.
For scanned/image PDFs, returns an actionable error suggesting OCR.
"""
import re
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Literal
from dataclasses import dataclass, field

import pdfplumber
import fitz  # PyMuPDF


@dataclass
class ChallanExtractResult:
    section_type: Literal["236H", "153"]
    client_name: str
    ntn: Optional[str] = None
    cnic: Optional[str] = None
    period: Optional[str] = None       # YYYY-MM
    challan_number: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    tax_year: Optional[str] = None      # e.g., "2026"
    payment_section_code: Optional[str] = None
    confidence: dict = field(default_factory=dict)  # field-level flags


MONTH_MAP = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "jun": "06", "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber, fallback to pymupdf."""
    text = ""
    try:
        with pdfplumber.open(file_bytes) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    except Exception:
        pass

    if not text.strip():
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                t = page.get_text()
                if t:
                    text += t + "\n"
        except Exception:
            pass

    return text


def _detect_section(text: str) -> Optional[Literal["236H", "153"]]:
    """Detect section type from text."""
    if re.search(r"236[-\s]?[Hh]", text):
        return "236H"
    if re.search(r"\b153\b", text):
        return "153"
    return None


def _parse_236h_challan(text: str) -> ChallanExtractResult:
    """Parse a 236H withholding challan."""
    result = ChallanExtractResult(section_type="236H", client_name="")
    full_text = text

    name_match = re.search(r"Name\s+of\s+withholding\s+agent\s+[:.]?\s*(.+?)(?:\n|$)", full_text, re.IGNORECASE)
    if name_match:
        name = name_match.group(1).strip()
        if name:
            result.client_name = name
            result.confidence["client_name"] = "high"

    cnic_match = re.search(r"CNIC/Reg\./Inc\.\s*No\.?\s*[:.]?\s*(\d{13})", full_text, re.IGNORECASE)
    if cnic_match:
        result.cnic = cnic_match.group(1).strip()
        result.confidence["cnic"] = "high"
    else:
        cnic_match2 = re.search(r"CNIC\s*[:.]?\s*(\d{13})", full_text, re.IGNORECASE)
        if cnic_match2:
            result.cnic = cnic_match2.group(1).strip()
            result.confidence["cnic"] = "high"

    ntn_match = re.search(r"(?:NTN|NTN\s*No[.:]?)\s*:?\s*(\d{7}[\s-]?\d)", full_text, re.IGNORECASE)
    if ntn_match:
        ntn_raw = ntn_match.group(1).strip()
        ntn_digits = re.sub(r"[^\d]", "", ntn_raw)
        if len(ntn_digits) == 8:
            result.ntn = f"{ntn_digits[:7]}-{ntn_digits[7]}"
            result.confidence["ntn"] = "high"
        elif len(ntn_digits) == 7:
            result.ntn = f"{ntn_digits}-?"
            result.confidence["ntn"] = "medium"

    amount_match = re.search(r"Total\s+Tax\s+Deducted\s+([\d,]+\.?\d*)", full_text, re.IGNORECASE)
    if amount_match:
        try:
            amount_str = amount_match.group(1).replace(",", "")
            result.amount = Decimal(amount_str)
            result.confidence["amount"] = "high"
        except Exception:
            pass

    if not result.amount:
        amount_match2 = re.search(r"Rs\.?\s*([\d,]+\.?\d*)", full_text)
        if amount_match2:
            try:
                amount_str = amount_match2.group(1).replace(",", "")
                result.amount = Decimal(amount_str)
                result.confidence["amount"] = "medium"
            except Exception:
                pass

    psid_period_match = re.search(r"PSID-IT-\d+-(\d{2})(\d{4})", full_text)
    if psid_period_match:
        month_num = psid_period_match.group(1)
        year_num = psid_period_match.group(2)
        if 1 <= int(month_num) <= 12:
            result.period = f"{year_num}-{month_num}"
            result.confidence["period"] = "high"

    if not result.period:
        period_match = re.search(r"Month/Year\s+(\d{2})\s+(\d{2,4})", full_text, re.IGNORECASE)
        if period_match:
            month_num = period_match.group(1)
            year_num = period_match.group(2)
            if len(year_num) == 2:
                year_num = f"20{year_num}"
            if 1 <= int(month_num) <= 12:
                result.period = f"{year_num}-{month_num}"
                result.confidence["period"] = "high"

    tax_year_match = re.search(r"INCOME\s+TAX\s+PAYMENT\s+CHALLAN\s*\n\s*(\d{4})", full_text, re.IGNORECASE)
    if tax_year_match:
        result.tax_year = tax_year_match.group(1)
        result.confidence["tax_year"] = "high"

    if not result.tax_year:
        tax_year_match2 = re.search(r"Tax\s+Year\s*[:.]?\s*(\d{4})", full_text, re.IGNORECASE)
        if tax_year_match2:
            result.tax_year = tax_year_match2.group(1)
            result.confidence["tax_year"] = "high"

    if not result.tax_year:
        if result.period and len(result.period) >= 4:
            result.tax_year = result.period[:4]
            result.confidence["tax_year"] = "medium"

    psid_match = re.search(r"PSID\s*#?\s*[:.]?\s*(\d{10,})", full_text)
    if psid_match:
        result.challan_number = psid_match.group(1).strip()
        result.confidence["challan_number"] = "high"

    date_match = re.search(r"Date:\s*(\d{1,2}-[A-Za-z]+-\d{4})", full_text)
    if date_match:
        try:
            result.payment_date = datetime.strptime(date_match.group(1), "%d-%b-%Y").date()
            result.confidence["payment_date"] = "medium"
        except ValueError:
            pass

    # Extract payment section code
    psc_match = re.search(r"Payment\s+Section\s+Code\s*[:.]?\s*(\d+)", full_text, re.IGNORECASE)
    if psc_match:
        result.payment_section_code = psc_match.group(1).strip()
        result.confidence["payment_section_code"] = "high"

    return result


def _parse_153_challan(text: str) -> ChallanExtractResult:
    """Parse a 153 withholding challan."""
    result = ChallanExtractResult(section_type="153", client_name="")

    for line in [line.strip() for line in text.splitlines() if line.strip()]:
        lowered = line.lower()

        if not result.client_name and (lowered.startswith("name") or lowered.startswith("taxpayer name") or lowered.startswith("assessee")):
            value = line.split(":", 1)[1].strip() if ":" in line else line
            value = re.sub(r"^name\s+of\s+depositor\s*", "", value, flags=re.IGNORECASE)
            value = re.sub(r"^name\s*", "", value, flags=re.IGNORECASE)
            value = re.sub(r"\s+", " ", value).strip()
            if value:
                result.client_name = value
                result.confidence["client_name"] = "high"

        if not result.cnic and ("cnic" in lowered or "nic" in lowered or "id no" in lowered):
            value = line.split(":", 1)[1].strip() if ":" in line else line
            digits = re.sub(r"[^\d]", "", value)
            if len(digits) == 13:
                result.cnic = digits
                result.confidence["cnic"] = "high"

        if not result.payment_section_code and lowered.startswith("payment section code"):
            value = line.split(":", 1)[1].strip() if ":" in line else line
            value = re.sub(r"^payment\s+section\s+code\s*", "", value, flags=re.IGNORECASE).strip()
            if value:
                result.payment_section_code = value
                result.confidence["payment_section_code"] = "high"

        if not result.amount and (lowered.startswith("amount") or lowered.startswith("total tax deducted") or lowered.startswith("total due") or lowered.startswith("tax paid")):
            value = line.split(":", 1)[1].strip() if ":" in line else line
            value = re.sub(r"^(amount|total\s+tax\s+deducted|total\s+due|tax\s+paid)\s*", "", value, flags=re.IGNORECASE)
            value = re.sub(r"[^\d,]", "", value)
            if value:
                try:
                    result.amount = Decimal(value.replace(",", ""))
                    result.confidence["amount"] = "high"
                except Exception:
                    pass

        if not result.period and ("month/year" in lowered or lowered.startswith("period") or "for the month" in lowered):
            period_match = re.search(r"(\d{2})\s+(\d{2,4})", line)
            if period_match:
                month_num = period_match.group(1)
                year_num = period_match.group(2)
                if len(year_num) == 2:
                    year_num = f"20{year_num}"
                if 1 <= int(month_num) <= 12:
                    result.period = f"{year_num}-{month_num}"
                    result.confidence["period"] = "high"

        if not result.challan_number and lowered.startswith("psid"):
            value = line.split(":", 1)[1].strip() if ":" in line else line
            value = re.sub(r"^psid\s*#?\s*", "", value, flags=re.IGNORECASE).strip()
            if value:
                result.challan_number = value
                result.confidence["challan_number"] = "high"

        if not result.payment_date and ("payment date" in lowered or lowered.startswith("date") or lowered.startswith("paid on") or lowered.startswith("deposit date")):
            value = line.split(":", 1)[1].strip() if ":" in line else line
            for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%Y-%m-%d"):
                try:
                    result.payment_date = datetime.strptime(value, fmt).date()
                    result.confidence["payment_date"] = "high"
                    break
                except ValueError:
                    continue

    ntn_match = re.search(r"(?:NTN|NTN\s*No[.:]?)\s*:?\s*(\d{7}[\s-]?\d)", text, re.IGNORECASE)
    if ntn_match:
        ntn_raw = ntn_match.group(1).strip()
        ntn_digits = re.sub(r"[^\d]", "", ntn_raw)
        if len(ntn_digits) == 8:
            result.ntn = f"{ntn_digits[:7]}-{ntn_digits[7]}"
            result.confidence["ntn"] = "high"

    return result


def parse_challan_pdf(file_bytes: bytes, section_hint: Optional[str] = None) -> ChallanExtractResult:
    """Parse a withholding challan PDF and return extracted data."""
    text = _extract_text_from_pdf(file_bytes)
    if not text.strip():
        raise ValueError("No text could be extracted from the PDF")

    section = section_hint or _detect_section(text)
    if section == "236H":
        return _parse_236h_challan(text)
    if section == "153":
        return _parse_153_challan(text)
    raise ValueError("Unable to detect challan section")
