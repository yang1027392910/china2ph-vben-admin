import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';
const han = /\p{Script=Han}/u;
const entries = [];
const byText = new Map();
const plans = [];
function register(text, file) {
  if (!byText.has(text)) {
    const entry = { id: entries.length, text, files: [] };
    entries.push(entry); byText.set(text, entry);
  }
  const entry = byText.get(text);
  if (!entry.files.includes(file)) entry.files.push(file);
  return entry.id;
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
for (const file of walk('src').filter(f => /\.(ts|vue)$/.test(f))) {
  const source = fs.readFileSync(file, 'utf8');
  const edits = [];
  function add(start, end, text, args = [], kind = 'expression') {
    edits.push({ start, end, id: register(text, file), args, kind });
  }
  function script(code, offset = 0, template = false) {
    const tree = ts.createSourceFile(file + '.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    function visit(n) {
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && han.test(n.text)) {
        if ((ts.isPropertyAssignment(n.parent) || ts.isPropertySignature(n.parent)) && n.parent.name === n) return;
        add(offset + n.getStart(tree), offset + n.end, n.text);
        return;
      }
      if (ts.isTemplateExpression(n) && han.test(n.getText(tree))) {
        let text = n.head.text;
        const args = [];
        for (const span of n.templateSpans) {
          args.push(span.expression.getText(tree));
          text += `{value${args.length}}` + span.literal.text;
        }
        add(offset + n.getStart(tree), offset + n.end, text, args);
        return;
      }
      ts.forEachChild(n, visit);
    }
    visit(tree);
  }
  if (file.endsWith('.vue')) {
    const { descriptor } = parse(source);
    for (const block of [descriptor.script, descriptor.scriptSetup]) if (block) script(block.content, block.loc.start.offset);
    function template(n) {
      if (n.type === 1) {
        for (const p of n.props) {
          if (p.type === 6 && p.value && han.test(p.value.content)) {
            add(p.loc.start.offset, p.loc.end.offset, p.value.content, [], `attribute:${p.name}`);
          } else if (p.type === 7 && p.exp && han.test(p.exp.content)) {
            script(p.exp.content, p.exp.loc.start.offset, true);
          }
        }
      }
      if (!n.children) return;
      for (let i = 0; i < n.children.length;) {
        const child = n.children[i];
        if (child.type === 2 || child.type === 5) {
          const run = []; let j = i;
          while (j < n.children.length && [2,5].includes(n.children[j].type)) run.push(n.children[j++]);
          if (run.some(c => c.type === 2 && han.test(c.content))) {
            const args = []; let text = '';
            for (const c of run) {
              if (c.type === 2) text += c.content;
              else { args.push(c.content.content); text += `{value${args.length}}`; }
            }
            text = text.replace(/\s+/g, ' ').trim();
            add(run[0].loc.start.offset, run.at(-1).loc.end.offset, text, args, 'text');
          } else for (const c of run) if(c.type === 5) script(c.content.content, c.content.loc.start.offset, true);
          i = j;
        } else { template(child); i++; }
      }
    }
    if (descriptor.template?.ast) template(descriptor.template.ast);
  } else script(source);
  if (edits.length) plans.push({ file, edits });
}
fs.mkdirSync('.i18n-work', {recursive:true});
fs.writeFileSync('.i18n-work/entries.json', JSON.stringify(entries, null, 2));
fs.writeFileSync('.i18n-work/plans.json', JSON.stringify(plans, null, 2));
console.log(JSON.stringify({files:plans.length, strings: entries.length, occurrences: plans.reduce((n,p)=>n+p.edits.length,0)}));
for (const e of entries) console.log(`${e.id}\t${e.text}`);
