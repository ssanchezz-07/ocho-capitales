import zipfile, os
root = 'portal-cofrade'
with zipfile.ZipDialog if False else zipfile.ZipFile('portal-cofrade.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for d, _, fs in os.walk(root):
        for f in fs:
            p = os.path.join(d, f)
            z.write(p, p.replace(os.sep, '/'))
print(os.path.getsize('portal-cofrade.zip'))
