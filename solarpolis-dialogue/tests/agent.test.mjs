import test from 'node:test';
import assert from 'node:assert/strict';
import {AgentCore} from '../dist/core.mjs';
import {domain} from '../dist/solarpolis.mjs';
import {scenario} from '../dist/languages/en/solarpolis-presentation.mjs';
import {EnglishLanguage} from '../dist/languages/en/english.mjs';
import {resources} from '../dist/languages/en/solarpolis-en.mjs';
import {MemoryStorage} from '../dist/storage.mjs';
const english=new EnglishLanguage(resources);
const query={function:'ask',query:{predicate:'located_at',args:{subject:'exchange',place:{$var:'place'}}}};
const location=(core,npc)=>core.respond(npc,query).results[0].primary.atom.args.place;
test('unseen changes never enter an NPC response; observed changes do',()=>{
  const c=new AgentCore(domain);c.advance(1);c.applyEvent(domain.events.venue);
  assert.equal(c.world({predicate:'located_at',args:{subject:'exchange'}})[0].atom.args.place,'current_court');
  assert.equal(location(c,'serein'),'current_court');
  assert.equal(location(c,'iona'),'echo_gallery');
  assert.equal(location(c,'rill'),'echo_gallery');
});
test('venue changes do not teleport participants',()=>{
  const c=new AgentCore(domain);c.applyEvent(domain.events.venue);
  assert.equal(c.world({predicate:'located_at',args:{subject:'rill'}})[0].atom.args.place,'flow_chamber');
  c.applyEvent(domain.events.rill);
  assert.equal(c.world({predicate:'located_at',args:{subject:'rill'}})[0].atom.args.place,'current_court');
  assert.equal(c.beliefs('iona',{predicate:'located_at',args:{subject:'rill'}})[0].primary.atom.args.place,'flow_chamber');
});
test('false testimony changes personal reports, never authoritative facts',()=>{
  const c=new AgentCore(domain);c.advance(1);
  const claim={function:'assert',content:{predicate:'located_at',args:{subject:'exchange',place:'flow_chamber'},polarity:true}};
  c.respond('iona',claim);c.respond('rill',claim);
  assert.equal(location(c,'iona'),'echo_gallery');assert.equal(location(c,'rill'),'flow_chamber');
  assert.equal(c.respond('rill',query).results[0].primary.certainty,'reported');
  assert.equal(c.world({predicate:'located_at',args:{subject:'exchange'}})[0].atom.args.place,'echo_gallery');
  assert.match(english.realize(c.respond('rill',query),domain.characters[2]),/your report/);
});
test('verified evidence supersedes an earlier provisional report at the same simulation time',()=>{
  const c=new AgentCore(domain);c.advance(1);c.applyEvent(domain.events.venue);
  c.respond('rill',{function:'assert',content:{predicate:'located_at',args:{subject:'exchange',place:'flow_chamber'},polarity:true}});
  const notice=c.world({predicate:'located_at',args:{subject:'exchange'}})[0];
  c.observe('rill',notice,{kind:'publication',label:'shown notice'});
  assert.equal(location(c,'rill'),'current_court');
  assert.equal(c.respond('rill',query).results[0].primary.certainty,'confirmed');
});
test('remote truth waits for signal delivery before entering any character belief',()=>{
  const c=new AgentCore(domain);c.applyEvent(domain.events.signal);
  const q={predicate:'reservation',args:{subject:'patient_margin'}};
  assert.equal(c.world(q)[0].atom.args.status,'confirmed');
  for(const npc of domain.characters)assert.equal(c.beliefs(npc.id,q)[0].primary.atom.args.status,'pending');
  c.advance(11);assert.equal(c.beliefs('serein',q)[0].primary.atom.args.status,'pending');
  c.advance(1);for(const npc of domain.characters){const e=c.beliefs(npc.id,q)[0].primary;assert.equal(e.atom.args.status,'confirmed');assert.equal(e.learnedAt,12);assert.equal(e.aboutTime,0);}
});
test('history and source times survive changes and repeated events are idempotent',()=>{
  const c=new AgentCore(domain);c.advance(1);assert.equal(c.applyEvent(domain.events.venue),true);
  const count=c.state.evidence.length;assert.equal(c.applyEvent(domain.events.venue),false);assert.equal(c.state.evidence.length,count);
  const old=c.state.world.find(f=>f.id==='s-venue');assert.equal(old.validTo,1);
  assert.equal(c.beliefs('serein',query.query)[0].history.length,2);
});
test('English, choices, pronoun follow-ups, and evidence requests share semantics',()=>{
  assert.deepEqual(english.interpret('Where is the exchange?'),english.normalizeAct(scenario.starterQueries[0].act));
  const c=new AgentCore(domain);c.respond('iona',english.interpret('Where is Rill?'));
  assert.equal(english.interpret('Where are they now?',c.context('iona')).query.args.subject,'rill');
  const plan=c.respond('iona',english.interpret('How do you know?'));
  assert.equal(plan.results[0].primary.atom.args.subject,'rill');
  assert.equal(english.interpret('The exchange is not in Current Court.').content.polarity,false);
  assert.equal(english.interpret('Where are Rill and Neris?').function,'clarify');
});
test('missing knowledge is unknown and unsupported language triggers repair',()=>{
  const c=new AgentCore(domain);const result=c.respond('rill',{function:'ask',query:{args:{subject:'arks'}}});
  assert.equal(result.results.length,0);
  assert.equal(english.interpret('Write me a sonnet about the universe').function,'clarify');
  assert.equal(c.respond('rill',english.interpret('yes')).function,'clarify');
});
test('characters express the same evidence differently without changing its meaning',()=>{
  const c=new AgentCore(domain);
  const replies=domain.characters.map(npc=>english.realize(c.respond(npc.id,query),npc));
  assert.equal(new Set(replies).size,3);
  for(const text of replies){assert.match(text,/Echo Gallery/);assert.match(text,/16:00/);}
});
test('invalid host changes are atomic',()=>{
  const c=new AgentCore(domain);const before=c.snapshot();
  assert.throws(()=>c.applyEvent({id:'bad',observers:['serein'],changes:[domain.events.venue.changes[0],{atom:{predicate:'unknown',args:{}}}]}));
  assert.deepEqual(c.snapshot(),before);
});
test('storage snapshot restores beliefs, world history, signals, and conversation focus',async()=>{
  const c=new AgentCore(domain),store=new MemoryStorage();c.advance(1);c.applyEvent(domain.events.venue);c.applyEvent(domain.events.signal);c.respond('iona',query);
  await store.save(c.snapshot());const restored=new AgentCore(domain,await store.load());
  assert.equal(location(restored,'iona'),'echo_gallery');assert.equal(restored.context('iona').focus,'exchange');
  restored.advance(12);assert.equal(restored.beliefs('iona',{predicate:'reservation'})[0].primary.atom.args.status,'confirmed');
});
test('the unchanged core works with a different domain and no English resources',()=>{
  const alternative={version:1,entities:{unit:{},bay:{},dock:{}},predicates:{inside:{roles:{thing:'entity',container:'entity'},keyRoles:['thing']}},
    characters:[{id:'robot',personality:{detail:1,testimony:'strict'}}],facts:[{id:'a',atom:{predicate:'inside',args:{thing:'unit',container:'bay'}},validFrom:0,validTo:null}]};
  const c=new AgentCore(alternative);c.applyEvent({id:'move',changes:[{atom:{predicate:'inside',args:{thing:'unit',container:'dock'}}}],observers:['robot']});
  assert.equal(c.respond('robot',{function:'ask',query:{predicate:'inside',args:{thing:'unit'}}}).results[0].primary.atom.args.container,'dock');
});
