import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const pkg=JSON.parse(await readFile('package.json','utf8')),cwd=resolve('.release/consumer');
await mkdir(cwd,{recursive:true});
await writeFile(`${cwd}/package.json`,JSON.stringify({private:true,type:'module',dependencies:{[pkg.name]:`file:../${pkg.name}-${pkg.version}.tgz`}}));
// npm's file dependency can otherwise reuse an old same-version archive.
// A versioned install prefix is not needed: force re-extraction of this one package.
execFileSync(process.execPath,[process.env.npm_execpath,'install',`../${pkg.name}-${pkg.version}.tgz`,'--ignore-scripts','--offline','--force'],{cwd,stdio:'pipe'});
let types=await readFile('tests/types/consumer.mts','utf8');
for(const [from,to] of [
  ['../../.release/package/dist/index.js','solarpolis-dialogue'],
  ['../../.release/package/dist/languages/en/index.js','solarpolis-dialogue/english'],
  ['../../.release/package/dist/canon/solarpolis.js','solarpolis-dialogue/canon/solarpolis'],
  ['../../.release/package/dist/languages/en/solarpolis-canon.js','solarpolis-dialogue/english/solarpolis']
])types=types.replaceAll(from,to);
await writeFile(`${cwd}/consumer.mts`,types);
execFileSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--lib','ES2022','consumer.mts'],{cwd,stdio:'inherit'});
await writeFile(`${cwd}/smoke.mjs`,`
import assert from 'node:assert/strict';
import {createConversationWorld} from 'solarpolis-dialogue';
import {englishModule,createEnglishResources} from 'solarpolis-dialogue/english';
import {createSolarpolisCanon} from 'solarpolis-dialogue/canon/solarpolis';
import {solarpolisEnglish} from 'solarpolis-dialogue/english/solarpolis';
import lexicalPack from '../english-lexical-pack.mjs';
Math.random=()=>{throw Error('random forbidden')};globalThis.Date=class {constructor(){throw Error('clock forbidden')}};
const world=createConversationWorld({profiles:[{id:'a',pursuits:['music']},{id:'b',temperament:'dry'},{id:'c'}]});
const session=world.createSession({participants:['a','b','c'],languageModule:englishModule,resources:createEnglishResources({entities:{a:'A',b:'B',c:'C'}}),languageOptions:{lexicalPack}});
const chat=session.conversation({seed:'installed',day:1,maxTurns:24});let count=0,turn;while((turn=chat.next())){count++;assert.ok(turn.pieces.every(p=>Array.from(p).length<=90));}assert.equal(count,24);
assert.equal(createSolarpolisCanon().facts.length,180);assert.ok(solarpolisEnglish.entities.selenipolis);
console.log('Installed archive: runtime, all exports, optional lexical pack and declarations passed.');
`);
execFileSync(process.execPath,['smoke.mjs'],{cwd,stdio:'inherit'});
const packageDir=`${cwd}/node_modules/${pkg.name}`;
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat();}
const files=await walk(packageDir);assert.ok(!files.some(f=>f.includes('lexical-pack')));
const core=await readFile(`${packageDir}/dist/index.mjs`,'utf8');assert.ok(!core.includes('Hello there'));assert.ok(!core.includes('orchard keeping'));
console.log(`Archive isolation passed: ${files.length} files, lexical data remains external.`);
