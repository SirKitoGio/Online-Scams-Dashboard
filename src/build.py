import pathlib
r = pathlib.Path(__file__).parent
root = r.parent
t = (r / 'template.html').read_text()
t = t.replace('__CSV__', (root / 'sulat-ph-online-scams.csv').read_text().replace('`', "'"))
t = t.replace('__CHARTJS__', (r / 'chart.min.js').read_text())
(root / 'index.html').write_text(t)
print("Built index.html:", (root / 'index.html').stat().st_size, "bytes")
