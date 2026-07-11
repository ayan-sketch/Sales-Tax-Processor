"""Test the existing 236H parser with the actual PDF."""
import sys
sys.path.insert(0, r"c:\Users\fgsdfg\Desktop\sale tax software\backend")

from app.services.challan_parser import parse_challan_pdf, _extract_text_from_pdf

filepath = r"withholding challan\236h challan ( may 2026.pdf"

with open(filepath, "rb") as f:
    file_bytes = f.read()

# First show the raw text
text = _extract_text_from_pdf(file_bytes)
print("=== RAW TEXT ===")
print(repr(text))
print()

# Now parse
result = parse_challan_pdf(file_bytes)
print("=== PARSER RESULT ===")
print(f"section_type: {result.section_type}")
print(f"client_name: '{result.client_name}'")
print(f"ntn: {result.ntn}")
print(f"cnic: {result.cnic}")
print(f"period: {result.period}")
print(f"challan_number: {result.challan_number}")
print(f"amount: {result.amount}")
print(f"payment_date: {result.payment_date}")
print(f"tax_year: {result.tax_year}")
print(f"confidence: {result.confidence}")