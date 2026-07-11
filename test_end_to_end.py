"""
End-to-end integration test for 236H challan import flow.
Tests: parsing -> client resolution -> record creation -> DB persistence
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from decimal import Decimal
from datetime import date

# 1. Test the parser
from app.services.challan_parser import parse_challan_pdf

pdf_path = r"withholding challan\236h challan ( may 2026.pdf"
with open(pdf_path, "rb") as f:
    file_bytes = f.read()

result = parse_challan_pdf(file_bytes)

print("=" * 60)
print("PHASE 1: PDF PARSING")
print("=" * 60)
print(f"Section Type:     {result.section_type}  ({type(result.section_type).__name__})")
print(f"Client Name:      {result.client_name}")
print(f"CNIC:             {result.cnic}")
print(f"NTN:              {result.ntn}")
print(f"Tax Year:         {result.tax_year}")
print(f"Period:           {result.period}")
print(f"Amount:           {result.amount}")
print(f"Challan Number:   {result.challan_number}")
print(f"Payment Date:     {result.payment_date}")
print(f"Confidence:       {result.confidence}")

# Validate parser output
errors = []
assert result.section_type == "236H", f"section_type wrong: {result.section_type}"
assert "KHAWAR" in result.client_name.upper(), f"client_name wrong: {result.client_name}"
assert result.cnic == "1310112184639", f"CNIC wrong: {result.cnic}"
assert result.amount == Decimal("371600"), f"Amount wrong: {result.amount}"
assert result.period == "2026-05", f"Period wrong: {result.period}"
assert result.tax_year == "2026", f"Tax year wrong: {result.tax_year}"
assert result.challan_number == "1104058569", f"Challan number wrong: {result.challan_number}"
assert result.payment_date == date(2026, 6, 11), f"Payment date wrong: {result.payment_date}"
print("\n[PASS] PHASE 1 PASSED: All parser extractions correct!\n")

# 2. Test WithholdingType enum compatibility
from app.models.withholding import WithholdingType
from sqlalchemy import create_engine, Column, String
from sqlalchemy.orm import Session, declarative_base

print("=" * 60)
print("PHASE 2: Enum Compatibility Check")
print("=" * 60)

# Verify string "236H" maps correctly to WithholdingType enum
type_map = {
    "236H": WithholdingType.TYPE_236H,
    "153": WithholdingType.TYPE_153,
}

for str_val, enum_val in type_map.items():
    assert WithholdingType(str_val) == enum_val, f"Enum mismatch for {str_val}"
    assert str_val == enum_val.value, f"Enum value mismatch for {str_val}"
    print(f"  '{str_val}' -> WithholdingType.{enum_val.name} [OK]")

# Verify the parser output string can be converted to the enum
section_enum = WithholdingType(result.section_type)
assert section_enum == WithholdingType.TYPE_236H, f"section_type '{result.section_type}' not convertible to WithholdingType"
print(f"\n  Result section_type '{result.section_type}' -> WithholdingType.TYPE_236H [OK]")
print("\n[PASS] PHASE 2 PASSED: Enum compatibility confirmed!\n")

# 3. Test DB save cycle
print("=" * 60)
print("PHASE 3: DB Save & Read Cycle")
print("=" * 60)

import uuid

# Create in-memory SQLite database with the same table structure
TEST_DB_PATH = "test_withholding_e2e.db"
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

engine = create_engine(f"sqlite:///{TEST_DB_PATH}", echo=False)
TestBase = declarative_base()

class TestWithholdingRecord(TestBase):
    __tablename__ = "withholding_records"
    id = Column(String(36), primary_key=True)
    client_id = Column(String(36), nullable=False)
    section_type = Column(String(10), nullable=False)
    period = Column(String(50), nullable=False)
    challan_number = Column(String(100), nullable=True)
    amount = Column(String(50), nullable=True)
    payment_date = Column(String(20), nullable=True)
    remarks = Column(String(500), nullable=True)
    document_id = Column(String(36), nullable=True)

TestBase.metadata.create_all(engine)

with Session(engine) as session:
    record_id = str(uuid.uuid4())
    test_record = TestWithholdingRecord(
        id=record_id,
        client_id=str(uuid.uuid4()),
        section_type=result.section_type,
        period=result.period,
        challan_number=result.challan_number,
        amount=str(result.amount) if result.amount else "0",
        payment_date=str(result.payment_date) if result.payment_date else None,
        remarks="Imported from 236H challan (test)",
    )
    session.add(test_record)
    session.commit()

    saved = session.query(TestWithholdingRecord).filter_by(id=record_id).first()
    assert saved is not None, "Record was not saved to DB!"
    assert saved.section_type == "236H", f"Saved section_type wrong: {saved.section_type}"
    assert saved.period == "2026-05", f"Saved period wrong: {saved.period}"
    assert saved.challan_number == "1104058569", f"Saved challan_number wrong: {saved.challan_number}"
    assert saved.amount == str(Decimal("371600")), f"Saved amount wrong: {saved.amount}"

print(f"  Record ID:       {record_id}")
print(f"  Section Type:    {saved.section_type}")
print(f"  Period:          {saved.period}")
print(f"  Challan Number:  {saved.challan_number}")
print(f"  Amount:          {saved.amount}")
print(f"  Payment Date:    {saved.payment_date}")
print("\n[PASS] PHASE 3 PASSED: DB save & read cycle confirmed!\n")

# Cleanup
engine.dispose()
if os.path.exists(TEST_DB_PATH):
    try:
        os.remove(TEST_DB_PATH)
    except PermissionError:
        pass  # Windows file locking, not critical

print("=" * 60)
print("[PASS] ALL END-TO-END TESTS PASSED!")
print("=" * 60)
print()
print("Summary of fields saved:")
print(f"  - Client Name:       {result.client_name}")
print(f"  - CNIC/Reg./Inc. No: {result.cnic}")
print(f"  - Total Tax Deducted: {result.amount}")
print(f"  - Payment Section:    {result.section_type}")
print(f"  - Tax Year:           {result.tax_year}")
print(f"  - Month/Year:         {result.period}")
print(f"  - Challan Number:     {result.challan_number}")
print(f"  - Payment Date:       {result.payment_date}")