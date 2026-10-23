import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AgentCore,matches} from '../dist/core.mjs';
import {EnglishLanguage} from '../dist/languages/en/english.mjs';
import {domain} from '../dist/solarpolis.mjs';
import {resources} from '../dist/languages/en/solarpolis-en.mjs';
const lexicalPack=JSON.parse(readFileSync(new URL('../dist/languages/en/data/lexical-pack.json',import.meta.url)));
function session(id='serein'){
  const core=new AgentCore(domain),language=new EnglishLanguage(resources,{lexicalPack});
  const turn=input=>{const act=language.interpret(input,{...core.context(id),speaker:id}),plan=core.respond(id,act);return {act,plan,reply:language.realize(plan,domain.characters.find(c=>c.id===id))};};
  return {core,language,turn};
}
test('compound social disclosure and testimony both survive, with no world mutation',()=>{
  const {core,turn}=session(),world=core.world();
  const result=turn("I'm fine. I heard that copying a mind without consent is ordinary practice in most habitats.");
  assert.equal(result.act.function,'sequence');assert.equal(core.context('serein').social.userState.value,'positive');
  const report=core.state.evidence.find(e=>e.id===core.context('serein').lastReportId);
  assert.equal(report.atom.args.value,'ordinary practice');assert.equal(report.source.speaker,'player');
  assert.equal(turn('Can you check that against what you know?').plan.outcome,'opposed');
  assert.equal(turn('Please keep my first statement attached to me as an unverified report.').plan.report.id,report.id);
  assert.deepEqual(core.world(),world);
});
test('scope and explicit negation are retained rather than silently generalized',()=>{
  const {turn}=session();
  const a=turn('I heard that copying a mind without consent is not ordinary practice in most habitats.').act;
  assert.equal(a.content.polarity,false);assert.equal(a.content.args.scope,'most_habitats');
  assert.equal(turn('I heard that copying a mind without consent is ordinary practice everywhere.').act.function,'clarify');
});
test('array travel reasons cannot resolve to the ship reservation',()=>{
  const {turn}=session('iona'),p=turn("Why can an array operator affect a ship's trip?").plan;
  assert.ok(p.results.some(g=>g.primary.atom.predicate==='controls'));
  assert.ok(p.results.some(g=>g.primary.atom.predicate==='requires'));
  assert.ok(p.results.every(g=>g.primary.atom.predicate!=='reservation'));
});
test('influence is not regional government; derived denial has personal premises',()=>{
  const {turn}=session('iona');turn('What makes Selenipolis influential in travel?');
  const {plan,reply}=turn('Does that mean it governs the whole inner system?');
  assert.equal(plan.outcome,'opposed');assert.equal(plan.results[0].primary.certainty,'inferred');
  assert.match(reply,/not governed by Selenipolis/);
  assert.ok(plan.results[0].primary.proof.premises.length>=2);
});
test('inference disappears when its premise is superseded and cannot use unseen world truth',()=>{
  const {core}=session('iona');
  const query={predicate:'governed_by',args:{subject:'inner_system',object:'selenipolis'}};
  assert.equal(core.beliefs('iona',query)[0].primary.atom.polarity,false);
  core.advance(1);core.applyEvent({id:'test:government',observers:['serein'],changes:[{atom:{predicate:'governed_by',args:{subject:'inner_system',object:'central_government'},polarity:true}}]});
  assert.equal(core.beliefs('serein',query).length,0);assert.equal(core.beliefs('iona',query)[0].primary.atom.polarity,false);
});
test('who answers establish a person reference without merging two individuals',()=>{
  const {turn,core}=session();turn('Who helps arrivals find their bearings?');
  assert.equal(core.context('serein').focus,'serein');
  assert.equal(turn('Is that person the same as the Mind that governs Threnody?').plan.outcome,'opposed');
  assert.equal(turn('Do you yourself govern the habitat?').plan.outcome,'opposed');
});
test('Boolean location questions and there references keep people and venues distinct',()=>{
  const {turn}=session();
  assert.equal(turn('Before I go, is Rill at the Flow Chamber?').plan.outcome,'supported');
  const result=turn('Is the exchange there too?');
  assert.equal(result.plan.content.args.place,'flow_chamber');assert.equal(result.plan.outcome,'opposed');
  assert.match(result.reply,/Echo Gallery/);
});
test('a qualification about not seeing a notice does not deny the reported event',()=>{
  const {turn,core}=session();turn('Someone told me the acoustic exchange was moved to Current Court. Is that right?');
  turn("Actually, I haven't seen any notice saying it moved there. Where is it scheduled now?");
  const report=core.state.evidence.find(e=>e.id===core.context('serein').lastReportId);
  assert.equal(report.atom.polarity,true);assert.equal(report.qualifications[0].verification,'not_observed');
  assert.equal(turn('What was the source for the location you just gave me?').plan.results[0].primary.source.label,'16:00 local programme notice');
});
test('unknown estimates cannot turn into invented numbers or unrelated summaries',()=>{
  const {turn}=session('rill');
  assert.equal(turn('How many visitors are here right now?').plan.function,'ask_count_unknown');
  assert.equal(turn('Do you know exactly how many dolphins are in Krillix today?').plan.results.length,0);
  assert.equal(turn("Could you estimate if you don't know the current count?").plan.results.length,0);
});
test('new phrasing for a reservation still uses delayed personal evidence',()=>{
  const {turn,core}=session('iona');core.applyEvent(domain.events.signal);
  const before=turn('Do you know whether the Patient Margin has a confirmed reservation?');
  assert.equal(before.plan.results[0].primary.atom.args.status,'pending');
  assert.equal(turn('What would have to happen before you could say that booking was confirmed?').plan.function,'evidence_requirements');
  core.advance(12);assert.equal(turn('Do you know whether the Patient Margin has a confirmed reservation?').plan.results[0].primary.atom.args.status,'confirmed');
});
test('real imported morphology and VerbNet frame preserve a past departure without teleportation',()=>{
  const {turn,language,core}=session();const before=core.world();
  const result=turn('Neris left Echo Gallery.');
  assert.equal(result.act.content.predicate,'departed_from');assert.equal(result.plan.report.aboutTime,null);
  assert.match(language.lastInterpretation.engine,/VerbNet/);assert.ok(language.lastInterpretation.wordnetSynsets.length);
  assert.deepEqual(core.world(),before);
});
test('GF execution reaches the core, lists only major players, and retains source proof',()=>{
  const {turn,language}=session('iona');const p=turn('Who are the main players?').plan;
  assert.equal(language.lastInterpretation.engine,'GF');assert.equal(p.items.length,4);assert.ok(!p.items.includes('threnody'));
  const explanation=turn('Why can Pritt rule Aurelipolis?');
  assert.ok(explanation.plan.results.some(g=>g.primary.atom.predicate==='recognized_because'));
  assert.match(explanation.reply,/biological/i);
});
test('query disjunctions still obey the parent subject restriction',()=>{
  const atom={predicate:'nature',args:{subject:'rill',value:'x'}};
  assert.equal(matches(atom,{args:{subject:'iona'},anyOf:[{predicate:'nature'}]}),false);
});
test('v1 migration is additive and idempotent, retaining events and testimony',()=>{
  const legacy=structuredClone(domain);legacy.version=1;legacy.facts=legacy.facts.filter(f=>!f.id.startsWith('expanded:')&&!f.id.startsWith('meaning-'));
  // A realistic pre-expansion snapshot contains only the original c-/s- facts.
  legacy.facts=legacy.facts.filter(f=>/^[cs]-/.test(f.id));legacy.rules=[];legacy.viewpoints=[];
  const old=new AgentCore(legacy);old.advance(1);old.applyEvent(domain.events.venue);
  old.respond('iona',{function:'assert',content:{predicate:'located_at',args:{subject:'exchange',place:'flow_chamber'},polarity:true}});
  const report=old.context('iona').lastReportId,saved=old.snapshot(),restored=new AgentCore(domain,saved);
  assert.equal(restored.state.domainVersion,2);assert.equal(restored.context('iona').lastReportId,report);
  assert.equal(restored.world({predicate:'located_at',args:{subject:'exchange'}})[0].atom.args.place,'current_court');
  assert.ok(restored.world({predicate:'norm_status'}).length);assert.equal(restored.state.history.length,saved.history.length);
  assert.deepEqual(new AgentCore(domain,restored.snapshot()).snapshot(),restored.snapshot());
});

test('duplicate copies of a notice do not replace the previous event in temporal queries',()=>{
  const {core,turn}=session();core.advance(1);core.applyEvent(domain.events.venue);
  const amended=core.world({predicate:'located_at',args:{subject:'exchange'}})[0];
  core.observe('serein',amended,{kind:'publication',label:'another copy of the amendment'});
  const result=turn('Where was the exchange before?');
  assert.equal(result.plan.results[0].primary.atom.args.place,'echo_gallery');
});
