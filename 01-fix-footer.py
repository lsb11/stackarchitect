#!/usr/bin/env python3
"""
fix-footer.py v2 — Stack Architect Footer.astro credibility cleanup
Order matters: longer phrases match before shorter ones.
"""

import re
import sys
import shutil
from pathlib import Path
from datetime import datetime

FOOTER_PATH = Path("src/components/Footer.astro")

REPLACEMENTS = [
    (
        re.compile(r"500\+\s+stores\s+running(\s+this\s+stack)?", re.IGNORECASE),
        "Open-source on GitHub",
        "'500+ stores running' -> 'Open-source on GitHub'"
    ),
    (
        re.compile(r"(Verified\s+by|Used\s+by|Tested\s+across|Trusted\s+by)\s+500\+\s+stores", re.IGNORECASE),
        "Open-source - free to audit",
        "'Verified/Used/Tested by 500+ stores' -> factual replacement"
    ),
    (
        re.compile(r"500\+\s+Shopify\s+stores", re.IGNORECASE),
        "open-source automation",
        "'500+ Shopify stores' -> factual replacement"
    ),
    (
        re.compile(r"500\+\s+STORES", re.IGNORECASE),
        "OPEN-SOURCE",
        "'500+ STORES' badge -> 'OPEN-SOURCE'"
    ),
    (
        re.compile(r"\u2605+\s*4\.9\s*/\s*5", re.IGNORECASE),
        "",
        "Star + 4.9/5 fake rating: removed"
    ),
    (
        re.compile(r"4\.9\s*/\s*5", re.IGNORECASE),
        "",
        "4.9/5 fake rating: removed"
    ),
]

def main():
    if not FOOTER_PATH.exists():
        print(f"ERROR: {FOOTER_PATH} not found.")
        sys.exit(1)

    original = FOOTER_PATH.read_text()
    modified = original
    changes_made = []

    for pattern, replacement, description in REPLACEMENTS:
        new_content, count = pattern.subn(replacement, modified)
        if count > 0:
            changes_made.append(f"  + {description} ({count})")
            modified = new_content

    if modified == original:
        print("Footer.astro already clean.")
        return

    backup_path = FOOTER_PATH.with_suffix(f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy(FOOTER_PATH, backup_path)
    print(f"Backup: {backup_path}\n")

    FOOTER_PATH.write_text(modified)
    print(f"Fixed {FOOTER_PATH}:")
    for change in changes_made:
        print(change)

if __name__ == "__main__":
    main()
