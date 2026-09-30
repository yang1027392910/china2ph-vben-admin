import fs from 'node:fs';
import ts from 'typescript';
import {parse} from 'vue/compiler-sfc';
const plans=JSON.parse(fs.readFileSync('.i18n-work/plans.json','utf8'));
for(const plan of plans){
 const src=fs.readFileSync(plan.file,'utf8');
 const d=plan.file.endsWith('.vue')?parse(src).descriptor:null;
 const block=d?.scriptSetup??d?.script;
 const offset=block?.loc.start.offset??0;
 const code=block?.content??src;
 const tree=ts.createSourceFile('file.ts',code,ts.ScriptTarget.Latest,true);
 for(const stmt of tree.statements){
  if(!ts.isVariableStatement(stmt))continue;
  for(const decl of stmt.declarationList.declarations){
   const init=decl.initializer;if(!init)continue;
   if(plan.edits.some(e=>e.start>=offset+init.getStart(tree)&&e.end<=offset+init.end))console.log(plan.file,decl.name.getText(tree),init.getText(tree).slice(0,65).replace(/\s+/g,' '));
  }
 }
}
