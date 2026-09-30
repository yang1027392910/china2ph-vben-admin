import fs from 'node:fs';
import ts from 'typescript';
import {parse} from 'vue/compiler-sfc';
const plans=JSON.parse(fs.readFileSync('.i18n-work/plans.json','utf8'));
for(const {file} of plans.filter(p=>p.file.endsWith('.vue'))){
 let source=fs.readFileSync(file,'utf8');const d=parse(source).descriptor;const block=d.scriptSetup??d.script;if(!block)continue;
 const code=block.content;const offset=block.loc.start.offset;
 const fileName='/virtual.ts';const tree=ts.createSourceFile(fileName,code,ts.ScriptTarget.Latest,true);
 const host=ts.createCompilerHost({noLib:true});host.getSourceFile=(name)=>name===fileName?tree:undefined;host.fileExists=name=>name===fileName;host.readFile=()=>code;
 const program=ts.createProgram([fileName],{noLib:true},host);const checker=program.getTypeChecker();
 const edits=[];const symbols=new Set();let needsComputed=false;
 function add(a,b,text){edits.push({a:offset+a,b:offset+b,text});}
 function literal(n){while(ts.isAsExpression(n)||ts.isParenthesizedExpression(n))n=n.expression;return ts.isArrayLiteralExpression(n)||ts.isObjectLiteralExpression(n);}
 function getters(n){
  if(ts.isPropertyAssignment(n)&&n.initializer.getText(tree).startsWith('$t(')){
    add(n.getStart(tree),n.end,`get ${n.name.getText(tree)}() { return ${n.initializer.getText(tree)}; }`);return;
  }
  ts.forEachChild(n,getters);
 }
 for(const stmt of tree.statements){
  if(!ts.isVariableStatement(stmt))continue;
  for(const decl of stmt.declarationList.declarations){
   const init=decl.initializer;if(!init||!init.getText(tree).includes("$t('app."))continue;
   if(literal(init)&&decl.name.getText(tree)!=='defaultForm'){
    const type=decl.type?`<${decl.type.getText(tree)}>`:'';
    add(decl.name.end,init.getStart(tree),` = computed${type}(() => (`);
    add(init.end,init.end,'))');
    symbols.add(checker.getSymbolAtLocation(decl.name));needsComputed=true;
   }else if(ts.isCallExpression(init)&&init.expression.getText(tree)==='ref'){
    if(decl.name.getText(tree)==='tabs'){
      add(init.expression.getStart(tree),init.expression.end,'computed');
      add(init.arguments[0].getStart(tree),init.arguments[0].getStart(tree),'() => ');needsComputed=true;
    }else getters(init);
   }else if(decl.name.getText(tree)==='defaultForm')getters(init);
  }
 }
 function visit(n){
  if(ts.isIdentifier(n)&&symbols.has(checker.getSymbolAtLocation(n))){
   if(ts.isVariableDeclaration(n.parent)&&n.parent.name===n)return;
   if(ts.isShorthandPropertyAssignment(n.parent)){add(n.getStart(tree),n.end,`${n.text}: ${n.text}.value`);return;}
   add(n.end,n.end,'.value');
  }
  ts.forEachChild(n,visit);
 }
 visit(tree);
 if(needsComputed&&!/import\s*\{[^}]*\bcomputed\b[^}]*\}\s*from\s*['"]vue['"]/.test(code)){
  const vueImport=tree.statements.find(n=>ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='vue'&&n.importClause?.namedBindings&&ts.isNamedImports(n.importClause.namedBindings));
  if(vueImport)add(vueImport.importClause.namedBindings.getStart(tree)+1,vueImport.importClause.namedBindings.getStart(tree)+1,' computed,');
  else add(0,0,"\nimport { computed } from 'vue';\n");
 }
 for(const e of edits.sort((a,b)=>b.a-a.a||b.b-a.b))source=source.slice(0,e.a)+e.text+source.slice(e.b);
 fs.writeFileSync(file,source);
 console.log(file, 'reactive collections:',symbols.size);
}
