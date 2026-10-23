import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {makeParty,conversationOptions} from '../examples/party.mjs';
import {createConversationWorld,createPartySession,createNPCConversation,simulateNPCConversation} from '../dist/index.mjs';
import {englishModule,createEnglishResources,splitBubbles} from '../dist/languages/en/index.mjs';
import {solarpolisCanon,createSolarpolisCanon} from '../dist/canon/solarpolis.mjs';
import {solarpolisEnglish} from '../dist/languages/en/solarpolis-canon.mjs';
const drain=c=>{const turns=[];let t;while((t=c.next()))turns.push(t);return turns;};

test('seeded conversations replay; another day changes wording and topics',()=>{
  const run=day=>drain(makeParty().session.conversation({...conversationOptions,day,maxTurns:48}));
  const a=run(12);assert.deepEqual(a,run(12));assert.notDeepEqual(a.map(t=>t.text),run(13).map(t=>t.text));
  assert.equal(a.length,48);assert.equal(new Set(a.map(t=>t.speaker)).size,3);
  assert.ok(a.some(t=>t.kind==='pursuit'));assert.ok(a.some(t=>t.kind==='opinion'));
  for(const t of a)for(const piece of t.pieces){assert.ok(Array.from(piece).length<=90);assert.doesNotMatch(piece,/World bible|Recorded claim|undefined|specific question/);}
});
test('pause, stop and save/restore work between every pair of turns',()=>{
  const baseline=drain(makeParty().session.conversation(conversationOptions));
  for(let cut=0;cut<baseline.length;cut++){
    const {world,resources,session}=makeParty(),c=session.conversation(conversationOptions);
    for(let i=0;i<cut;i++)c.next();
    c.pause();const before=session.snapshot(),checkpoint=c.snapshot();assert.equal(c.next(),null);assert.deepEqual(session.snapshot(),before);
    const resumed=createPartySession(world,{participants:['ona','teo','pip'],resources,languageModule:englishModule,saved:before});
    const restored=resumed.conversation({...conversationOptions,saved:checkpoint});assert.equal(restored.next(),null);restored.resume();
    assert.deepEqual(drain(restored),baseline.slice(cut));
    c.stop('walking-on');c.resume();assert.equal(c.next(),null);assert.equal(c.stopReason,'walking-on');
  }
});
test('six people get turns without a fixed rotation; player contexts remain separate',()=>{
  const {world,resources}=makeParty();
  for(const id of ['a','b','c']){world.addCharacter({id,temperament:'lively',pursuits:['music']});resources.entities[id]={name:id};}
  const session=world.createSession({participants:['ona','teo','pip','a','b','c'],languageModule:englishModule,resources});
  const before=structuredClone(session.core.state.contexts);
  const turns=drain(session.conversation({...conversationOptions,maxTurns:100}));
  assert.equal(new Set(turns.map(t=>t.speaker)).size,6);
  assert.ok(turns.some((t,i)=>i>5&&t.speaker!==turns[i-6].speaker));
  assert.deepEqual(session.core.state.contexts,before);
});
test('catalog additions synchronize only rightful observers; facts can arrive in the future',()=>{
  const {world,resources,session}=makeParty();
  world.addEntities({lake:{type:'place'}});resources.entities.lake={name:'the lake'};session.refreshLanguage(resources);
  world.addFacts([{id:'dance-moved',atom:{predicate:'located_at',args:{subject:'dance',place:'lake'}},knownBy:['ona'],validFrom:5,validTo:null,origin:{kind:'sample'},sourceKind:'observation'}]);
  session.syncKnowledge();assert.equal(session.core.beliefs('ona').length,0);
  session.core.advance(5);session.syncKnowledge();assert.equal(session.core.beliefs('ona')[0].primary.atom.args.place,'lake');
  assert.equal(session.core.beliefs('teo')[0].primary.atom.args.place,'pavilion');assert.equal(session.core.beliefs('pip').length,0);
  const n=session.core.state.evidence.length;session.syncKnowledge();assert.equal(session.core.state.evidence.length,n);
  world.addCharacter({id:'new',pursuits:['hiking']});resources.entities.new={name:'New'};session.addCharacter('new',resources);
  assert.equal(session.core.domain.characters.length,4);assert.equal(session.core.beliefs('new').length,0);
  assert.throws(()=>world.addFacts([{id:'invalid',atom:{predicate:'missing',args:{}},validFrom:0,validTo:null,origin:{kind:'sample'}}]));assert.equal(world.factCount,2);
});
test('group testimony stays attributed, never becomes confirmed, and source prose stays short',()=>{
  const {session}=makeParty();const turns=drain(session.conversation({...conversationOptions,maxTurns:100}));
  assert.ok(turns.some(t=>t.kind==='answer'&&t.plan.results.length));
  for(const t of turns.filter(t=>t.kind==='answer'&&t.plan.results.length)){
    for(const exchange of t.exchanges)for(const id of exchange.reports){
      const e=session.core.state.evidence.find(e=>e.id===id);assert.equal(e.certainty,'reported');assert.equal(e.source.speaker,t.speaker);
    }
  }
  const language=session.language;
  const source=(source,certainty='confirmed')=>language.realizeBubble({kind:'source',variant:0,evidence:{source,certainty}}).join(' ');
  assert.match(source({kind:'publication',label:'World bible · Uplifted dolphins'}),/read/);
  assert.doesNotMatch(source({kind:'publication'}),/everyone|common knowledge/i);
  assert.match(source({kind:'testimony',speaker:'teo'},'reported'),/Teo told me/);
  assert.match(source({kind:'common-knowledge'}),/common knowledge/);
  assert.match(source({kind:'inference'},'inferred'),/could be wrong/);
});
test('profile body, age, pursuits and temperament affect language with no per-person scripts',()=>{
  const {session}=makeParty(),language=session.language;
  const lines=profile=>Array.from({length:12},(_,variant)=>language.realizeBubble({kind:'reflection',profile,variant}).join(' '));
  assert.notDeepEqual(lines({temperament:'dry'}),lines({temperament:'warm'}));
  assert.ok(lines({bodyKind:'shell'}).some(s=>s.includes('shell')));
  assert.ok(lines({ageGroup:'young'}).some(s=>s.includes('things I want to try')));
  const pieces=splitBubbles('😀'.repeat(200)+' No, that is not true.');assert.ok(pieces.every(s=>Array.from(s).length<=90));assert.match(pieces.join(' '),/not true/);
});
test('ambient mode coexists with the legacy simulation API',()=>{
  const {session}=makeParty();const result=simulateNPCConversation(session.core,session.language,{mode:'ambient',participants:['ona','teo','pip'],...conversationOptions});
  assert.equal(result.turns.length,24);assert.equal(result.stopReason,'turn-budget');
});
test('invalid participants, seeds, topics and missing language capability fail before turns',()=>{
  const {session}=makeParty(),base={participants:['ona','teo','pip']};const before=session.snapshot();
  for(const extra of [{seed:NaN},{day:{}},{maxTurns:0},{participants:['ona','ona']},{topics:[{function:'assert'}]}])assert.throws(()=>createNPCConversation(session.core,session.language,{...base,...extra}));
  assert.throws(()=>createNPCConversation(session.core,{},{...base}));assert.deepEqual(session.snapshot(),before);
});
test('shared canon is extensible, knowledge is explicit, and no sample cast leaks in',()=>{
  assert.ok(solarpolisCanon.facts.length>=180);assert.ok(Object.isFrozen(solarpolisCanon.facts));assert.ok(solarpolisCanon.facts.every(f=>f.origin.kind==='canon'&&f.knownBy.length===0));
  assert.equal(solarpolisCanon.entities.iona,undefined);
  const canon=createSolarpolisCanon({knownBy:['a']});const world=createConversationWorld({canon,profiles:[{id:'a'},{id:'b'}]});
  const resources={...solarpolisEnglish,entities:{...solarpolisEnglish.entities,a:{name:'A'},b:{name:'B'}}};
  const session=world.createSession({participants:['a','b'],resources,languageModule:englishModule});
  assert.ok(session.core.beliefs('a').length>100);assert.equal(session.core.beliefs('b').length,0);
});
test('one thousand profiles do not allocate one thousand conversation contexts',()=>{
  const profiles=Array.from({length:1000},(_,i)=>({id:`r${i}`,pursuits:['music']}));
  const world=createConversationWorld({profiles});
  const resources=createEnglishResources({entities:Object.fromEntries(profiles.map(p=>[p.id,p.id]))});
  const sessions=Array.from({length:20},(_,i)=>world.createSession({participants:[`r${i*3}`,`r${i*3+1}`,`r${i*3+2}`],resources,languageModule:englishModule}));
  assert.equal(world.characterCount,1000);
  for(const s of sessions){assert.equal(Object.keys(s.core.state.contexts).length,3);assert.equal(s.core.domain.entities,world.schema.entities);assert.equal(drain(s.conversation({seed:42,maxTurns:12})).length,12);}
});
test('library runs in a worker with browser globals absent',async()=>{
  const url=new URL('../examples/party.mjs',import.meta.url).href;
  const worker=new Worker(`const {parentPort}=require('node:worker_threads');import(${JSON.stringify(url)}).then(({makeParty})=>{global.Math.random=()=>{throw Error('random forbidden')};global.Date=class{constructor(){throw Error('clock forbidden')}};const c=makeParty().session.conversation({seed:1});parentPort.postMessage(c.next().pieces);});`,{eval:true});
  const result=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);});await worker.terminate();assert.ok(result.length);
});
test('group policy and catalog import no concrete language or DOM',async()=>{
  for(const file of ['conversation-world.mjs','group-conversation.mjs','profiles.mjs','seed.mjs']){
    const source=await readFile(new URL(`../dist/${file}`,import.meta.url),'utf8');assert.doesNotMatch(source,/languages\/en|Math\.random|\bDate\b|\bdocument\b|\bwindow\b/);
  }
});

