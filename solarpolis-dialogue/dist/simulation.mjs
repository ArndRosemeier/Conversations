// A bounded conversation policy over semantic acts, not an authored transcript.
// Language is an injected port. The host supplies participants and a topic goal.
const copy=value=>structuredClone(value);
import {createNPCConversation} from './group-conversation.mjs';
export {createNPCConversation};
const sameAtom=(a,b)=>a.predicate===b.predicate&&(a.polarity??true)===(b.polarity??true)&&Object.keys(a.args).length===Object.keys(b.args).length&&Object.entries(a.args).every(([k,v])=>b.args[k]===v);
function peerContext(core,holder,peer,run){
  const playerContext=core.state.contexts[holder];
  const contexts=core.state.npcContexts??={};
  const key=`${holder}|${peer}`;
  core.state.contexts[holder]=contexts[key]??{focus:null,lastQuery:null,lastAct:null,turn:0};
  try{return run();}finally{contexts[key]=core.state.contexts[holder];core.state.contexts[holder]=playerContext;}
}
export function hearResponse(core,sender,receiver,plan){
  // Check speaker ownership, but never choose a reply by consulting another mind.
  const owned=core.beliefs(sender);
  const spoken=plan.results.map(g=>{
    const actual=owned.find(o=>o.primary.id===g.primary.id)?.primary;
    if(!actual||!sameAtom(actual.atom,g.primary.atom))throw new Error('A speaker cannot transmit evidence it does not hold');
    return actual;
  });
  return spoken.map(e=>{
    const report={id:core.next('evidence'),holder:receiver,atom:copy(e.atom),aboutTime:e.aboutTime,learnedAt:core.state.time,
      certainty:'reported',source:{kind:'testimony',speaker:sender,labelKey:'source.testimony',upstream:e.id},
      origin:{kind:'testimony',speaker:sender},supports:[e.id]};
    core.state.evidence.push(report);return report;
  });
}
export function sharePublication(core,sender,receiver,evidence){
  const held=core.state.evidence.find(e=>e.id===evidence.id&&e.holder===sender&&e.source.shareable);
  if(!held||!sameAtom(held.atom,evidence.atom))return null;
  evidence=held;
  return core.observe(receiver,{id:evidence.id,atom:copy(evidence.atom),validFrom:evidence.aboutTime,origin:copy(evidence.origin)},
    {kind:'shared-publication',label:evidence.source.label,labelKey:evidence.source.labelKey,shareable:true,speaker:sender,upstream:evidence.id});
}
export function simulateNPCConversation(core,language,options){
  if(options.mode==='ambient'){
    const conversation=createNPCConversation(core,language,{...options,participants:options.participants??[options.initiator,options.partner],topics:options.topics??(options.goal?[options.goal]:[])});
    const turns=[];let turn;while((turn=conversation.next()))turns.push(turn);
    return {turns,exchanges:turns.flatMap(t=>t.exchanges),stopReason:conversation.stopReason};
  }
  const {initiator,partner,goal,maxTurns=10}=options;
  if(!Number.isInteger(maxTurns)||maxTurns<2||maxTurns>20)throw new Error('Conversation turn budget must be between 2 and 20');
  const actors=new Map(core.domain.characters.map(c=>[c.id,c]));
  if(!actors.has(initiator)||!actors.has(partner)||initiator===partner)throw new Error('Choose two different known participants');
  if(goal?.function!=='ask'||!goal.query)throw new Error('A conversation needs a semantic question goal');
  const turns=[],exchanges=[];
  function emit(speaker,act,plan,text){if(turns.length>=maxTurns)return false;turns.push({speaker,act:copy(act),plan:plan?copy(plan):null,text,time:core.state.time});return true;}
  function answer(holder,from,act){
    if(turns.length>=maxTurns)return null;
    const plan=peerContext(core,holder,from,()=>core.respond(holder,{...copy(act),speaker:from}));
    emit(holder,act,plan,language.realize(plan,actors.get(holder)));return plan;
  }
  const opening={function:'social',topic:'wellbeing'};
  emit(initiator,opening,null,language.npcLine('opening',actors.get(initiator),{partner:language.name(partner)}));
  const welcome=answer(partner,initiator,opening);
  if(welcome?.social?.prompt==='wellbeing')answer(initiator,partner,{function:'social',topic:'wellbeing',reciprocate:false});
  if(!emit(initiator,goal,null,language.npcLine('question',actors.get(initiator),{question:language.label(goal)})))return {turns,exchanges,stopReason:'turn-budget'};
  const response=answer(partner,initiator,goal);
  if(!response)return {turns,exchanges,stopReason:'turn-budget'};
  const reports=hearResponse(core,partner,initiator,response);
  if(reports.length){
    const sourceAct={function:'ask_evidence',query:copy(goal.query)};
    if(!emit(initiator,sourceAct,null,language.npcLine('source',actors.get(initiator),{})))return {turns,exchanges,stopReason:'turn-budget'};
    const source=answer(partner,initiator,sourceAct);
    if(!source)return {turns,exchanges,stopReason:'turn-budget'};
    const shares=source.results.map(g=>sharePublication(core,partner,initiator,g.primary)).filter(Boolean);
    exchanges.push({from:partner,to:initiator,reports:reports.map(e=>e.id),verified:shares.map(e=>e.id)});
    const hasConflict=core.beliefs(initiator,goal.query).some(g=>g.conflict);
    const key=shares.length?'verified':hasConflict?'conflict':'reported';
    emit(initiator,{function:'acknowledge',status:key},null,language.npcLine(key,actors.get(initiator),{}));
  }else emit(initiator,{function:'acknowledge',status:'unknown'},null,language.npcLine('unknown',actors.get(initiator),{}));
  const closed=answer(partner,initiator,{function:'farewell'});
  return {turns,exchanges,stopReason:closed?'goal-complete':'turn-budget'};
}
