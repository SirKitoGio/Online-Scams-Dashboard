"""Builds self-contained files into options/: each option, plus index.html holding all three."""
import json, pathlib, runpy
src = pathlib.Path(__file__).resolve().parent
out = src.parent
runpy.run_path(str(src / 'build_data.py'))
read = lambda n: (src / n).read_text(encoding='utf-8')
safe = lambda s: s.replace('</script', '<\\/script')
pages = {}
for f in sorted(src.glob('option-*.html')):
    t = f.read_text(encoding='utf-8')
    t = t.replace('<link rel="stylesheet" href="shared.css">', '<style>' + read('shared.css') + '</style>')
    t = t.replace('<script src="data.js"></script>', '<script>' + safe(read('data.js')) + '</script>')
    t = t.replace('<script src="shared.js"></script>', '<script>' + safe(read('shared.js')) + '</script>')
    (out / f.name).write_text(t, encoding='utf-8')
    pages[f.name] = t
chooser = read('chooser.html').replace('__PAGES__', json.dumps(pages, ensure_ascii=False).replace('</', '<\\/'))
(out / 'index.html').write_text(chooser, encoding='utf-8')
final = read('final.html').replace('__PAGES__', json.dumps(pages, ensure_ascii=False).replace('</', '<\\/'))
(out.parent / 'Online-Scams-PH-Dashboard.html').write_text(final, encoding='utf-8')
print('Built', len(pages), 'options + index.html')
