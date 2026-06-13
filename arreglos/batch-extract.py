#!/usr/bin/python3
"""
Batch extract all PDFs in canciones/ to .txt files.
Run from the arreglos/ directory:
  /usr/bin/python3 batch-extract.py
"""

import os
import sys
import glob

try:
    import fitz
except ImportError:
    print("PyMuPDF not found. Install: /usr/bin/python3 -m pip install PyMuPDF", file=sys.stderr)
    sys.exit(1)

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    lines = []
    for page in doc:
        blocks = page.get_text("dict")["blocks"]
        text_lines = []
        for block in blocks:
            if block["type"] == 0:
                for line in block["lines"]:
                    line_text = ""
                    for span in line["spans"]:
                        line_text += span["text"]
                    if line_text.strip():
                        text_lines.append((line["bbox"][1], line_text))
        text_lines.sort(key=lambda x: x[0])
        for _, text in text_lines:
            lines.append(text)
    doc.close()
    return "\n".join(lines)

script_dir = os.path.dirname(os.path.abspath(__file__))
canciones_dir = os.path.join(script_dir, "canciones")
pdfs = sorted(glob.glob(os.path.join(canciones_dir, "*.pdf")))

if not pdfs:
    print("No PDFs found in canciones/")
    sys.exit(0)

for pdf_path in pdfs:
    txt_path = pdf_path.replace(".pdf", ".txt")
    if os.path.exists(txt_path):
        print(f"  SKIP (exists): {os.path.basename(pdf_path)}")
        continue
    try:
        text = extract_text(pdf_path)
        with open(txt_path, "w") as f:
            f.write(text)
        print(f"  OK: {os.path.basename(pdf_path)} ({len(text)} chars)")
    except Exception as e:
        print(f"  ERROR: {os.path.basename(pdf_path)} — {e}")

print(f"\nDone. Processed {len(pdfs)} PDFs.")
