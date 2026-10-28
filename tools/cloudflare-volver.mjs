// Ocho Capitales · red de seguridad en Cloudflare Pages: apunta el despliegue que está publicado antes de subir uno nuevo
// y, si la prueba de humo después de subir falla, vuelve a él (rollback: la web vuelve a la versión anterior en segundos).
// Uso (en GitHub Actions, con CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID):
//   node tools/cloudflare-volver.mjs apuntar        → escribe anterior=<id> en GITHUB_OUTPUT (vacío si no hay ninguno)
//   node tools/cloudflare-volver.mjs volver <id>    → publica de nuevo ese despliegue
import fs from 'node:fs';

const E = process.env, PROYECTO = E.PROYECTO || 'ocho-capitales';
const API = `https://api.cloudflare.com/client/v4/accounts/${E.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROYECTO}`;
const pide = async (ruta, metodo = 'GET') => {
  const r = await fetch(API + ruta, { method: metodo, headers: { Authorization: 'Bearer ' + E.CLOUDFLARE_API_TOKEN } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(`API ${r.status}: ${JSON.stringify(j.errors || j).slice(0, 200)}`);
  return j.result;
};
const [modo, id] = process.argv.slice(2);
if (modo === 'apuntar') {
  let anterior = '';
  try {
    const lista = await pide('/deployments?env=production&per_page=10');
    const ok = (lista || []).find((d) => d.environment === 'production' && d.latest_stage && d.latest_stage.status === 'success');
    anterior = ok ? ok.id : '';
  } catch (e) { console.log('::warning::No se pudo apuntar el despliegue anterior: ' + e.message); }
  console.log(anterior ? `Despliegue publicado ahora: ${anterior}` : 'No hay despliegue anterior (primera publicación)');
  if (E.GITHUB_OUTPUT) fs.appendFileSync(E.GITHUB_OUTPUT, `anterior=${anterior}\n`);
} else if (modo === 'volver') {
  if (!id) { console.log('::error::No hay despliegue anterior al que volver (primera publicación): revisa la web a mano'); process.exit(1); }
  await pide(`/deployments/${id}/rollback`, 'POST');
  console.log(`::warning::La prueba de humo falló después de publicar: Cloudflare ha vuelto al despliegue anterior (${id})`);
} else { console.log('Uso: node tools/cloudflare-volver.mjs apuntar | volver <id>'); process.exit(2); }
