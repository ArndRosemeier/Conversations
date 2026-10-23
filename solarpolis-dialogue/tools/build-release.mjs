import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const pkg=JSON.parse(await readFile('package.json','utf8'));
const out='.release',stage=`${out}/package`;
await mkdir(`${stage}/dist/languages/en`,{recursive:true});await mkdir(`${stage}/dist/canon`,{recursive:true});
for(const entry of ['index','languages/en/index','canon/solarpolis','languages/en/solarpolis-canon']){
  await build({entryPoints:[`dist/${entry}.mjs`],outfile:`${stage}/dist/${entry}.mjs`,bundle:true,format:'esm',platform:'neutral',target:'es2022',minify:false,legalComments:'inline'});
  await copyFile(`dist/${entry}.d.ts`,`${stage}/dist/${entry}.d.ts`);
}
await mkdir(`${stage}/notices`,{recursive:true});
for(const file of ['GF-LICENSE.txt','RGL-LICENSE.txt','APP-LICENSE.txt'])await copyFile(`dist/languages/en/gf/${file}`,`${stage}/notices/${file}`);
const entry=(path)=>({types:`./dist/${path}.d.ts`,import:`./dist/${path}.mjs`});
await writeFile(`${stage}/package.json`,JSON.stringify({
  name:pkg.name,version:pkg.version,type:'module',description:'Deterministic, language-modular NPC conversations for games',
  main:'./dist/index.mjs',types:'./dist/index.d.ts',sideEffects:false,
  exports:{'.':entry('index'),'./english':entry('languages/en/index'),'./canon/solarpolis':entry('canon/solarpolis'),'./english/solarpolis':entry('languages/en/solarpolis-canon')},
  files:['dist','notices','README.md','language-module-contract.md','setting-package-contract.md'],
  repository:{type:'git',url:'https://github.com/ArndRosemeier/Conversations.git',directory:'solarpolis-dialogue'},
  engines:{node:'>=18'}
},null,2)+'\n');
await copyFile('../docs/party-conversations.md',`${stage}/README.md`);
for(const name of ['language-module-contract','setting-package-contract'])await copyFile(`../docs/${name}.md`,`${stage}/${name}.md`);
await copyFile('dist/languages/en/data/lexical-pack.mjs',`${out}/english-lexical-pack.mjs`);
await copyFile('dist/languages/en/data/source-manifest.json',`${out}/language-source-manifest.json`);
const notices=await readdir('dist/languages/en/vendor-notices');
await writeFile(`${out}/lexical-NOTICES.txt`,(await Promise.all(notices.sort().map(async f=>`${f}\n\n${await readFile(`dist/languages/en/vendor-notices/${f}`,'utf8')}`))).join('\n\n'));
const npmCLI=process.env.npm_execpath;
if(!npmCLI)throw new Error('Run this build through npm run build:release');
const result=execFileSync(process.execPath,[npmCLI,'pack',resolve(stage),'--pack-destination',resolve(out),'--json','--ignore-scripts'],{encoding:'utf8'});
const [{filename}]=JSON.parse(result);
const assets=[filename,'english-lexical-pack.mjs','language-source-manifest.json','lexical-NOTICES.txt'];
const lines=[];
for(const file of assets){const bytes=await readFile(`${out}/${file}`);lines.push(`${createHash('sha256').update(bytes).digest('hex')}  ${file}`);console.log(`${file}: ${(await stat(`${out}/${file}`)).size} bytes`);}
await writeFile(`${out}/SHA256SUMS.txt`,lines.join('\n')+'\n');
