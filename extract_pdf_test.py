import pdfplumber

filepath = r'withholding challan\236h challan ( may 2026.pdf'
with pdfplumber.open(filepath) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        print(f'--- Page {i+1} ---')
        print(text)
        print()