test('multiple facts are discussed once and reflection follow-ups retain their semantic subject',()=>{
  const {world,session}=makeParty();
  world.addFacts([{id:'second-event',atom:{predicate:'located_at',args:{subject:'ona',place:'court'}},validFrom:0,validTo:null,origin:{kind:'sample'}}]);
  const turns=drain(session.conversation({...conversationOptions,maxTurns:80,topics:[...conversationOptions.topics,{function:'ask',query:{predicate:'located_at',args:{subject:'ona'}}}]}));
  assert.deepEqual(turns.filter(t=>t.kind==='answer').map(t=>t.act.query.args.subject),['dance','ona']);
  assert.ok(turns.some(t=>t.kind==='pursuit-answer'));
  const language=session.language;
  assert.match(language.realizeBubble({kind:'reflection-response',reflectionTopic:'rest',variant:0}).join(' '),/take a moment/);
});

test('a different bubble adapter runs the same neutral party policy and belief updates',()=>{
  const a=makeParty(),b=makeParty();
  const probe={apiVersion:1,locale:'probe',validateResources(){},create(){return {
    locale:'probe',interpret(){return {function:'greet'};},realize(){return 'probe';},name(id){return id;},label(){return 'probe';},npcLine(){return 'probe';},
    bubbleVersion:1,realizeBubble(move){return [move.kind==='answer'&&move.plan.results.length?'Die Aussage wird als Bericht weitergegeben.':'Ein Gesprächsbeitrag.'];}
  };}};
  const alternative=b.world.createSession({participants:['ona','teo','pip'],languageModule:probe,resources:{}});
  const english=drain(a.session.conversation(conversationOptions)),other=drain(alternative.conversation(conversationOptions));
  assert.deepEqual(english.map(t=>[t.speaker,t.kind,t.plan]),other.map(t=>[t.speaker,t.kind,t.plan]));
  assert.deepEqual(a.session.core.snapshot(),alternative.core.snapshot());
  assert.notEqual(english[0].text,other[0].text);
});
