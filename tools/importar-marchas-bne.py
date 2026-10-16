# Ocho Capitales: partituras de marchas procesionales en la Biblioteca Nacional de España (datos.bne.es), tema
# «Marchas (Banda)--Partituras» (https://datos.bne.es/tema/XX791043.html), el segundo enlace que dio Pablo.
# El tema mezcla marchas procesionales con militares, de concierto y de moros y cristianos: solo se guardan las
# procesionales (filtro por título). De cada una: título, año, tipo de documento y enlace al registro de la BNE.
# La BNE rechaza las peticiones sin huella de navegador, por eso se usa curl_cffi (imita a Chrome).
# Salida: tools/sources/marchas-bne.json
# Uso: uvx --with curl_cffi python tools/importar-marchas-bne.py
import html, json, re, sys
from datetime import date
from pathlib import Path
from curl_cffi import requests

URL = 'https://datos.bne.es/tema/XX791043.html'
OUT = Path(__file__).parent / 'sources' / 'marchas-bne.json'
r = requests.get(URL, impersonate='chrome', timeout=60)
if r.status_code != 200:
    sys.exit(f'BNE {r.status_code}')
t = r.text
limpio = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
obras = []
partes = re.split(r'(?=<a href="/resource/[^"]+" class="item-link")', t)
for p in partes[1:]:
    m = re.match(r'<a href="(/resource/[^"]+)" class="item-link">([\s\S]*?)</a>([\s\S]{0,600})', p)
    if not m:
        continue
    resto = limpio(m.group(3))
    anio = re.search(r'\b(1[89]\d\d|20\d\d)\b', resto)
    tipo = 'Música manuscrita' if re.search(r'manuscrita', resto, re.I) else 'Música impresa' if re.search(r'impresa', resto, re.I) else ''
    obras.append({'titulo': limpio(m.group(2)).rstrip(' .'), 'anio': anio.group(1) if anio else '', 'tipo': tipo, 'url': 'https://datos.bne.es' + m.group(1)})
SI = re.compile(r'procesi|f[uú]nebre|palio|semana santa|semana mayor|jueves santo|cristo|virgen|nuestra se[nñ]ora|nuestro padre|jes[uú]s|mar[ií]a sant|esperanza|soledad|dolor|angustia|amargura|macaren|triana|rosario|exaltaci|expiraci|buena muerte|buen fin|piedad|penas|l[aá]grimas|salud|redentor|nazareno|cautivo|pasi[oó]n|resurrecci|crucifix|sepulcro|medinaceli|cofrad|lignum crucis|dulce nombre|remedios|evangelista|puerta del cielo|roc[ií]o', re.I)
NO = re.compile(r'marcha mora|marxa mora|cristian|moros|militar|pasodoble|p\.\s?d\.|pd\.|nacional|franco|falange|marcia|overture|concert|harmoniemusik|festero|capit|alferes|comparsa|guillena|sevillana partitura|marcha fúnebre sevillana', re.I)
proc = [o for o in obras if SI.search(o['titulo']) and not NO.search(o['titulo'])]
OUT.write_text(json.dumps({'generado': date.today().isoformat(), 'fuente': 'Biblioteca Nacional de España, datos.bne.es: tema «Marchas (Banda)--Partituras»', 'url': URL,
                           'nota': 'Solo marchas procesionales (filtro por título). El enlace lleva al registro bibliográfico de la partitura.', 'marchas': proc}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'BNE: {len(obras)} obras en el tema; {len(proc)} procesionales guardadas')
