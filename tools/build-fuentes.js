const fs=require('fs'),path=require('path');
const gn=(q)=>'https://news.google.com/rss/search?q='+encodeURIComponent(q+' when:14d')+'&hl=es&gl=ES&ceid=ES:es';
const C={sevilla:'Sevilla',malaga:'Málaga',granada:'Granada',cordoba:'Córdoba',cadiz:'Cádiz',huelva:'Huelva',almeria:'Almería',jaen:'Jaén'};
const f=[];
for(const [id,n] of Object.entries(C)){
  f.push({nombre:`Google Noticias · Semana Santa ${n}`,url:gn(`"Semana Santa" ${n} (hermandad OR cofradía OR cofradías)`),tipo:'agregador',filtro:false,ciudad:id});
  f.push({nombre:`Google Noticias · Bandas y música cofrade ${n}`,url:gn(`${n} ("banda de cornetas" OR "agrupación musical" OR "banda de música") cofrade`),tipo:'agregador',filtro:false,ciudad:id});
}
f.push({nombre:'Google Noticias · Pregones y carteles de Semana Santa en Andalucía',url:gn('Andalucía "Semana Santa" (pregonero OR cartel OR pregón)'),tipo:'agregador',filtro:false,ciudad:''});
f.push({nombre:'Google Noticias · Marchas procesionales y estrenos',url:gn('"marcha procesional" (estreno OR dedicada) Andalucía'),tipo:'agregador',filtro:false,ciudad:''});
f.push({nombre:'Google Noticias · Cofradías de Andalucía',url:gn('cofradías Andalucía hermandad noticias'),tipo:'agregador',filtro:false,ciudad:''});
f.push({nombre:'Google Noticias · Bandas de cornetas y tambores',url:gn('"banda de cornetas y tambores" OR "agrupación musical" Semana Santa'),tipo:'agregador',filtro:false,ciudad:''});
const prensa=[['Diario de Sevilla','https://www.diariodesevilla.es/rss/','sevilla'],['Málaga Hoy','https://www.malagahoy.es/rss/','malaga'],['Granada Hoy','https://www.granadahoy.com/rss/','granada'],['Huelva Información','https://www.huelvainformacion.es/rss/','huelva'],['Diario de Cádiz','https://www.diariodecadiz.es/rss/','cadiz'],['El Día de Córdoba','https://www.eldiadecordoba.es/rss/','cordoba'],['Diario de Almería','https://www.diariodealmeria.es/rss/','almeria'],['Europa Sur','https://www.europasur.es/rss/',''],['Diario de Jerez','https://www.diariodejerez.es/rss/',''],['Diario SUR','https://www.diariosur.es/rss/2.0/portada','malaga'],['Ideal','https://www.ideal.es/rss/2.0/portada','']];
for(const [n,u,c] of prensa) f.push({nombre:n+' (portada, filtrada por temática cofrade)',url:u,tipo:'prensa',filtro:true,ciudad:c});
f.push({nombre:'Agrupación de Cofradías de Semana Santa de Málaga',url:'https://agrupaciondecofradias.com/feed/',tipo:'oficial',filtro:false,ciudad:'malaga'});
f.push({nombre:'Agrupación de Hermandades y Cofradías de Almería',url:'https://www.cofradiasdealmeria.es/feed/',tipo:'oficial',filtro:false,ciudad:'almeria'});
f.push({nombre:'Archidiócesis de Sevilla',url:'https://www.archisevilla.org/feed/',tipo:'oficial',filtro:true,ciudad:'sevilla'});
f.push({nombre:'Diócesis de Huelva',url:'https://www.diocesisdehuelva.es/feed/',tipo:'oficial',filtro:true,ciudad:'huelva'});
f.push({nombre:'Diócesis de Jaén',url:'https://www.diocesisdejaen.es/feed/',tipo:'oficial',filtro:true,ciudad:'jaen'});
f.forEach(x=>x.legacy=true); // las 36 originales
f.push({nombre:'Real Federación de Hermandades y Cofradías de Granada',url:'https://hermandadesdegranada.com/feed/',tipo:'oficial',filtro:false,ciudad:'granada'});
for(const x of JSON.parse(fs.readFileSync(path.join(__dirname,'sources','cordoba-feeds.json'),'utf8'))) f.push({nombre:x.nombre,url:x.url,tipo:'oficial',filtro:false,ciudad:'cordoba'});
fs.writeFileSync(path.join(__dirname,'..','portal-cofrade','data','fuentes.json'),JSON.stringify(f,null,1));
console.log(f.length,'fuentes');
