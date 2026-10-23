import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLanguage} from '../dist/language-contract.mjs';
import {createSettingSession,validateSetting} from '../dist/setting-package.mjs';
import {englishModule} from '../dist/languages/en/index.mjs';
import {setting} from '../dist/settings/willowbrook/setting.mjs';
import {germanProbe,germanResources} from './fixtures/german-probe.mjs';
import {simulateNPCConversation} from '../dist/simulation.mjs';
const germanSetting={...setting,languages:{de:germanResources}};
const session=(pkg=setting,module=englishModule,extra={})=>createSettingSession(pkg,{languageModule:module,...extra});

test('core, session factory and NPC policy have no transitive concrete-language dependencies',async()=>{
  const seen=new Set();
  async function visit(url){
    if(seen.has(url.href))return;seen.add(url.href);
    assert.doesNotMatch(url.pathname,/\/languages\/|\/gf\/|english|lexical-pack/);
    const source=await readFile(url,'utf8');
    for(const [,path] of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))if(path.startsWith('.'))await visit(new URL(path,url));
  }
  await visit(new URL('../dist/setting-package.mjs',import.meta.url));
  await visit(new URL('../dist/simulation.mjs',import.meta.url));
});
test('module injection is required; locale and resource mismatches fail without an English fallback',()=>{
  assert.throws(()=>createSettingSession(setting),/languageModule/);
  assert.throws(()=>session(setting,germanProbe),/resources missing for de/);
  assert.throws(()=>session(setting,englishModule,{locale:'de'}),/does not support locale/);
  assert.throws(()=>session(setting,{...englishModule,apiVersion:2}),/apiVersion/);
  assert.throws(()=>session(setting,{...englishModule,create:()=>({locale:'en'})}),/adapter missing interpret/);
});
test('each module validates its own resource shape; a German-only setting needs no English fields',()=>{
  assert.equal(validateSetting(germanSetting,{languageModule:germanProbe}),germanSetting);
  const s=session(germanSetting,germanProbe);
  assert.equal(s.respondText('ada','Wo ist die Laterne?').text,'Die Laterne ist in der Werkstatt.');
  assert.equal(s.respondText('ada','Wie geht es dir?').text,'Gut, danke.');
});
test('English and German text produce identical meaning, core plans and snapshots',()=>{
  const en=session(),de=session(germanSetting,germanProbe);
  const a=en.respondText('ada','Where is the lantern?'),b=de.respondText('ada','Wo ist die Laterne?');
  assert.deepEqual(a.act,b.act);assert.deepEqual(a.plan,b.plan);
  assert.deepEqual(en.snapshot(),de.snapshot());assert.notEqual(a.text,b.text);
  assert.deepEqual(en.core.context('ada').referents,{topic:['lantern']});
  assert.equal(de.respondText('ada','Wo ist sie?').plan.results[0].primary.atom.args.subject,'lantern');
});
test('a saved conversation can switch language without altering knowledge or pending observations',()=>{
  const en=session();en.respondText('moss','Where is the lantern?');en.core.advance(1);en.core.applyEvent(setting.domain.events.move);
  const saved=en.snapshot(),de=session(germanSetting,germanProbe,{saved});
  assert.deepEqual(de.snapshot(),saved);
  assert.match(de.respondText('moss','Wo ist sie?').text,/Werkstatt/);
  de.core.advance(5);assert.match(de.respondText('moss','Wo ist sie?').text,/Gewächshaus/);
});
test('source wording is localized by the module, not generated in core evidence',()=>{
  const de=session(germanSetting,germanProbe);de.core.advance(1);
  de.respondText('moss','Die Laterne ist im Gewächshaus.');
  const report=de.core.state.evidence.at(-1);
  assert.equal(report.source.label,undefined);assert.equal(report.source.labelKey,'source.testimony');
  assert.equal(de.respondText('moss','Woher weißt du das?').text,'Das hast du mir erzählt.');
  assert.equal(de.core.world({predicate:'kept_at'})[0].atom.args.place,'workshop');
});
test('NPC conversations use injected localized names, question labels and replies',()=>{
  const s=session(germanSetting,germanProbe);s.core.advance(1);s.core.applyEvent(setting.domain.events.move);
  const result=simulateNPCConversation(s.core,s.language,{initiator:'moss',partner:'ada',goal:setting.demo.choices[1].act});
  assert.equal(result.stopReason,'goal-complete');assert.ok(result.exchanges[0].verified.length);
  const text=result.turns.map(t=>t.text).join(' ');
  assert.match(text,/Hallo, Ada/);assert.match(text,/Gewächshaus/);assert.doesNotMatch(text,/Where|Hello|Thank|unknown|undefined/);
});
test('malformed interpreter output is rejected before it can mutate the simulation',()=>{
  for(const act of [null,{function:'teleport'},{function:'sequence',acts:[{function:'assert',content:{predicate:'missing',args:{}}}]},{function:'social',topic:'not-supported'}]){
    const module={...englishModule,create(args){return {...germanProbe.create({resources:germanResources}),locale:'en',interpret:()=>act};}};
    const s=session(setting,module),before=s.snapshot();assert.throws(()=>s.respondText('ada','test'));assert.deepEqual(s.snapshot(),before);
  }
});
test('realizer and factory receive no live world or mutable core plans',()=>{
  const module={...englishModule,create(args){
    assert.equal(args.schema.facts,undefined);assert.equal(args.schema.evidence,undefined);
    const adapter=germanProbe.create({resources:germanResources});return {...adapter,locale:'en',realize(plan){plan.results[0].primary.atom.args.place='greenhouse';return 'test';}};
  }};
  const s=session(setting,module),reply=s.respondAct('ada',setting.demo.choices[1].act);
  assert.equal(reply.plan.results[0].primary.atom.args.place,'workshop');
  assert.equal(s.core.beliefs('ada',{predicate:'kept_at'})[0].primary.atom.args.place,'workshop');
});
test('English retains its own runtime parser, clock, source labels and decision explanations',()=>{
  const language=createLanguage(englishModule,{resources:setting.languages.en,domain:setting.domain});
  assert.equal(language.clock(0),'08:00');
  assert.equal(language.sourceName({labelKey:'source.initial'}),'initial knowledge');
  assert.match(language.describeDecision('decision.select-evidence'),/personal evidence/);
  assert.equal(language.interpret('Where are you?',{addressee:'ada'}).query.args.subject,'ada');
});
test('localized source keys survive host events, delayed delivery and publication sharing',()=>{
  const pkg={...setting,domain:structuredClone(setting.domain),languages:{en:{...setting.languages.en,sources:{ledger:'the morning ledger',note:'the delivery note'}}}};
  for(const fact of pkg.domain.facts){delete fact.sourceLabel;fact.sourceKey='ledger';}
  delete pkg.domain.events.move.label;pkg.domain.events.move.sourceKey='note';
  const s=session(pkg);
  assert.equal(s.language.sourceName(s.core.beliefs('ada',{predicate:'kept_at'})[0].primary.source),'the morning ledger');
  s.core.advance(1);s.core.applyEvent(pkg.domain.events.move);
  assert.equal(s.core.state.pending[0].labelKey,'note');
  simulateNPCConversation(s.core,s.language,{initiator:'moss',partner:'ada',goal:pkg.demo.choices[1].act});
  assert.equal(s.core.state.evidence.find(e=>e.source.kind==='shared-publication').source.labelKey,'note');
  s.core.advance(5);
  assert.equal(s.language.sourceName(s.core.state.evidence.at(-1).source),'the delivery note');
});
