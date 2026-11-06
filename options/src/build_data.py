"""Generates options/data.js from the CSV so no figure is retyped by hand."""
import csv, json, pathlib
root = pathlib.Path(__file__).resolve().parents[2]
rows = list(csv.DictReader(open(root / 'sulat-ph-online-scams.csv', encoding='utf-8-sig')))
(pathlib.Path(__file__).parent / 'data.js').write_text('window.SCAM_ROWS=' + json.dumps(rows, ensure_ascii=False) + ';\n', encoding='utf-8')
print(len(rows), 'rows')
