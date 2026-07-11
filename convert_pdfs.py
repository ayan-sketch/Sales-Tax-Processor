import os
import pdfplumber
import fitz  # PyMuPDF

# Source and destination directories
source_dir = "Software documenation"
dest_dir = "docs"

# Mapping of PDF files to desired markdown filenames
pdf_to_md = {
    "Product Requirements Document - Tax Compliance Management System.pdf": "01-PRD.md",
    "Technical Requirements Document 2.pdf": "02-Technical-Requirements.md",
    "APP Flow & User Journey Document 3.pdf": "03-AppFlow.md",
    "UI-UX Design System for Tax Compliance Managemen 4 t.pdf": "04-UIUX.md",
    "Backend Schema & Data Architecture. 5 pdf.pdf": "05-Backend-Schema.md",
    "Implementation Plan & Development Roadmap 6.pdf": "06-Implementation-Plan.md",
    "Tax Compliance Management System ERD 7 .pdf": "07-ERD.md",
    "API Specification Document 8.pdf": "08-API-Specification.md",
    "Project Folder Structure & Code Architecture10 .pdf": "09-Architecture.md",
    "Screen Inventory & Specification Document 10.pdf": "10-Screen-Inventory.md",
    "Wireframe Specification & Layout Blueprint 12.pdf": "11-Wireframes.md",
}

def extract_with_pdfplumber(pdf_path):
    """Extract text using pdfplumber (better for tables and structured content)"""
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                text_parts.append(f"<!-- Page {i+1} -->\n{text}")
            
            # Also extract tables
            tables = page.extract_tables()
            for table in tables:
                if table:
                    text_parts.append("\n<!-- Table -->\n")
                    for row in table:
                        if row:
                            # Filter out None values and join
                            clean_row = [str(cell) if cell is not None else "" for cell in row]
                            text_parts.append(" | ".join(clean_row))
    return "\n\n".join(text_parts)

def extract_with_pymupdf(pdf_path):
    """Extract text using PyMuPDF (good fallback)"""
    doc = fitz.open(pdf_path)
    text_parts = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            text_parts.append(f"<!-- Page {i+1} -->\n{text}")
    doc.close()
    return "\n\n".join(text_parts)

def convert_pdf_to_markdown(pdf_path, md_path):
    """Convert a single PDF to Markdown"""
    print(f"Converting: {pdf_path} -> {md_path}")
    
    # Try pdfplumber first (better for tables)
    try:
        content = extract_with_pdfplumber(pdf_path)
        if not content.strip():
            raise ValueError("Empty content from pdfplumber")
    except Exception as e:
        print(f"  pdfplumber failed: {e}, trying PyMuPDF...")
        content = extract_with_pymupdf(pdf_path)
    
    # Write to markdown file
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  Done: {len(content)} characters written")

def main():
    # Ensure destination directory exists
    os.makedirs(dest_dir, exist_ok=True)
    
    for pdf_file, md_file in pdf_to_md.items():
        pdf_path = os.path.join(source_dir, pdf_file)
        md_path = os.path.join(dest_dir, md_file)
        
        if os.path.exists(pdf_path):
            convert_pdf_to_markdown(pdf_path, md_path)
        else:
            print(f"WARNING: File not found: {pdf_path}")
    
    print("\nAll conversions complete!")
    
    # List created files
    print("\nCreated markdown files:")
    for md_file in sorted(os.listdir(dest_dir)):
        md_path = os.path.join(dest_dir, md_file)
        size = os.path.getsize(md_path)
        print(f"  {md_file} ({size} bytes)")

if __name__ == "__main__":
    main()