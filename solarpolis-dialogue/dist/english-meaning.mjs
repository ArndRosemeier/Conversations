// Bounded English constructions over injected domain vocabulary. Parsing never reads world truth.
const normalized=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const ask=(predicate,args)=>({function:'ask',query:{predicate,args}});
const verify=(predicate,args,polarity=true)=>({function:'verify',content:{predicate,args,polarity}});
export function normalizeMeaning(raw){
  let text=normalized(raw).replace(/[.!?]+$/,'');
  text=text.replace(/^(?:changing subject|actually,? one last question|sorry,? i was unclear)[: ,]+/,'')
    .replace(/^(?:before i go|actually|ah)[:, ]+/,'')
    .replace(/^(?:and |then |so )/,'').replace(/^(?:please |could you |can you )(?=tell|describe|explain)/,'');
  return text;
}
export function interpretMeaning(language,raw,context){
  const text=normalizeMeaning(raw),mentions=language.mentionsIn(text),ids=mentions.map(m=>m.id);
  const focus=ids[0]??context.focus;
  const social=topic=>({function:'social',topic});
  if(/\bwere you talking about\b/.test(text)&&ids.length===1)return {function:'confirm_reference',subject:ids[0]};
  if(/^(?:i see|that answers it)$/.test(text))return {function:'thank'};
  if(/^(?:this has been (?:lovely|nice)|i like that you|you sound as if you enjoy|i enjoy (?:the sound|hearing))\b/.test(text))return social('appreciation');
  if(/^(?:i(?:'ll| will) leave you|i(?:'m| am) off now|i think i(?:'m| am) ready to (?:go|leave|wander))\b/.test(text))return {function:'farewell'};
  if(/\b(?:what draws you|what attracts you|why you enjoy)\b/.test(text))return social('interest_reason');
  if(/\b(?:source for|source of|where did .+ information|what are you going by)\b/.test(text))return {function:'ask_evidence'};
  if(/\b(?:haven't|have not) (?:seen|read) (?:any |a |the )?(?:notice|source|bulletin)\b/.test(text))return {function:'qualify_report',verification:'not_observed'};
  if(/\bwhat would (?:have to happen|you need)\b/.test(text)&&/\b(?:confirm|confirmed|verify|verified)\b/.test(text))return {function:'evidence_requirements'};
  if(/^(?:how many|could you count|can you count)\b/.test(text)&&!ids.length)return {function:'ask_count_unknown'};
  if(/\b(?:what is .+ like|what can you tell me about .+ itself)\b/.test(text)&&ids.length===1)return ask(undefined,{subject:ids[0]});
  if(/\bsanctuary\b/.test(text)&&ids.length)return ask('sanctuary',{subject:ids[0]});
  if(/\b(?:meant to be|purpose|what (?:is|does) .+ for)\b/.test(text)&&ids.length)return ask('purpose',{subject:ids[0]});
  if(/^(?:is|are)\b/.test(text)){
    const target=ids.find(id=>!['place'].includes(language.r.entities[id]?.type));
    const place=ids.find(id=>language.r.entities[id]?.type==='place')??(/\bthere\b/.test(text)?context.lastPlace:null);
    if(target&&place)return verify('located_at',{subject:target,place},!/\bnot\b/.test(text));
  }
  if(/^(?:i (?:may|might) (?:have heard wrong|be mixing up .+)|a bit confusing)$/.test(text))return social('uncertainty');
  if(/^(?:is that (?:right|true|correct)|really)$/.test(text))return context.lastReportId||context.lastProposition?{function:'check_report'}:{function:'clarify',reason:'missing-context'};
  if(/^(?:all right|thanks(?: for .+)?|thank you|i appreciate the help)$/.test(text))return {function:'thank'};
  if(/^(?:i meant .+ as a friendly greeting|i was (?:just )?(?:saying hello|being friendly))\b/.test(text))return social('greeting_repair');
  if(/^(?:i (?:enjoyed|enjoy) hearing about|that sounds (?:kind|interesting|lovely))\b/.test(text))return social('appreciation');
  if(/^(?:would you rather|do you want to|would you like to) (?:keep |continue )?(?:talk|talking)\b/.test(text))return social('invitation');
  if(/^what do you (?:usually )?do when\b/.test(text))return social('coping');
  if(/^what (?:brings|makes|led) you to (?:welcome|help)\b/.test(text))return social('welcome_reason');
  if(/^(?:what does (?:that|it) mean to you|you explore .+)$/.test(text)&&context.social?.lastTopic)return social('interest_detail');
  if(/^(?:i'd|i would) like to (?:return|come back) to .+ (?:another time|later)$/.test(text))return {function:'social_boundary'};
  if(/^(?:can|could|would) you (?:check|verify) (?:that|my (?:statement|claim|report))(?: against .+)?$/.test(text))return {function:'check_report'};
  if(/^please (?:keep|remember) my .+(?:report|statement)$/.test(text))return {function:'remember_report'};
  if(/^(?:could|can) you estimate\b/.test(text)&&context.lastQuery?.predicate==='numeric_count')return {...ask('numeric_count',context.lastQuery.args),estimateRequested:true};
  if(/\b(?:governs?|rules?)\b/.test(text)&&/\b(?:whole|entire)\b/.test(text)){
    const region=ids.find(id=>language.r.entities[id]?.type==='region')??ids.at(-1);
    const governor=ids.find(id=>id!==region)??context.focus;
    if(region&&governor)return verify('governed_by',{subject:region,object:governor});
  }
  if(/^(?:what makes|why is|how is)\b/.test(text)&&/\b(?:influential|powerful|influence)\b/.test(text)&&focus)return {function:'ask_reason',query:{predicate:'power_basis',args:{subject:focus}}};
  if(/\bhow many\b/.test(text)){
    const place=ids.find(id=>['place','polity','body','region'].includes(language.r.entities[id]?.type));
    if(place)return ask('numeric_count',{subject:place,...(ids.find(id=>id!==place)?{object:ids.find(id=>id!==place)}:{})});
  }
  if(/\bwho (?:may|can|is allowed to) enter\b/.test(text)&&focus)return {function:'ask_access',query:{args:{subject:focus},anyOf:[{predicate:'preserves_as'},{predicate:'access_status'}]}};
  if(/^(?:where is|where's) (?:it|that)(?: being held)?$/.test(text))return context.focus?ask('located_at',{subject:context.focus}):{function:'clarify',reason:'missing-context'};
  // Explicit topic introduction is different from an arbitrary question containing a known noun.
  const introduction=/^i (?:mean|meant) (.+)$/.exec(text);
  if(introduction&&ids.length===1)return {function:'set_topic',subject:ids[0]};
  if(/^(?:tell me (?:something you (?:do )?know )?about|could i hear about|what do you know about|describe|about)\b/.test(text)&&ids.length===1)return ask(undefined,{subject:ids[0]});
  if(/^(?:is|does|do|can|could|would|who|what|why|how|where|when|tell|explain|describe)\b/.test(text))return null;
  return null;
}

export function splitTurn(raw){
  const chunks=raw.trim().split(/(?<=[.!?])\s+(?=[A-Za-z])|,?\s+and\s+(?=(?:what|how|where|who|why|when)\b)/i).filter(Boolean);
  return chunks.length>1&&chunks.length<=6?chunks:null;
}
