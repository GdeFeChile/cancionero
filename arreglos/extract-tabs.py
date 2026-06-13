#!/usr/bin/python3
"""
Extract tablature text from a guitar arrangement PDF.

Usage:
  /usr/bin/python3 extract-tabs.py <pdf-file>
  /usr/bin/python3 extract-tabs.py <pdf-file> > tab.txt
"""

import sys
import os

try:
    import fitz
except ImportError:
    print("PyMuPDF not found. Install: /usr/bin/python3 -m pip install PyMuPDF", file=sys.stderr)
    sys.exit(1)


def extract_text(pdf_path: str) -> str:
    """Extract text content from a PDF, preserving vertical layout."""
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


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <pdf-file>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.isfile(pdf_path):
        print(f"File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    text = extract_text(pdf_path)
    print(text)
