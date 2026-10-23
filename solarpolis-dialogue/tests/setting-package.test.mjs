import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSettingSession,validateSetting} from '../dist/setting-package.mjs';
import {setting} from '../dist/settings/willowbrook/setting.mjs';
import {MemoryStorage} from '../dist/storage.mjs';
import {simulateNPCConversation} from '../dist/simulation.mjs';
const location=s=>s.respondText('moss','Where is the lantern?').plan.results[0].primary;
const edited=()=>({...setting,domain:structuredClone(setting.domain),languages:{en:{...setting.languages.en}}});

test('second setting dependency graph includes shared English and GF but no Solarpolis module',async()=>{
  const seen=new Set();
  async function visit(url){
    if(seen.has(url.href))return;seen.add(url.href);
    assert.doesNotMatch(url.pathname.split('/').at(-1),/solarpolis/);
    const source=await readFile(url,'utf8');
    for(const [,path] of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))if(path.startsWith('.'))await visit(new URL(path,url));
  }
  await visit(new URL('../dist/setting-package.mjs',import.meta.url));
  await visit(new URL('../dist/settings/willowbrook/setting.mjs',import.meta.url));
  assert.ok([...seen].some(p=>p.endsWith('/english.mjs')));
  assert.ok([...seen].some(p=>p.endsWith('/gf/grammar.mjs')));
});
test('choices and typed English reach identical acts with a different predicate name',()=>{
  const s=createSettingSession(setting);
  for(const choice of setting.demo.choices)assert.deepEqual(s.language.interpret(choice.label),choice.act);
  assert.equal(s.respondText('ada','Where is the lantern?').plan.results[0].primary.atom.predicate,'kept_at');
  assert.equal(s.language.lastInterpretation.engine,'GF');
  assert.match(s.respondText('ada','When is the fair?').text,/10:00/);
  assert.equal(s.language.clock(0),'08:00');
});
test('unseen movement, pronouns and there verification use personal evidence and mapped location',()=>{
  const s=createSettingSession(setting);s.core.advance(1);s.core.applyEvent(setting.domain.events.move);
  assert.equal(s.respondText('ada','Where is the lantern?').plan.results[0].primary.atom.args.place,'greenhouse');
  assert.equal(location(s).atom.args.place,'workshop');
  assert.equal(s.respondText('ada','Where is it?').plan.results[0].primary.atom.args.place,'greenhouse');
  assert.equal(s.respondText('ada','Is the lantern there?').plan.outcome,'supported');
  s.core.advance(4);assert.equal(location(s).atom.args.place,'workshop');
  s.core.advance(1);assert.equal(location(s).atom.args.place,'greenhouse');
});
test('testimony and explicit negation never edit the authoritative lantern location',()=>{
  const s=createSettingSession(setting);s.core.advance(1);
  s.respondText('moss','The lantern is in the greenhouse.');
  assert.equal(location(s).certainty,'reported');
  assert.equal(s.core.world({predicate:'kept_at'})[0].atom.args.place,'workshop');
  const denied=s.respondText('ada','The lantern is not in the greenhouse.');
  assert.equal(denied.act.content.polarity,false);
  assert.match(denied.text,/not in the greenhouse/);
});
test('setting-only ownership construction and inference cannot reveal another NPC’s knowledge',()=>{
  const s=createSettingSession(setting);
  assert.match(s.respondText('ada','Who owns the lantern?').text,/I own/);
  assert.equal(s.respondText('moss','Who owns the lantern?').plan.results.length,0);
  assert.equal(s.respondText('ada','Who looks after the lantern?').plan.results[0].primary.certainty,'inferred');
  assert.match(s.respondText('ada','How do you know?').text,/whoever owns a tool/);
  assert.equal(s.respondText('moss','Who looks after the lantern?').plan.results.length,0);
});
test('social English is reusable, voices differ, and compound acts preserve their meanings',()=>{
  const s=createSettingSession(setting);
  assert.match(s.respondText('ada','How are you today?').text,/kettle/);
  assert.match(s.respondText('moss','How are you today?').text,/seedling/);
  s.respondText('ada',"I'm tired.");assert.equal(s.core.context('ada').social.userState.value,'tired');
  const result=s.respondText('ada',"I'm fine. Where is the lantern?");
  assert.equal(result.act.function,'sequence');assert.equal(result.plan.results[0].primary.atom.args.place,'workshop');
});
test('unsupported setting concepts repair safely, including former unguarded Solarpolis construction',()=>{
  const s=createSettingSession(setting);
  for(const input of ['Someone told me he welcomes every arrival.','Is the reservation confirmed?','What rights does the lantern have?','Who owns the lantern and the fair?']){
    const before=s.core.state.evidence.length;
    assert.equal(s.respondText('ada',input).act.function,'clarify',input);
    assert.equal(s.core.state.evidence.length,before);
  }
});
test('setting-tagged snapshots restore delayed knowledge and reject foreign or incompatible saves',async()=>{
  const s=createSettingSession(setting),storage=new MemoryStorage();s.core.advance(1);s.core.applyEvent(setting.domain.events.move);
  s.respondText('moss','Where is the lantern?');await storage.save(s.snapshot());
  const restored=createSettingSession(setting,{saved:await storage.load()});
  assert.equal(restored.core.context('moss').focus,'lantern');assert.equal(location(restored).atom.args.place,'workshop');
  restored.core.advance(5);assert.equal(location(restored).atom.args.place,'greenhouse');
  assert.throws(()=>createSettingSession(setting,{saved:{...s.snapshot(),settingId:'solarpolis'}}),/incompatible/);
  assert.throws(()=>createSettingSession(setting,{saved:{...s.snapshot(),domainVersion:2}}),/incompatible/);
  assert.throws(()=>createSettingSession(setting,{locale:'de'}),/no language implementation/);
});
test('NPC exchanges work in second setting with source sharing and isolated player context',()=>{
  const s=createSettingSession(setting);s.core.advance(1);s.core.applyEvent(setting.domain.events.move);
  const context=s.core.context('moss');
  const result=simulateNPCConversation(s.core,s.language,{initiator:'moss',partner:'ada',goal:setting.demo.choices[1].act});
  assert.equal(result.stopReason,'goal-complete');assert.ok(result.exchanges[0].verified.length);
  assert.deepEqual(s.core.context('moss'),context);
  assert.equal(location(s).atom.args.place,'greenhouse');
  assert.doesNotMatch(result.turns.map(t=>t.text).join(' '),/undefined|Solarpolis|Serein|Iona|Rill|lunar/i);
});
test('package validation catches authoring errors before play',()=>{
  const missing=edited();delete missing.domain.entities.lantern;assert.throws(()=>validateSetting(missing),/absent/);
  const keys=edited();keys.domain.predicates.kept_at.keyRoles=['bad'];assert.throws(()=>validateSetting(keys),/keyRoles/);
  const recipient=edited();recipient.domain.events.move.observers=['ghost'];assert.throws(()=>validateSetting(recipient),/recipient/);
  const binding=edited();binding.languages.en.bindings={located_at:'missing'};assert.throws(()=>validateSetting(binding),/binding/);
  const role=edited();role.languages.en.predicates={...role.languages.en.predicates,owns:{positive:'{invented}',negative:'no'}};assert.throws(()=>validateSetting(role),/template role/);
});
