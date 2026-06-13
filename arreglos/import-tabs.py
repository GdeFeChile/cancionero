#!/usr/bin/python3
"""
Import extracted tablatures into the app's localStorage data.

Usage:
  1. First run batch-extract.py to create .txt files
  2. Open the app in Chrome, open DevTools (F12)
  3. Copy the output of this script and paste it in the Console
  4. This will update each song's guitarTab field with the extracted text

Example:
  /usr/bin/python3 import-tabs.py
  # Copy the console.log output, paste in DevTools Console
"""

import os
import glob
import json
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
canciones_dir = os.path.join(script_dir, "canciones")

# Read all .txt files
tabs = {}  # normalized name -> text
for txt_path in sorted(glob.glob(os.path.join(canciones_dir, "*.txt"))):
    basename = os.path.splitext(os.path.basename(txt_path))[0]
    # Normalize: lowercase, remove parenthetical info like (bpm), remove special chars
    name = basename.split("(")[0].split("[")[0].strip()
    name = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]', '', name).strip().lower()
    with open(txt_path, "r") as f:
        text = f.read()
    if text.strip():
        tabs[name] = text

# Generate JavaScript code to update localStorage
print("// Paste this in Chrome DevTools Console")
print("// This will update each song's guitarTab with extracted tablature text")
print()
print("const songs = JSON.parse(localStorage.getItem('gdefe_canciones') || '[]');")
print("let updated = 0;")
print()

# Map songs to tabs
for name, text in sorted(tabs.items()):
    # Escape for JS string
    text_escaped = text.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '')
    print(f"songs.forEach(s => {{")
    print(f"  const n = s.title.toLowerCase().trim();")
    # Try exact match
    print(f"  if (n === '{name}' || n.startsWith('{name}')) {{")
    print(f"    if (!s.guitarTab) {{ s.guitarTab = '{text_escaped}'; updated++; }}")
    print(f"  }}")
    print(f"}});")

print()
print("localStorage.setItem('gdefe_canciones', JSON.stringify(songs));")
print(f"console.log('Import complete. Updated', updated, 'songs.');")
