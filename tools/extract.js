const fs=require('fs');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
const CITIES=[];
const re=/<script>([\s\S]*?)<\/script>/g;let m;
while((m=re.exec(html))){ if(m[1].includes('CITIES.push')) { new Function('CITIES',m[1])(CITIES);} }
fs.writeFileSync('../data-raw.json',JSON.stringify(CITIES,null,1));
for(const c of CITIES){let h=0;for(const d of c.dias)h+=d.hs.length;console.log(c.id,c.dias.length,'dias',h,'hermandades')}
