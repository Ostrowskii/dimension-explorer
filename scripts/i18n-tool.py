"""Ferramenta de tradução da Splat Gallery.
  python3 scripts/i18n-tool.py extract  → lista as frases em português ainda sem data-en (scripts/i18n-missing.json)
  python3 scripts/i18n-tool.py apply    → insere data-en="…" a partir de scripts/i18n-en.json (chave: HTML interno em português)
Só escreve atributos; o resto do HTML fica intacto."""
import json, re, sys, html
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['index.html', 'gengar.html', 'pikachu-de-verdade.html', 'como-fazer.html'] + \
        [f'{d}/index.html' for d in ['dist', 'next-scene', 'third-scene', 'fourth-scene', 'picachu', 'pikachu', 'pikachu-de-verdade', 'modelo']]
BLOCK = {'title', 'h1', 'h2', 'h3', 'p', 'li', 'figcaption', 'dt', 'dd', 'th', 'td', 'button', 'summary', 'a', 'span', 'strong'}
INLINE = {'a', 'strong', 'b', 'em', 'code', 'kbd', 'small', 'span', 'br'}
ATTRS = ['alt', 'aria-label']

def norm(s):
    return re.sub(r'\s+', ' ', s).strip()

def line_offsets(text):
    offs, n = [0], 0
    for line in text.splitlines(keepends=True):
        n += len(line); offs.append(n)
    return offs

def candidates(text):
    soup = BeautifulSoup(text, 'html.parser')
    out = []
    for el in soup.find_all(True):
        if el.find_parent(['pre', 'script', 'style']) or el.name in ('pre', 'script', 'style'):
            continue
        # atributos traduzíveis (alt, aria-label)
        for attr in ATTRS:
            if el.has_attr(attr) and re.search('[A-Za-zÀ-ú]', el[attr]):
                out.append(('attr', attr, el, el[attr]))
        if el.name not in BLOCK:
            continue
        if not el.get_text(strip=True) or not re.search('[A-Za-zÀ-ú]', el.get_text()):
            continue
        if any(c.name and c.name not in INLINE for c in el.children):
            continue
        # só o elemento mais externo que é "frase"
        parent = el.parent
        if parent is not None and parent.name in BLOCK and not any(c.name and c.name not in INLINE for c in parent.children) and parent.get_text(strip=True):
            continue
        out.append(('text', None, el, norm(el.decode_contents())))
    return out

def extract():
    missing = {}
    for page in PAGES:
        text = (ROOT / page).read_text()
        for kind, attr, el, value in candidates(text):
            key = f'@{attr}:{value}' if kind == 'attr' else value
            done = el.has_attr(f'data-en-{attr}') if kind == 'attr' else el.has_attr('data-en')
            if not done:
                missing.setdefault(key, []).append(page)
    (ROOT / 'scripts/i18n-missing.json').write_text(json.dumps({k: '' for k in missing}, ensure_ascii=False, indent=1))
    print(len(missing), 'frases sem tradução → scripts/i18n-missing.json')

def apply():
    en = json.loads((ROOT / 'scripts/i18n-en.json').read_text())
    total = 0
    for page in PAGES:
        path = ROOT / page
        text = path.read_text()
        offs = line_offsets(text)
        inserts = []
        for kind, attr, el, value in candidates(text):
            key = f'@{attr}:{value}' if kind == 'attr' else value
            name = f'data-en-{attr}' if kind == 'attr' else 'data-en'
            if key not in en or not en[key] or el.has_attr(name) or en[key] == value:
                continue
            pos = offs[el.sourceline - 1] + el.sourcepos + 1 + len(el.name)
            inserts.append((pos, f' {name}="{html.escape(en[key], quote=True)}"'))
        for pos, s in sorted(inserts, reverse=True):
            text = text[:pos] + s + text[pos:]
        path.write_text(text)
        total += len(inserts)
        print(f'{page}: {len(inserts)}')
    print('total', total)

if __name__ == '__main__':
    {'extract': extract, 'apply': apply}[sys.argv[1]]()
