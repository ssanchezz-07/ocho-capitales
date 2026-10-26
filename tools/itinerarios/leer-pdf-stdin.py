import sys, io, pdfplumber
sys.stdout.reconfigure(encoding='utf-8')
data = sys.stdin.buffer.read()
with pdfplumber.open(io.BytesIO(data)) as P:
    print('PAGINAS', len(P.pages))
    for n, pg in enumerate(P.pages):
        t = pg.extract_text() or ''
        print(f'===== PAG {n+1}'); print(t)
