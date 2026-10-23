import test from 'node:test';
import assert from 'node:assert/strict';
import {AgentCore} from '../dist/core.mjs';
import {EnglishLanguage} from '../dist/english.mjs';
import {domain} from '../dist/solarpolis.mjs';
import {resources} from '../dist/solarpolis-en.mjs';
const language=new EnglishLanguage(resources);
function turn(core,npc,text){const act=language.interpret(text,{...core.context(npc),speaker:npc});const plan=core.respond(npc,act);return {act,plan,text:language.realize(plan,domain.characters.find(c=>c.id===npc))};}
test('ordinary social openings work for every NPC without changing world facts or evidence',()=>{
  for(const npc of domain.characters){
    const core=new AgentCore(domain),before=core.snapshot();
    const reply=turn(core,npc.id,`Hello, ${npc.name}. How are you today?`);
    assert.equal(reply.plan.social.topic,'wellbeing');assert.equal(reply.plan.social.prompt,'wellbeing');
    assert.doesNotMatch(reply.text,/specific question|suggested questions|establish|unrecognized/i);
    assert.deepEqual(core.state.world,before.world);assert.deepEqual(core.state.evidence,before.evidence);
    assert.match(reply.text,/\?/);
  }
});
test('voices disclose different interests, not interchangeable greeting prefixes',()=>{
  const replies=domain.characters.map(npc=>turn(new AgentCore(domain),npc.id,'How are you?').text);
  assert.equal(new Set(replies).size,3);assert.match(replies[0],/helping people/);assert.match(replies[1],/calendars/);assert.match(replies[2],/acoustic/);
});
test('wellbeing responses remember the player, respect boundaries, and stop repeated reciprocal questions',()=>{
  const core=new AgentCore(domain);turn(core,'iona','How are you?');
  const response=turn(core,'iona',"I'm worried");assert.equal(response.plan.social.userState.value,'worried');assert.equal(response.plan.social.prompt,'company');
  const yes=turn(core,'iona','yes');assert.equal(yes.plan.social.move,'accept');
  const boundary=turn(core,'iona',"I don't want to talk about it");assert.equal(boundary.plan.social.topic,'boundary');assert.doesNotMatch(boundary.text,/\?/);
  const repeat=turn(core,'iona','How are you?');assert.equal(repeat.plan.social.repeat,true);assert.equal(repeat.plan.social.prompt,null);
});
test('positive and negative bare answers depend on a pending social question',()=>{
  const core=new AgentCore(domain);turn(core,'rill','How are you?');
  const response=turn(core,'rill','Not very well');assert.equal(response.act.state,'negative');assert.match(response.text,/company/);
  assert.equal(language.interpret('fine',{}).function,'clarify');
});
test('personal activity and why form a conversation; factual questions reset social reference',()=>{
  const core=new AgentCore(domain);turn(core,'iona','What are you doing?');
  const why=turn(core,'iona','Why?');assert.equal(why.plan.social.topic,'activity_reason');assert.match(why.text,/choices/);
  turn(core,'iona','Where is the exchange?');const source=turn(core,'iona','Why?');assert.equal(source.plan.function,'ask_evidence');
});
test('compound wellbeing turns keep disclosures and do not ask a question already answered',()=>{
  const core=new AgentCore(domain);turn(core,'serein','How are you?');
  const r=turn(core,'serein',"I'm doing well, thank you. And you?");
  assert.equal(r.plan.social.userState.value,'positive');assert.equal(r.plan.social.prompt,null);
});
test('social context survives restore, stays private per NPC, and unknown input gets an honest repair',()=>{
  const core=new AgentCore(domain);turn(core,'rill','How are you?');turn(core,'rill',"I'm tired");
  const restored=new AgentCore(domain,core.snapshot());assert.equal(restored.context('rill').social.userState.value,'tired');assert.equal(restored.context('iona').social,undefined);
  const repair=turn(restored,'rill','Florbulate the zindles');assert.equal(repair.plan.social.move,'repair');assert.match(repair.text,/what did you mean/i);
  const second=turn(restored,'rill','Blarp?');assert.equal(second.plan.social.repairCount,2);assert.match(second.text,/Long Song/);
});
test('a farewell can be followed by a fresh greeting without erasing factual focus',()=>{
  const core=new AgentCore(domain);turn(core,'serein','Where is the exchange?');const bye=turn(core,'serein','Goodbye');assert.equal(bye.plan.social.topic,'farewell');
  turn(core,'serein','Hello');assert.equal(core.context('serein').social.ended,false);assert.equal(core.context('serein').focus,'exchange');
});
test('longer social turns preserve the check-in, negative disclosure, and closing intent',()=>{
  const core=new AgentCore(domain);turn(core,'rill','Hi, Rill. How are you doing?');
  assert.equal(turn(core,'rill','Not very well. I had a rough conversation earlier.').act.state,'negative');
  assert.equal(turn(core,'rill','Thank you. Now I’ll really say goodbye.').plan.social.topic,'farewell');
});
test('a count question cannot become an unrelated summary and a subordinate when cannot become a schedule query',()=>{
  const core=new AgentCore(domain);
  const count=turn(core,'rill','How many dolphins are in Krillix today?');assert.equal(count.plan.results.length,0);assert.doesNotMatch(count.text,/young, dolphin-governed/);
  const coping=turn(core,'rill','What do you do when you need to clear your head?');assert.notEqual(coping.act.query?.predicate,'starts_at');assert.notEqual(coping.act.reason,'which-time');
});
