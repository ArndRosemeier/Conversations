import {seedNumber,validateSeed} from './seed.mjs';
import {assertSemanticAct} from './language-contract.mjs';
import {hearResponse} from './simulation.mjs';

const copy=x=>structuredClone(x);
// A resumable policy, not a scheduler: each next() performs exactly one turn.
export function createNPCConversation(core,languagePort,options={}){
  const {participants,seed=0,occasion=options.day??0,maxTurns=36,topics=[],beforeTurn=()=>{},saved}=options;
  validateSeed(seed);validateSeed(occasion,'occasion');
  if(!Array.isArray(participants)||participants.length<2||participants.length>6||new Set(participants).size!==participants.length||participants.some(id=>!core.domain.characters.some(c=>c.id===id)))throw new Error('Conversation needs 2 to 6 distinct known participants');
  if(!Number.isInteger(maxTurns)||maxTurns<1||maxTurns>1000)throw new Error('Turn budget must be 1..1000');
  for(const topic of topics){if(topic?.function!=='ask'||!topic.query)throw new Error('Topics must be semantic questions');assertSemanticAct(topic,core);}
  const language=()=>typeof languagePort==='function'?languagePort():languagePort;
  if(language()?.bubbleVersion!==1||typeof language().realizeBubble!=='function')throw new Error('Language adapter does not support bubbleVersion 1');
  const identity=JSON.stringify({participants,seed,occasion,maxTurns,topics});
  if(saved&&(saved.version!==1||saved.identity!==identity))throw new Error('Incompatible conversation checkpoint');
  const state=saved?copy(saved.state):{turn:0,draw:0,status:'active',reason:null,queue:[],counts:Object.fromEntries(participants.map(id=>[id,0])),moveCounts:{},last:null,cycle:0,topic:0,lastTheme:null,used:[]};
  const pick=items=>items[seedNumber(seed,occasion,participants,state.draw++)%items.length];
  const actor=id=>core.domain.characters.find(c=>c.id===id);
  const choose=(except=[])=>{
    const candidates=participants.filter(id=>!except.includes(id));
    const min=Math.min(...candidates.map(id=>state.counts[id]));
    return pick(candidates.filter(id=>state.counts[id]<=min+1));
  };
  const queue=(speaker,kind,data={})=>state.queue.push({speaker,kind,...data});
  function planCycle(){
    const first=choose(state.last?[state.last]:[]),other=choose([first]);
    if(!state.turn){queue(first,'greeting',{to:other});queue(other,'wellbeing',{to:first});queue(first,'reciprocal',{to:other});return;}
    const profile=actor(first).profile??{},themes=['reflection'];
    const pursuits=(profile.pursuits??[]).filter(p=>!state.used.includes(JSON.stringify([first,'pursuit',p])));
    if(pursuits.length)themes.push('pursuit');
    if(profile.home&&!state.used.includes(JSON.stringify([first,'home'])))themes.push('home');
    if(state.topic<topics.length)themes.push('fact');
    // Prefer covering supplied questions, interleaved with social exchanges.
    const theme=state.topic<topics.length&&state.cycle%2===0?'fact':pick(themes.filter(t=>t!==state.lastTheme).length?themes.filter(t=>t!==state.lastTheme):themes);
    state.lastTheme=theme;state.cycle++;
    if(theme==='fact'){
      const act=copy(topics[state.topic++]);
      // A resident who already knows the answer volunteers it, rather than asking it.
      if(core.beliefs(first,act.query).length)queue(first,'answer',{to:other,act});
      else {queue(first,'question',{to:other,act});queue(other,'answer',{to:first,act});}
      return;
    }
    if(theme==='pursuit'){
      const pursuit=pick(pursuits);state.used.push(JSON.stringify([first,'pursuit',pursuit]));
      queue(first,'pursuit',{pursuit});queue(other,'pursuit-question',{to:first,pursuit});
      queue(first,'pursuit-answer',{to:other,pursuit});
      queue(choose([first]),'opinion',{to:first,pursuit});
    }else{
      const reflectionTopic=pick(['pace','company','possibility','rest',...profile.bodyKind?['embodiment']:[],...profile.ageGroup?['experience']:[]]);
      state.used.push(JSON.stringify([first,theme]));queue(first,theme,{home:profile.home,reflectionTopic});
      queue(other,`${theme}-response`,{to:first,home:profile.home,reflectionTopic});
    }
  }
  function respond(holder,from,act){
    const original=core.state.contexts[holder],contexts=core.state.npcContexts??={};
    const key=JSON.stringify(['party',...participants,holder]);
    core.state.contexts[holder]=contexts[key]??{focus:null,referents:{},lastQuery:null,lastAct:null,lastResults:[],pendingOffer:null,turn:0};
    try{return core.respond(holder,{...copy(act),speaker:from});}
    finally{contexts[key]=core.state.contexts[holder];core.state.contexts[holder]=original;}
  }
  const conversation={
    get status(){return state.status;},get stopReason(){return state.reason;},get turnCount(){return state.turn;},
    pause(){if(state.status==='active')state.status='paused';},
    resume(){if(state.status==='paused')state.status='active';},
    stop(reason='host-stop'){state.status='stopped';state.reason=reason;state.queue=[];},
    snapshot(){return {version:1,identity,state:copy(state)};},
    next(){
      if(state.status!=='active')return null;
      beforeTurn();
      if(state.turn>=maxTurns){state.status='complete';state.reason='turn-budget';return null;}
      if(!state.queue.length)planCycle();
      const move=state.queue[0],speaker=actor(move.speaker);
      let plan=null;
      if(move.kind==='answer')plan=respond(move.speaker,move.to,move.act);
      const voiceKey=JSON.stringify([move.speaker,move.kind]);
      const semantic={...copy(move),variant:(seedNumber(seed,occasion,participants,voiceKey,'wording')+(state.moveCounts[voiceKey]??0))>>>0,profile:copy(speaker.profile??{}),plan:copy(plan)};
      const pieces=language().realizeBubble(semantic,copy(speaker));
      if(!Array.isArray(pieces)||!pieces.length||pieces.some(s=>typeof s!=='string'||!s.trim()||Array.from(s).length>90))throw new Error('Bubble contract: expected nonempty pieces of at most 90 Unicode code points');
      const exchanges=[];
      if(plan?.results?.length){
        // Transmit exactly the evidence rendered, to all listeners as testimony.
        // Never silently promote spoken claims to verified publications.
        for(const listener of participants.filter(id=>id!==move.speaker)){
          const reports=hearResponse(core,move.speaker,listener,plan);
          exchanges.push({from:move.speaker,to:listener,reports:reports.map(e=>e.id)});
        }
        const evidence=copy(plan.results[0].primary);
        state.queue.push({speaker:move.to,kind:'source-question',to:move.speaker});
        state.queue.push({speaker:move.speaker,kind:'source',to:move.to,evidence});
        state.queue.push({speaker:choose([move.speaker]),kind:'acknowledge',to:move.speaker});
      }else if(move.kind==='answer')state.queue.push({speaker:move.to,kind:'unknown-response',to:move.speaker});
      state.queue.shift();state.turn++;state.counts[move.speaker]++;state.moveCounts[voiceKey]=(state.moveCounts[voiceKey]??0)+1;state.last=move.speaker;
      if(state.turn>=maxTurns){state.status='complete';state.reason='turn-budget';}
      return {index:state.turn-1,speaker:move.speaker,to:move.to,kind:move.kind,act:copy(move.act??null),plan:copy(plan),pieces:[...pieces],text:pieces.join(' '),time:core.state.time,exchanges};
    }
  };
  return conversation;
}
