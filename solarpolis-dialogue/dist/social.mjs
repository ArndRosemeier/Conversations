// Language- and game-independent social turn policy. No world-state lookup.
const clone = value => structuredClone(value);
export function respondSocial(core, actor, act) {
  const context=core.state.contexts[actor.id];
  const state=context.social??={counts:{},pending:null,lastTopic:null,userState:null,ended:false,repairs:0};
  let topic=act.topic,move;
  if(act.function==='social') move='answer';
  else if(act.function==='greet') {topic='greeting';move='greet';}
  else if(act.function==='farewell') {topic='farewell';move='close';}
  else if(act.function==='disclose'&&['positive','negative','tired','worried','neutral'].includes(act.state)) {topic='user_state';move='acknowledge';}
  else if(act.function==='social_boundary') {topic='boundary';move='respect_boundary';}
  else if(act.function==='clarify'&&act.reason==='unsupported') {topic='repair';move='repair';}
  else if(['agree','accept','reject','disagree'].includes(act.function)&&state.pending==='company') {topic='company';move=['agree','accept'].includes(act.function)?'accept':'decline';}
  else {
    // A factual turn takes priority over an unanswered social question.
    if(!['thank','clarify'].includes(act.function)) {state.pending=null;state.lastTopic=null;}
    return null;
  }
  if(topic==='reciprocal') topic=state.lastTopic==='activity'?'activity':'wellbeing';
  if(topic==='reason') topic=state.lastTopic==='activity'?'activity_reason':state.lastTopic==='interest'?'interest_reason':state.lastTopic==='wellbeing'?'wellbeing_reason':null;
  const known=['greeting','wellbeing','activity','interest','identity','wellbeing_reason','activity_reason','interest_reason','uncertainty','coping','welcome_reason','interest_detail','invitation','greeting_repair','appreciation','user_state','boundary','company','farewell','repair'];
  if(!known.includes(topic)) return null;
  const repeat=(state.counts[topic]??0)>0;
  state.counts[topic]=(state.counts[topic]??0)+1;
  let prompt=null;
  if(act.disclosure)state.userState={value:act.disclosure,learnedAt:core.state.time,source:act.speaker??'player'};
  if(topic==='wellbeing'&&!repeat&&!state.userState&&act.reciprocate!==false) prompt='wellbeing';
  if(topic==='user_state') {state.userState={value:act.state,learnedAt:core.state.time,source:act.speaker??'player'};if(['negative','worried'].includes(act.state)&&act.reciprocate!==false)prompt='company';}
  if(topic==='greeting'&&state.ended) state.ended=false;
  if(topic==='farewell')state.ended=true;
  if(topic==='repair')state.repairs++;
  if(['boundary','company','farewell'].includes(topic))state.pending=null;
  else state.pending=prompt;
  if(!['repair','greeting','uncertainty','coping','welcome_reason','interest_detail','invitation','greeting_repair','appreciation','user_state','boundary','company','farewell'].includes(topic))state.lastTopic=topic.replace(/_reason$/,'');
  const plan={id:core.next('plan'),holder:actor.id,function:'social',results:[],time:core.state.time,
    social:{move,topic,repeat,count:state.counts[topic],reciprocate:act.reciprocate!==false,prompt,self:clone(actor.social??{}),acknowledgeState:act.disclosure??null,userState:clone(state.userState),focus:context.focus??actor.social?.interestTopic??null,repairCount:state.repairs},
    decision:topic==='repair'?"decision.repair":"decision.social-memory"};
  context.turn++;context.lastAct=act.id??plan.id;
  core.state.history.push({id:core.next('turn'),holder:actor.id,time:core.state.time,act:clone(act),plan:clone(plan)});
  return plan;
}
