import test from 'node:test';
import assert from 'node:assert/strict';
import {createGFParser} from '../dist/languages/en/gf/adapter.mjs';
const resources={entities:{
  moon:{name:'Selenipolis',aliases:['the Moon']},
  pritt:{name:'Alexander Pritt',aliases:['Pritt']},
  aurelipolis:{name:'Aurelipolis'},threnody:{name:'Threnody'},
  mara:{name:'Mara'},mill:{name:'the mill',aliases:['mill']}
},intentQueries:{
  AskPower:{predicate:'power_basis'},
  AskRule:{predicate:'recognized_because'},
  AskPlayers:{predicate:'political_tier',args:{subject:{$var:'subject'},object:'major_player'}}
}};
const parser=createGFParser(resources);
const cases=[
 ['Who are the main players?','AskPlayers','ask_list'],
 ['Why does the Moon have power?','AskPower','ask_reason'],
 ['Why can Pritt rule Aurelipolis?','AskRule','ask_reason'],
 ['Why is Pritt allowed to rule if Aurelipolis denies AI personhood?','AskRule','ask_reason'],
 ['How does Aurelipolis differ from Threnody?','AskCompare','compare'],
 ['Does everyone agree with that?','AskAgreement','ask_consensus'],
 ['Where is Mara?','AskLocation','ask'],
 ['Mara is in the mill.','AssertLocation','assert'],
 ["Mara isn't at the mill.",'DenyLocation','assert'],
 ['How do you know?','AskEvidence','ask_evidence'],
 ['Tell me about the Moon.','AskAbout','ask'],
 ['What do you think of Threnody?','AskOpinion','opinion'],
 ['What rights does Aurelipolis have?','AskRights','ask'],
 ['Where is Pritt from?','AskOrigin','ask'],
 ['Why is Threnody important?','AskReason','ask_reason'],
 ['Thank you!','Thank','thank'],['Hello!','Greet','greet'],
 ['I agree.','Agree','agree'],['I disagree.','Disagree','disagree'],
 ['What time is Mara?','AskTime','ask']
];
for(const [input,constructor,fn] of cases) test(`GF parses and realizes ${constructor}: ${input}`,()=>{
  const result=parser.parse(input);
  assert.equal(result.status,'parsed');
  assert.equal(result.acts[0].function,fn);
  assert.match(result.trees[0],new RegExp(`^${constructor}( |$)`));
  assert.equal(result.trace.engine,'GF');
  // Genuine parser -> abstract tree -> GF linearization -> lexical rendering -> parser.
  const roundtrip=parser.parse(result.trace.canonical[0]);
  assert.equal(roundtrip.status,'parsed');
  assert.deepEqual(roundtrip.acts,result.acts);
});
test('injected semantic query bindings remain outside GF',()=>{
  assert.equal(parser.parse('Why does the Moon have power?').acts[0].query.predicate,'power_basis');
  assert.deepEqual(parser.parse('Who are the main players?').acts[0].query.args,{subject:{$var:'subject'},object:'major_player'});
  assert.deepEqual(parser.parse('Why can Pritt rule Aurelipolis?').acts[0].query,{predicate:'recognized_because',args:{subject:'pritt',object:'aurelipolis'}});
});
test('negative assertion remains explicit, questions remain queries',()=>{
  assert.equal(parser.parse("Mara isn't at the mill").acts[0].content.polarity,false);
  assert.equal(parser.parse('Where is Mara?').acts[0].content,undefined);
});
test('pronouns resolve only through supplied context',()=>{
  assert.equal(parser.parse('Where is she?').status,'needs-context');
  assert.equal(parser.parse('Where is she?',{focus:'mara'}).acts[0].query.args.subject,'mara');
  assert.equal(parser.parse('Where is she?',{referents:{she:['mara','pritt']}}).status,'ambiguous');
});
test('unknown references and unsupported syntax are explicit',()=>{
  assert.equal(parser.parse('Where is Unknown?').status,'unsupported');
  assert.equal(parser.parse('Could you perhaps expound on ancient lunar metaphysics?').status,'unsupported');
  assert.equal(parser.parse('Where is gfentity0?').status,'unsupported');
});
test('ambiguous injected aliases preserve both interpretations',()=>{
  const p=createGFParser({entities:{a:{name:'Sam'},b:{name:'Sam'}}});
  const result=p.parse('Where is Sam?');
  assert.equal(result.status,'ambiguous');
  assert.deepEqual(new Set(result.acts.map(a=>a.query.args.subject)),new Set(['a','b']));
});
test('application grammar accepts another game without recompiling',()=>{
  const p=createGFParser({entities:{'unrelated:dragon/007':{name:'the Copper Dragon'},'elsewhere/42':{name:'the Cave of Glass'}}});
  const result=p.parse('The Copper Dragon is in the Cave of Glass.');
  assert.deepEqual(result.acts[0].content.args,{subject:'unrelated:dragon/007',place:'elsewhere/42'});
});
test('concept aliases do not consume literal grammar terminals',()=>{
  const p=createGFParser({...resources,entities:{...resources.entities,
    major_players:{name:'the major players',aliases:['major players','the main players','main players']},
    power:{name:'power'},rights:{name:'rights'}
  }});
  for(const input of ['Who are the major players?','Who are the main players?',
    'What do you know about the main players?']) {
    const result=p.parse(input);
    assert.equal(result.status,'parsed');
    assert.equal(result.acts[0].function,'ask_list');
    assert.match(result.trees[0],/^AskPlayers$/);
  }
  assert.equal(p.parse('Why does the Moon have power?').acts[0].query.predicate,'power_basis');
  assert.equal(p.parse('What rights does Aurelipolis have?').acts[0].query.predicate,'rights');
});
test('injected rule query can override its syntactic polity argument',()=>{
  const p=createGFParser({...resources,intentQueries:{AskRule:{
    predicate:'recognized_because',args:{object:{$var:'reason'}}
  }}});
  assert.deepEqual(p.parse('Why can Pritt rule Aurelipolis?').acts[0].query,
    {predicate:'recognized_because',args:{subject:'pritt',object:{$var:'reason'}}});
  assert.deepEqual(p.parse('Why is Pritt allowed to rule if Aurelipolis denies AI personhood?').acts[0].query,
    {predicate:'recognized_because',args:{subject:'pritt',object:{$var:'reason'}}});
});
test('RGL location clauses agree with second-person and plural pronouns',()=>{
  const context={speaker:'pritt',focus:'mara'};
  for(const input of ['Where are you?','Where are they?',
    'You are in the mill.','They are at the mill.',
    'You are not in the mill.',"They aren't at the mill.",
    'You have moved to the mill.','They have moved to the mill.']) {
    const result=parser.parse(input,context);
    assert.equal(result.status,'parsed',input);
    assert.deepEqual(parser.parse(result.trace.canonical[0],context).acts,result.acts,input);
  }
  assert.equal(parser.parse('Where is you?',context).status,'unsupported');
  assert.equal(parser.parse('They is in the mill.',context).status,'unsupported');
  assert.equal(parser.linearize('AssertLocation You (Named "gfentity0")',{gfentity0:'the mill'}),'you are at the mill');
});
