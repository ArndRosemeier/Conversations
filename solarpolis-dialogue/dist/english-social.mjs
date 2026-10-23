// Bounded English social constructions. Full utterance matching prevents a
// greeting embedded in a factual statement from swallowing that statement.
export function interpretSocial(raw,context={},entities={}) {
  const text=raw.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'');
  let body=text.replace(/^(?:hi|hello|hey|good (?:morning|afternoon|evening))(?: there)?[!,.: ]+/, '');
  if(body!==text){
    const names=Object.values(entities).filter(e=>e.type==='person').flatMap(e=>[e.name,...(e.aliases??[])]).sort((a,b)=>b.length-a.length);
    for(const name of names){
      if(body===name.toLowerCase())return {function:'greet'};
      if(body.startsWith(name.toLowerCase())&&/^[,.:! ]/.test(body.slice(name.length))){body=body.slice(name.length).replace(/^[,.:! ]+/,'');break;}
    }
    if(!body)return {function:'greet'};
  }
  // A check-in can carry both a disclosure and a reciprocal question.
  const parts=body.split(/[.!?]+\s*/).filter(Boolean);
  if(parts.length>1&&parts.length<=5){
    const parsed=parts.map(p=>interpretSocial(p,context,entities));
    const last=parsed.at(-1),first=parsed[0];
    const phatic=p=>/^(?:thanks(?: for (?:asking|sorting that out|the help))?|thank you|i appreciate the help|all right|anyway[, ]*(?:hello|hi)(?: again)?|i'm listening, and glad you're here|i enjoyed hearing about .+)$/.test(p);
    if(last?.function==='farewell'&&parts.slice(0,-1).every((p,i)=>parsed[i]||phatic(p)))return last;
    if(last?.function==='social'&&parts.slice(0,-1).every((p,i)=>parsed[i]||phatic(p)||/^.+ (?:sounds|sound) like .+$/.test(p)))return {...last,...(first?.function==='disclose'?{disclosure:first.state}:{})};
    if(first?.function==='disclose'&&parts.slice(1).every(p=>/^i (?:had|feel|need|want)\b/.test(p)||/new to me$/.test(p)))return {...first,detail:parts.slice(1).join('. ')};
    if(parts.length===2&&phatic(parts[0])&&last)return last;
  }
  if(parts.length===2){
    const first=interpretSocial(parts[0],context,entities),second=interpretSocial(parts[1],context,entities);
    if(first?.function==='disclose'&&second?.function==='social')return {...second,disclosure:first.state};
    if(first?.function==='disclose'&&second?.function==='thank')return first;
  }
  if(context.social?.pending==='company'&&/^(?:yes|yeah|sure|please|okay|ok)(?:[, ]+(?:please|thanks))?$/.test(body))return {function:'accept'};
  if(context.social?.pending==='company'&&/^(?:no|no thanks|not now|no thank you)$/.test(body))return {function:'reject'};
  if(/^and (?:how are you|how about you|what about you)$/.test(body))return {function:'social',topic:'reciprocal'};
  if(/^(?:how (?:are|r) you(?: doing| feeling)?(?: today| now)?|how are things|how (?:has|is) your day (?:been|going)|how has yours been|how's (?:it going|your day(?: going)?)|how is (?:it going|your day(?: going)?)|you (?:doing )?(?:okay|ok|alright)|are you (?:okay|ok|alright))$/.test(body))return {function:'social',topic:'wellbeing'};
  if(/^(?:what (?:are you|have you been) (?:doing|up to|studying)(?: today| now| lately)?|(?:could|can) you tell me what you have been (?:studying|doing)(?: lately)?|what are you working on|what keeps you busy)$/.test(body))return {function:'social',topic:'activity'};
  if(/^(?:what (?:do you (?:like|enjoy)(?: doing)?|interests you)|what are you interested in|(?:do you )?(?:have|got) any hobbies|what do you do for fun)$/.test(body))return {function:'social',topic:'interest'};
  if(/^(?:who are you|tell me about yourself)$/.test(body))return {function:'social',topic:'identity'};
  if(/^(?:(?:and |what |how )?about you|and you|you)$/.test(body))return {function:'social',topic:'reciprocal'};
  if(/^(?:why|how come|why is that|what do you (?:like|enjoy) about (?:it|that|them)|what makes (?:it|that) interesting|what about (?:it|that))$/.test(body)&&context.social?.lastTopic)return {function:'social',topic:'reason'};
  if(/^(?:i (?:don't|do not|would rather not|don't want to) (?:want to )?talk about (?:it|that)|can we (?:change the subject|talk about something else)|let's (?:change the subject|not talk about it))$/.test(body))return {function:'social_boundary'};
  if(/^(?:bye|goodbye(?: for now)?|see you(?: later)?|talk (?:to you )?later|i (?:have to|must|should) go(?: now)?|gotta go|good night|now i'll really say goodbye|i should let you get back to your day)$/.test(body))return {function:'farewell'};
  if(/^goodbye,? /.test(body)&&Object.values(entities).some(e=>e.type==='person'&&[e.name,...(e.aliases??[])].some(n=>body.endsWith(n.toLowerCase()))))return {function:'farewell'};
  let disclosure=body.replace(/^(?:i'm|i am|i feel|i'm feeling|i am feeling) /,'').replace(/^(?:doing|feeling) /,'').replace(/(?:[, ]+(?:thanks|thank you))?(?:[, .]+(?:and you|how about you|what about you))?$/,'').replace(/, (?:but glad to listen|honestly|just passing the time)$/,'');
  const moods={positive:/^(?:(?:very|pretty|really|quite) )?(?:good|well|great|fine|happy|peaceful|alright|all right|okay|ok|better)(?: today)?$/,negative:/^(?:(?:not|not so|not very) (?:good|well|great|fine|okay|ok)|bad|awful|miserable|sad|having a bad day)(?: today)?$/,tired:/^(?:(?:very|pretty|really|a bit|a little|so) )?(?:tired|sleepy|exhausted|worn out)(?: today)?$/,worried:/^(?:(?:very|pretty|really|a bit|a little|so) )?(?:worried|unsettled|anxious|nervous|stressed)(?: today)?$/,neutral:/^(?:so-so|so so|same as usual|not bad)$/};
  for(const [state,pattern] of Object.entries(moods))if(pattern.test(disclosure)&&(/^(?:i'm|i am|i feel)/.test(body)||context.social?.pending==='wellbeing'||(context.social?.lastTopic==='wellbeing'&&/^(?:doing|feeling|pretty|quite|a (?:bit|little)|not)\b/.test(body)))){
    if(/(?:and you|how about you|what about you)$/.test(body))return {function:'social',topic:'wellbeing',disclosure:state};
    return {function:'disclose',state};
  }
  return null;
}
export function realizeSocial(plan,resources,name) {
  const social=plan.social,voice=resources;
  if(!voice)return 'I lost the thread there. What did you mean?';
  const topic=social.topic;
  if(topic==='user_state')return voice.responses[social.userState.value];
  if(topic==='repair')return (social.repairCount>1?voice.repairAgain:voice.repair).replace('{topic}',name(social.focus));
  if(topic==='company')return voice[social.move==='accept'?'company':'boundary'];
  if(topic==='boundary')return voice.boundary;
  if(topic==='farewell')return voice.farewell;
  if(topic==='greeting')return social.repeat?voice.greetingAgain:voice.greeting;
  const lines=voice[topic];
  let text=Array.isArray(lines)?lines[social.repeat?1:0]:lines;
  if(!text)return voice.repair.replace('{topic}',name(social.focus));
  if(social.acknowledgeState)text=(voice.acknowledgments?.[social.acknowledgeState]??'Thank you for telling me. ')+text;
  if(social.prompt==='wellbeing')text+=' '+voice.returnQuestion;
  return text;
}
export function realizeEvidence(plan,actor,resources,language){
  if(!resources||!plan.results.length||plan.results.some(g=>g.primary.proof||g.derivations?.length))return null;
  return plan.results.map(g=>{
    const e=g.primary;
    const template=e.certainty==='reported'?resources.testimony:resources.sourceReply;
    const source=e.certainty==='reported'||/^(?:the|your|my|our)\b/i.test(e.source.label)?e.source.label:`the ${e.source.label}`;
    return template.replace('{source}',source).replace('{claim}',language.clause(e)).replace('{time}',language.clock(e.aboutTime));
  }).join(' ');
}
