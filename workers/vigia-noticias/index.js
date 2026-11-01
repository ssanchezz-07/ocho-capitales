// Ocho Capitales · vigía de las noticias (Cloudflare Worker con Cron Triggers, plan gratuito).
// Pablo: una publicación al día, a las 7:00 de España, sin fallo. Los Cron Triggers son puntuales; los de GitHub, no.
// - 7:00 de Madrid: lanza «Publicar Ocho Capitales» (workflow_dispatch).
// - 7:30: si la publicación del día no está en R2, la lanza otra vez.
// - 8:30: si sigue sin estar, avisa por correo a ochocapitales@gmail.com.
// Va en UTC y por eso tiene los disparos de invierno y de verano; cada uno mira la hora de Madrid y hace lo que le toque.
// Secreto GITHUB_TOKEN: token de GitHub con permiso Actions (Read and write) solo en este repositorio (GUIA-ALOJAMIENTO.md).
// Sin él no lanza nada, pero siguen los avisos programados de GitHub y el correo.
import { EmailMessage } from 'cloudflare:email';

const REPO = 'ssanchezz-07/ocho-capitales', NOTICIAS = 'https://datos.ochocapitales.com/news.json';
const DE = 'avisos@ochocapitales.com', PARA = 'ochocapitales@gmail.com';

const partes = (ms) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(ms).map((p) => [p.type, p.value]));
const dia = (p) => `${p.year}-${p.month}-${p.day}`;

async function publicadaHoy(ahora) {
  const r = await fetch(`${NOTICIAS}?c=${ahora}`);
  if (!r.ok) return { ok: false, detalle: `R2 responde ${r.status}` };
  const act = +(await r.json()).actualizado || 0, a = partes(act);
  return { ok: dia(a) === dia(partes(ahora)) && +a.hour >= 7, detalle: `última publicación: ${new Date(act).toISOString()}` };
}

async function lanzar(env) {
  if (!env.GITHUB_TOKEN) { console.log('Sin GITHUB_TOKEN: quedan los avisos de GitHub'); return 'sin GITHUB_TOKEN'; }
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/publicar.yml/dispatches`, {
    method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { origen: 'vigia' } }),
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ocho-capitales-vigia', 'Content-Type': 'application/json' },
  });
  console.log('Lanzado:', r.status);
  return r.status === 204 ? 'lanzada' : `GitHub respondió ${r.status}`;
}

async function correo(env, asunto, texto) {
  // asunto en ASCII y cuerpo en base64 (acentos y saltos de línea sin problemas)
  const cuerpo = btoa(String.fromCharCode(...new TextEncoder().encode(texto))).match(/.{1,76}/g).join('\r\n');
  const raw = [`From: Ocho Capitales <${DE}>`, `To: ${PARA}`, `Subject: ${asunto}`,
    `Message-ID: <${crypto.randomUUID()}@ochocapitales.com>`, `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', cuerpo, ''].join('\r\n');
  await env.CORREO.send(new EmailMessage(DE, PARA, raw));
}

const aviso = (detalle) => `A las 8:30 no está la publicación de las 7:00.\n${detalle}\n\nLa web sigue con las noticias anteriores. GitHub lo sigue reintentando durante la mañana.\nMira: https://github.com/${REPO}/actions\nReenvía este correo a la sesión de alojamiento.`;

export default {
  async scheduled(evento, env, ctx) {
    const ahora = evento.scheduledTime, p = partes(ahora), hm = `${p.hour}:${p.minute}`;
    if (env.PRUEBA_CORREO === 'si') return correo(env, '[Ocho Capitales] Prueba del vigia de noticias', 'PRUEBA (no hay que hacer nada).\n\n' + aviso('última publicación: de prueba'));
    if (!['07:00', '07:30', '08:30'].includes(hm)) return;
    const lanza = async () => { const r = await lanzar(env); if (r !== 'lanzada' && r !== 'sin GITHUB_TOKEN') await correo(env, '[Ocho Capitales] El vigia no puede lanzar las noticias', `${r}. Puede que el token de GitHub haya caducado (GUIA-ALOJAMIENTO.md).`); };
    if (hm === '07:00') { await lanza(); return; }
    let estado; try { estado = await publicadaHoy(ahora); } catch (e) { estado = { ok: false, detalle: String(e) }; }
    console.log(hm, estado);
    if (estado.ok) return;
    if (hm === '07:30') { await lanza(); return; }
    await correo(env, '[Ocho Capitales] Las noticias de hoy no se han publicado', aviso(estado.detalle));
  },
};
