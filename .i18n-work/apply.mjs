import fs from 'node:fs';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';
const entries=JSON.parse(fs.readFileSync('.i18n-work/entries.json','utf8'));
const plans=JSON.parse(fs.readFileSync('.i18n-work/plans.json','utf8'));
const translations = new Map(fs.readFileSync('.i18n-work/en.tsv','utf8').trim().split(/\r?\n/).map(line=>{const i=line.indexOf('\t');return [Number(line.slice(0,i).trim()),line.slice(i+1)];}));
const zh={},en={},keys={};
for(const entry of entries){
 const english=translations.get(entry.id);if(!english)throw Error('Missing '+entry.id);
 const words=english.replace(/<[^>]+>/g,'').replace(/\{value\d+\}/g,'value').match(/[a-zA-Z0-9]+/g);
 let key=words.slice(0,10).map((word,i)=>i?word[0].toUpperCase()+word.slice(1).toLowerCase():word.toLowerCase()).join('');
 if(/^\d/.test(key))key='text'+key;
 let unique=key;let n=2;while(unique in zh)unique=key+n++;
 keys[entry.id]='app.'+unique;zh[unique]=entry.text;en[unique]=english;
}
for (const plan of plans){
 let source=fs.readFileSync(plan.file,'utf8');
 fs.mkdirSync('.i18n-work/backups',{recursive:true});
 fs.writeFileSync('.i18n-work/backups/'+plan.file.replaceAll('\\','__'),source);
 const edits=[];
 for(const edit of plan.edits){
  if(plan.file.includes('logistics-supplier') && /(?:value|shippingMethod):\s*$/.test(source.slice(Math.max(0,edit.start-30),edit.start)))continue;
  const key=keys[edit.id];
  const args=edit.args.length?', { '+edit.args.map((arg,i)=>`value${i+1}: ${arg}`).join(', ')+' }':'';
  let result=`$t('${key}'${args})`;
  if(plan.file.includes('router\\routes')) result=`'${key}'`;
  if(edit.kind==='text')result=`{{ ${result} }}`;
  if(edit.kind.startsWith('attribute:')) result=`:${edit.kind.split(':')[1]}="${result.replaceAll('"','&quot;')}"`;
  edits.push({...edit,result});
 }
 for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.result+source.slice(e.end);
 if(!plan.file.includes('router\\routes') && !/import\s*\{[^}]*\$t[^}]*\}\s*from\s*['"](?:#\/locales|@vben\/locales)['"]/.test(source)){
  if(plan.file.endsWith('.vue'))source=source.replace(/(<script[^>]*>)/,`$1\nimport { $t } from '#/locales';`);
  else source=`import { $t } from '#/locales';\n`+source;
 }
 fs.writeFileSync(plan.file,source);
}
fs.writeFileSync('src/locales/langs/zh-CN/app.json',JSON.stringify(zh,null,2)+'\n');
fs.writeFileSync('src/locales/langs/en-US/app.json',JSON.stringify(en,null,2)+'\n');
fs.writeFileSync('.i18n-work/keys.json',JSON.stringify(keys,null,2));
console.log('Applied translations to',plans.length,'files');
