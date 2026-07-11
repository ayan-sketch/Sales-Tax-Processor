"""Extract text from the 236H challan PDF to see the actual layout."""
import pdfplumber

filepath = r"withholding challan\236h challan ( may 2026.pdf"

with pdfplumber.open(filepath) as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"=== PAGE {i+1} ===")
        text = page.extract_text()
        if text:
            print(text)
        else:
            print("[No text extracted]")
        print()

        # Also try extracting tables
        tables = page.extract_tables()
        if tables:
            for ti, table in enumerate(tables):
                print(f"--- TABLE {ti+1} ---")
                for row in table:
                    print(row)
                print()