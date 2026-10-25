# Ocho Capitales: partituras de marchas procesionales en la Biblioteca Nacional de España (datos.bne.es, datos abiertos).
# Dos temas: «Marchas procesionales» (https://datos.bne.es/tema/XX536674.html, unas 1.600 partituras: se guardan todas) y
# «Marchas (Banda)--Partituras» (https://datos.bne.es/tema/XX791043.html, el enlace que dio Pablo: mezcla militares, de
# concierto y de moros y cristianos, así que de este solo se guardan las procesionales, por el título).
# De cada registro se lee su ficha: compositor, título completo, fecha, editorial, tipo (impresa o manuscrita) y notas
# (a veces la dedicatoria). La BNE rechaza las peticiones sin huella de navegador, por eso se usa curl_cffi (imita a Chrome).
# Reanudable: no vuelve a leer las fichas ya leídas. Ritmo lento (PAUSA segundos entre fichas).
# Salida: tools/sources/marchas-bne.json
# Uso: uvx --with curl_cffi python -I tools/importar-marchas-bne.py
import html, json, os, re, sys, time
from datetime import date
from pathlib import Path
from curl_cffi import requests

OUT = Path(__file__).parent / 'sources' / 'marchas-bne.json'
TEMAS = [('https://datos.bne.es/tema/XX536674.html', 'Marchas procesionales', True),
         ('https://datos.bne.es/tema/XX791043.html', 'Marchas (Banda)--Partituras', False)]
PAUSA = float(os.environ.get('PAUSA', '1.2'))
limpio = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
get = lambda u: requests.get(u, impersonate='chrome', timeout=90)

SI = re.compile(r'procesi|f[uú]nebre|palio|semana santa|semana mayor|jueves santo|cristo|virgen|nuestra se[nñ]ora|nuestro padre|jes[uú]s|mar[ií]a sant|esperanza|soledad|dolor|angustia|amargura|macaren|triana|rosario|exaltaci|expiraci|buena muerte|buen fin|piedad|penas|l[aá]grimas|salud|redentor|nazareno|cautivo|pasi[oó]n|resurrecci|crucifix|sepulcro|medinaceli|cofrad|lignum crucis|dulce nombre|remedios|evangelista|puerta del cielo|roc[ií]o', re.I)
NO = re.compile(r'marcha mora|marxa mora|cristian|moros|militar|pasodoble|p\.\s?d\.|pd\.|nacional|franco|falange|marcia|overture|concert|harmoniemusik|festero|capit|alferes|comparsa|guillena|sevillana partitura|marcha fúnebre sevillana', re.I)

def listado(url):
    t = get(url).content.decode('utf-8', 'replace')
    out = []
    for p in re.split(r'(?=<a href="/resource/[^"]+" class="item-link")', t)[1:]:
        m = re.match(r'<a href="(/resource/[^"]+)" class="item-link">([\s\S]*?)</a>([\s\S]{0,600})', p)
        if not m: continue
        resto = limpio(m.group(3))
        anio = re.search(r'\b(1[6-9]\d\d|20\d\d)\b', resto)
        tipo = 'Música manuscrita' if re.search(r'manuscrita', resto, re.I) else 'Música impresa' if re.search(r'impresa', resto, re.I) else ''
        out.append({'titulo': limpio(m.group(2)).rstrip(' .'), 'anio': anio.group(1) if anio else '', 'tipo': tipo, 'url': 'https://datos.bne.es' + m.group(1)})
    return out

def ficha(url):
    t = get(url).content.decode('utf-8', 'replace')
    filas = {}
    for lab, val in re.findall(r'<td class="label-row"><strong>([^<]+)</strong></td>\s*<td>([\s\S]*?)</td>', t):
        filas.setdefault(limpio(lab), []).append(limpio(val))
    tit = (filas.get('Título') or [''])[0]
    partes = [x.strip(' ;') for x in re.split(r'\s;', tit) if x.strip(' ;')]
    # «Título : subtítulo ; Mención de responsabilidad»
    titulo = partes[0].rstrip(' :') if partes else ''
    resp = ' '.join(partes[1:])
    autor_bne = re.search(r'>([^<>]{3,80}\(\d{4}-(?:\d{4})?\))<', t)
    return {
        'subcampos': partes,  # título, subtítulo y mención de responsabilidad, tal como los separa la BNE
        'titulo_completo': tit.replace(' ;', ''),
        'titulo': titulo,
        'responsabilidad': resp,
        'autor_bne': autor_bne.group(1).strip() if autor_bne else '',
        'fecha': ' '.join(filas.get('Fecha de publicación', [])),
        'lugar_pub': ' '.join(filas.get('Lugar de publicación', [])),
        'editorial': ' '.join(filas.get('Editorial', [])),
        'notas': filas.get('Nota', []),
        'leida': True,
    }

prev = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'marchas': []}
hechas = {m['url']: m for m in prev.get('marchas', []) if m.get('leida') and 'subcampos' in m}
obras, vistos = [], set()
for url, nombre, todas in TEMAS:
    lista = listado(url)
    print(nombre, len(lista), 'registros', flush=True)
    for o in lista:
        if o['url'] in vistos or (not todas and (not SI.search(o['titulo']) or NO.search(o['titulo']))): continue
        vistos.add(o['url']); o['tema'] = nombre
        obras.append({**o, **hechas[o['url']]} if o['url'] in hechas else o)

def guardar():
    OUT.write_text(json.dumps({'generado': date.today().isoformat(), 'fuente': 'Biblioteca Nacional de España, datos.bne.es: temas «Marchas procesionales» y «Marchas (Banda)--Partituras» (datos abiertos)',
                               'url': TEMAS[0][0], 'nota': 'Una fila por registro bibliográfico (partitura impresa o manuscrita). «fecha» es la de la partitura, no siempre la de composición.',
                               'marchas': obras}, ensure_ascii=False, indent=1), encoding='utf-8')

pend = [o for o in obras if not o.get('leida')]
print('por leer', len(pend), 'de', len(obras), flush=True)
fallos = 0
for i, o in enumerate(pend, 1):
    try:
        o.update(ficha(o['url'])); fallos = 0
    except Exception as e:
        fallos += 1; print('fallo', o['url'], e, flush=True)
        if fallos >= 15: print('PARADO: demasiados fallos seguidos; relanzar más tarde', flush=True); break
        time.sleep(20)
    if i % 50 == 0: guardar(); print(i, '/', len(pend), flush=True)
    time.sleep(PAUSA)
guardar()
print(f'BNE: {len(obras)} partituras; leídas {sum(1 for o in obras if o.get("leida"))}', flush=True)
