// 원본과 분리된 화면의 HTML·함수 본문·CSS를 비교합니다. 유료 API는 호출하지 않습니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from '../frontend/node_modules/vite/dist/node/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { parse } = require('@babel/parser');
const original = fs.readFileSync(path.join(root, '.local/refactor-original/App.jsx'), 'utf8');
const src = path.join(root,'frontend/src');
const read = p => fs.readFileSync(p,'utf8');
const beforeAst = parse(original,{sourceType:'module',plugins:['jsx']});
const currentFunctions = new Map();
const visitFiles = folder => fs.readdirSync(folder,{withFileTypes:true}).flatMap(e => e.isDirectory() ? visitFiles(path.join(folder,e.name)) : [path.join(folder,e.name)]);
for (const file of visitFiles(src).filter(p=>/\.(jsx|js)$/.test(p))) {
  const ast = parse(read(file),{sourceType:'module',plugins:['jsx']});
  for (const n of ast.program.body) if (n.type==='FunctionDeclaration') currentFunctions.set(n.id.name,n);
}
const normalize = node => JSON.parse(JSON.stringify(node,(key,value)=>['start','end','loc','extra','leadingComments','trailingComments','innerComments'].includes(key)?undefined:value));
let functionCount=0;
for (const n of beforeAst.program.body.filter(n=>n.type==='FunctionDeclaration')) {
  assert.deepEqual(normalize(n.body),normalize(currentFunctions.get(n.id.name).body),n.id.name);
  functionCount++;
}
for (const name of ['App.css','index.css','fonts.css']) assert.equal(read(path.join(src,'styles',name)),read(path.join(root,'.local/refactor-original',name)),name);
const exported=['Home','TrendPage','ProgramList','Detail','AIReport','DataModal','VideoCarousel'];
const fixture = original.replace("'./programImages'",JSON.stringify(path.join(src,'programImages.js').replaceAll('\\','/'))).replace("import './App.css';",'') + `\nexport { ${exported.join(', ')} };`;
const fixturePath=path.join(root,'frontend/.local/App.baseline.jsx');
fs.mkdirSync(path.dirname(fixturePath),{recursive:true});
fs.writeFileSync(fixturePath,fixture);
const server=await createServer({root:path.join(root,'frontend'),server:{middlewareMode:true},appType:'custom'});
try {
  const react=require('react');
  const {renderToStaticMarkup}=require('react-dom/server');
  const baseline=await server.ssrLoadModule(fixturePath);
  const modules={};
  for (const [file,names] of Object.entries({'pages/Home.jsx':['Home'],'pages/TrendPage.jsx':['TrendPage'],'pages/ProgramList.jsx':['ProgramList'],'pages/ProgramDetail.jsx':['Detail'],'components/Strategy.jsx':['AIReport'],'components/DataModal.jsx':['DataModal'],'components/VideosSection.jsx':['VideoCarousel']})) {
    const m=await server.ssrLoadModule(path.join(src,file));
    for (const n of names) modules[n]=m[n];
  }
  const programs=JSON.parse(read(path.join(root,'backend/data/programs_v1.json'))).programs;
  const videos=JSON.parse(read(path.join(root,'backend/data/videos_v1.json'))).videos;
  const cases=[['Home',{programs,go:()=>{}}],['TrendPage',{programs,go:()=>{}}],['ProgramList',{programs,go:()=>{}}],['AIReport',{report:null}],['DataModal',{open:false,onClose:()=>{},title:'검증'}]];
  cases.push(['DataModal',{open:true,onClose:()=>{},title:'검증',children:'기존 팝업 내용'}]);
  const reportPath=path.join(root,'.local/mock-report.json');
  if (fs.existsSync(reportPath)) cases.push(['AIReport',{report:JSON.parse(read(reportPath))}]);
  for (const p of programs) {
    cases.push(['Detail',{p,go:()=>{}}]);
    cases.push(['VideoCarousel',{videos:videos.filter(v=>v.program_id_candidate===p.program_id)}]);
  }
  // effects는 서버 렌더링에서 실행되지 않으므로 fetch나 AI 생성은 발생하지 않습니다.
  for (const [name,props] of cases) assert.equal(renderToStaticMarkup(react.createElement(baseline[name],props)),renderToStaticMarkup(react.createElement(modules[name],props)),name);
  const result={function_bodies_unchanged:functionCount,css_files_identical:3,server_render_comparisons:cases.length,paid_api_calls:0};
  fs.writeFileSync(path.join(root,'.local/verification-frontend.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
} finally { await server.close(); }


