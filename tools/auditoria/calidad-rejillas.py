# Ocho Capitales · auditoría: mide la calidad de una lectura de rejillas (<ciudad>-2026.json) contra su PDF, sin depender
# del lector: horas entre paréntesis capturadas frente a las que hay en el PDF, celdas con dos calles pegadas y calles
# cortadas (acaban en «de», «del», «Pl.»…).
# Uso: uvx --from pdfplumber python tools/auditoria/calidad-rejillas.py <pdf> <json>
import sys, re, json, pdfplumber

pdf, js = sys.argv[1], sys.argv[2]
J = json.load(open(js, encoding='utf-8'))
horas_pdf = 0
with pdfplumber.open(pdf) as P:
    for pg in P.pages:
        t = pg.extract_text() or ''
        if re.search(r'\b\d{1,2}[:.]\d{2}\b', t) and len(re.findall(r'^\s*\d{1,2}[:.]\d{2}', t, re.M)) >= 4:
            horas_pdf += len(re.findall(r'\(\s*\d{1,2}[:.]\d{2}\s*\)', t))
pts = [p for c in J['columnas'] for p in c['puntos']]
horas = sum(1 for p in pts if p.get('hora'))
corta = re.compile(r'(\b(de|del|la|el|los|las|san|santa|y|pl\.|plaza|avda\.|calle|puerta|j|p\.)|\s[A-ZÁÉÍÓÚ]\.?)\s*$', re.I)
cortadas = sum(1 for p in pts if corta.search(p['lugar'].strip()))
largas = sum(1 for p in pts if len(p['lugar'].split()) >= 4 and not p['lugar'].isupper())
print(f"{js.split('/')[-1]}: columnas {len(J['columnas'])} · puntos {len(pts)} · horas (…) {horas} de {horas_pdf} en el PDF · calles cortadas {cortadas} · lugares de 4+ palabras {largas}")
