// Ocho Capitales: decide si el trabajo «cloudflare» de publicar.yml sube la web a Cloudflare Pages (escribe seguir=si|no).
// La web estática solo se vuelve a subir cuando cambia de verdad; las noticias frescas van aparte (R2, cada hora).
// - Sin los secretos de Cloudflare: no.
// - A mano (workflow_dispatch): sí.
// - Push: sí, salvo que solo cambien documentos (.md, EQUIPO/, MARKETING/…), que no salen en la web.
// - Programado: si las noticias van por R2 (NOTICIAS_URL), una vez al día (portada, «Hoy» y agenda al día); si no, cada vez.
// - Tope: si este mes ya van TOPE despliegues (por defecto 450 de los 500 del plan gratuito, por si las subidas directas
//   cuentan), solo el diario. Si la API de Cloudflare no responde, se publica (no se bloquea por no poder contar).
import fs from 'node:fs';

const E = process.env;
const salida = (seguir, motivo) => {
  console.log(`Cloudflare: ${seguir ? 'se publica' : 'no se publica'} (${motivo})`);
  if (E.GITHUB_OUTPUT) fs.appendFileSync(E.GITHUB_OUTPUT, `seguir=${seguir ? 'si' : 'no'}\n`);
  process.exit(0);
};
const DOCS = [/\.(md|txt)$/i, /^EQUIPO\//, /^MARKETING\//, /^auditoria\//, /^graphify-out\//, /^\.claude\//];

async function despliegues() {
  // despliegues de este mes y horas desde el último
  const inicio = new Date(); inicio.setUTCDate(1); inicio.setUTCHours(0, 0, 0, 0);
  let n = 0, ultimo = 0;
  for (let p = 1; p <= 30; p++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${E.CUENTA}/pages/projects/${E.PROYECTO || 'ocho-capitales'}/deployments?per_page=25&page=${p}`, { headers: { Authorization: 'Bearer ' + E.TOKEN } });
    if (!r.ok) throw new Error('API ' + r.status);
    const j = await r.json(); const lista = j.result || [];
    for (const d of lista) { const t = Date.parse(d.created_on); ultimo = Math.max(ultimo, t); if (t >= inicio) n++; }
    if (lista.length < 25 || lista.some((d) => Date.parse(d.created_on) < inicio)) break;
  }
  return { n, horas: ultimo ? (Date.now() - ultimo) / 36e5 : Infinity };
}

async function soloDocumentos() {
  if (!E.ANTES || /^0+$/.test(E.ANTES) || !E.DESPUES) return false;
  try {
    const r = await fetch(`https://api.github.com/repos/${E.REPO}/compare/${E.ANTES}...${E.DESPUES}`, { headers: { Accept: 'application/vnd.github+json', ...(E.GH_TOKEN ? { Authorization: 'Bearer ' + E.GH_TOKEN } : {}) } });
    if (!r.ok) return false;
    const archivos = ((await r.json()).files || []).map((f) => f.filename);
    if (!archivos.length || archivos.length >= 300) return false;
    return archivos.every((f) => DOCS.some((re) => re.test(f)));
  } catch { return false; }
}

if (!E.TOKEN || !E.CUENTA) salida(false, 'faltan los secretos CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID');
if (E.EVENTO === 'workflow_dispatch') salida(true, 'lanzado a mano');
const TOPE = +E.TOPE || 450;
let d = { n: 0, horas: Infinity };
try { d = await despliegues(); console.log(`Este mes: ${d.n} despliegues; el último hace ${d.horas === Infinity ? '—' : d.horas.toFixed(1) + ' h'}`); }
catch (e) { console.log('::warning::No se pudieron contar los despliegues de Cloudflare: ' + e.message); }
const diario = d.horas >= 20;
if (E.EVENTO === 'schedule') {
  if (E.NOTICIAS_URL) salida(diario, diario ? 'el de cada día' : 'las noticias van por R2; la web ya se publicó hoy');
  salida(d.n < TOPE || diario, d.n < TOPE ? 'programado' : `tope de ${TOPE} al mes`);
}
if (await soloDocumentos()) salida(false, 'solo cambian documentos que no salen en la web');
if (d.n >= TOPE && !diario) { console.log(`::warning::Cloudflare: ${d.n} despliegues este mes (tope ${TOPE}); este cambio saldrá con el despliegue diario`); salida(false, 'tope del mes'); }
salida(true, 'cambio en la web');
