#!/usr/bin/python3

"""
Extract tablature text from guitar arrangement PDFs.

Usage:
  /usr/bin/python3 extract-tabs.py alaba.pdf
  /usr/bin/python3 extract-tabs.py alaba.pdf > alaba.txt

Extracted text can be pasted into the song editor's "Tablatura" field.
"""
import sys
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not found. Install it with: /usr/bin/python3 -m pip install PyMuPDF", file=sys.stderr)
    sys.exit(1)


def extract_tabs(pdf_path: str) -> str:
    """Extract text content from a PDF, returning the tablature text."""
    doc = fitz.open(pdf_path)
    lines = []
    for page in doc:
        # Get text blocks with positions to reconstruct layout
        blocks = page.get_text("dict")["blocks"]
        text_lines = []

        for block in blocks:
            if block["type"] == 0:  # text block
                for line in block["lines"]:
                    line_text = ""
                    for span in line["spans"]:
                        line_text += span["text"]
                    if line_text.strip():
                        text_lines.append((line["bbox"][1], line_text))  # (y, text)

        # Sort by vertical position and join
        text_lines.sort(key=lambda x: x[0])
        for _, text in text_lines:
            lines.append(text)

    doc.close()
    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <pdf-file>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.isfile(pdf_path):
        print(f"File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    text = extract_tabs(pdf_path)
    print(text)
