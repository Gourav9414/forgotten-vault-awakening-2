import json
import math
import pathlib
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / "math/index.json").read_text(encoding="utf-8"))
failed = False

for mode in manifest.get("modes", []):
    csv_rel = mode.get("lookup") or mode.get("table") or mode.get("weights")
    book_rel = mode.get("book") or mode.get("events") or mode.get("game_logic")
    if not csv_rel or not book_rel:
        print(f"FAIL {mode.get('name')}: missing CSV/book reference")
        failed = True
        continue

    csv_path = root / "math" / csv_rel
    book_path = root / "math" / book_rel
    try:
        lines = csv_path.read_text(encoding="utf-8").strip().splitlines()
        if not lines or lines[0].strip() != "id,payout,probability":
            raise ValueError(f"unexpected CSV header: {lines[0] if lines else '<empty>'}")
        csv_rows = {}
        for line_number, line in enumerate(lines[1:], start=2):
            cols = [part.strip() for part in line.split(",")]
            if len(cols) != 3:
                raise ValueError(f"CSV row {line_number} does not have 3 columns")
            key = int(cols[0])
            if key in csv_rows:
                raise ValueError(f"duplicate CSV id {key}")
            csv_rows[key] = float(cols[1])

        raw = subprocess.run(["zstd", "-dc", str(book_path)], check=True, capture_output=True, text=True).stdout
        book_rows = {}
        for line_number, line in enumerate(raw.splitlines(), start=1):
            if not line.strip():
                continue
            obj = json.loads(line)
            key = int(obj["id"])
            if key in book_rows:
                raise ValueError(f"duplicate book id {key} (line {line_number})")
            book_rows[key] = float(obj["total_payout"])

        if set(csv_rows) != set(book_rows):
            missing_book = sorted(set(csv_rows) - set(book_rows))[:5]
            missing_csv = sorted(set(book_rows) - set(csv_rows))[:5]
            raise ValueError(f"id set mismatch; missing book IDs={missing_book}, missing CSV IDs={missing_csv}")

        mismatches = [
            (key, csv_rows[key], book_rows[key])
            for key in sorted(csv_rows)
            if not math.isclose(csv_rows[key], book_rows[key], rel_tol=0.0, abs_tol=0.000001)
        ]
        if mismatches:
            raise ValueError(f"{len(mismatches)} payout mismatches; first={mismatches[0]}")
        print(f"PASS {mode['name']}: {len(csv_rows)} IDs and total_payout values match CSV")
    except Exception as exc:
        print(f"FAIL {mode.get('name')}: {exc}")
        failed = True

if failed:
    sys.exit(1)
print("PASS: CSV-to-book ID and total_payout mapping check. This is not official Stake SDK validation.")
