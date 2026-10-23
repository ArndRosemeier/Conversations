import test from 'node:test';
import assert from 'node:assert/strict';
import {AgentCore} from '../dist/core.mjs';
import {domain,scenario} from '../dist/solarpolis.mjs';
import {EnglishLanguage} from '../dist/english.mjs';
import {resources} from '../dist/solarpolis-en.mjs';
import {simulateNPCConversation,hearResponse,sharePublication} from '../dist/simulation.mjs';
const language=new EnglishLanguage(resources),goal=scenario.starterQueries[0].act;
test('NPC dialogue reads current beliefs, shares a real amendment, and preserves player context',()=>{
  const core=new AgentCore(domain);core.respond('iona',{function:'ask',query:{args:{subject:'selenipolis'}}});const before=core.context('iona');
  core.advance(1);core.applyEvent(domain.events.venue);
  const world=structuredClone(core.state.world);
  const dialogue=simulateNPCConversation(core,language,{initiator:'iona',partner:'serein',goal});
  assert.equal(dialogue.stopReason,'goal-complete');assert.ok(dialogue.turns.length<=10);
  assert.match(dialogue.turns.find(t=>t.speaker==='serein'&&t.plan?.query?.predicate==='located_at').text,/Current Court/);
  assert.ok(dialogue.exchanges[0].verified.length);assert.equal(core.beliefs('iona',goal.query)[0].primary.atom.args.place,'current_court');
  assert.deepEqual(core.context('iona'),before);assert.deepEqual(core.state.world,world);
  for(const turn of dialogue.turns)assert.doesNotMatch(turn.text,/\{\w+\}|undefined|specific question|suggested questions/);
});
test('an uninformed speaker stays uninformed even when world truth differs',()=>{
  const core=new AgentCore(domain);core.advance(1);core.applyEvent(domain.events.venue);
  const result=simulateNPCConversation(core,language,{initiator:'rill',partner:'iona',goal});
  const answer=result.turns.find(t=>t.speaker==='iona'&&t.plan?.query?.predicate==='located_at');
  assert.match(answer.text,/Echo Gallery/);assert.doesNotMatch(answer.text,/Current Court/);assert.equal(result.exchanges[0].verified.length,0);
});
test('testimony preserves event time and source, and cannot be forged or promoted to a publication',()=>{
  const core=new AgentCore(domain);core.advance(2);
  const plan=core.respond('serein',goal),report=hearResponse(core,'serein','iona',plan)[0];
  assert.equal(report.source.speaker,'serein');assert.equal(report.certainty,'reported');assert.equal(report.aboutTime,0);assert.equal(report.learnedAt,2);
  assert.equal(sharePublication(core,'serein','iona',report),null);
  assert.throws(()=>hearResponse(core,'rill','iona',{results:[{primary:{...plan.results[0].primary,id:'forged'}}]}));
  const forged={...plan.results[0].primary,atom:{predicate:'located_at',args:{subject:'exchange',place:'current_court'}}};
  assert.throws(()=>hearResponse(core,'serein','iona',{results:[{primary:forged}]}));
});
test('a small turn budget terminates, and participant/goal validation precedes dialogue',()=>{
  const core=new AgentCore(domain);const result=simulateNPCConversation(core,language,{initiator:'iona',partner:'serein',goal,maxTurns:2});assert.equal(result.stopReason,'turn-budget');assert.equal(result.turns.length,2);
  assert.throws(()=>simulateNPCConversation(core,language,{initiator:'iona',partner:'iona',goal}));
  assert.throws(()=>simulateNPCConversation(core,language,{initiator:'iona',partner:'serein',goal:{function:'assert'}}));
});
