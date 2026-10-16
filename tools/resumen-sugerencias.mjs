// Ocho Capitales: convierte las sugerencias de la semana (s.json, de /api/sugerencias) en el cuerpo de la incidencia de GitHub.
// El texto viene del público: se neutralizan @menciones, #referencias, HTML y marcas de markdown antes de publicarlo.
// Uso: node tools/resumen-sugerencias.mjs s.json cuerpo.md
import fs from 'node:fs';

const [entrada = 's.json', salida = 'cuerpo.md'] = process.argv.slice(2);
const s = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const ZW = '​';
export const limpia = (v) => String(v || '')
  .replace(/[\r\n]+/g, ' ')
  .replace(/[<>]/g, '')
  .replace(/@/g, '@' + ZW)
  .replace(/#(\d)/g, '#' + ZW + '$1')
  .replace(/[[\]`*_|]/g, (c) => '\\' + c)
  .replace(/(https?):\/\//gi, '$1:' + ZW + '//')
  .slice(0, 600);
const lineas = s.sugerencias.map((x) => `- [${String(x.fecha).slice(0, 10)}] ${x.hermandad ? '**' + limpia(x.hermandad) + '** · ' : ''}${limpia(x.texto)}${x.pagina ? ' (página: ' + limpia(x.pagina) + ')' : ''}`);
fs.writeFileSync(salida, `Sugerencias recibidas por erCuñao en los últimos 7 días (${s.total}):\n\n${lineas.join('\n')}\n\nDecidir para cada una: corregir el dato (con su fuente), añadir a pendientes o descartar.\n`);
console.log(`${s.total} sugerencias → ${salida}`);
