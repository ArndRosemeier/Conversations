// Bounded English constructions over injected domain vocabulary. Parsing never reads world truth.
const normalized=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const ask=(predicate,args)=>({function:'ask',query:{predicate,args}});
const verify=(predicate,args,polarity=true)=>({function:'verify',content:{predicate,args,polarity}});
export function interpretMeaning(language,raw,context){
  let text=normalized(raw).replace(/[.!?]+$/,'');
  text=text.replace(/^(?:changing subject|actually,? one last question|sorry,? i was unclear)[: ,]+/,'')
    .replace(/^(?:before i go|actually|ah)[:, ]+/,'')
    .replace(/^(?:and |then |so )/,'').replace(/^(?:please |could you |can you )(?=tell|describe|explain)/,'');
  const cfg=language.r.meaning??{},mentions=language.mentionsIn(text),ids=mentions.map(m=>m.id);
  const focus=ids[0]??context.focus,person=context.speaker;
  const social=topic=>({function:'social',topic});
  if(/\bwere you talking about\b/.test(text)&&ids.length===1)return {function:'confirm_reference',subject:ids[0]};
  if(/^(?:i see|that answers it)$/.test(text))return {function:'thank'};
  if(/^(?:this has been (?:lovely|nice)|i like that you|you sound as if you enjoy|i enjoy (?:the sound|hearing))\b/.test(text))return social('appreciation');
  if(/^(?:i(?:'ll| will) leave you|i(?:'m| am) off now|i think i(?:'m| am) ready to (?:go|leave|wander))\b/.test(text))return {function:'farewell'};
  if(/\b(?:home for you|where (?:is|was) (?:your )?home|where are you from)\b/.test(text)&&cfg.homes?.[person])return ask('nature',{subject:cfg.homes[person]});
  if(/\b(?:what draws you|what attracts you|why you enjoy)\b/.test(text))return social('interest_reason');
  if(/\b(?:you yourself govern|do you govern)\b/.test(text)&&cfg.identity)return verify(cfg.identity.predicate,{subject:person,object:cfg.identity.governor});
  if(/\b(?:source for|source of|where did .+ information|what are you going by)\b/.test(text))return {function:'ask_evidence'};
  if(/\b(?:haven't|have not) (?:seen|read) (?:any |a |the )?(?:notice|source|bulletin)\b/.test(text))return {function:'qualify_report',verification:'not_observed'};
  if(/\bwhat would (?:have to happen|you need)\b/.test(text)&&/\b(?:confirm|confirmed|verify|verified)\b/.test(text))return {function:'evidence_requirements'};
  if(/\b(?:reservation|booking|slot)\b/.test(text)&&/^(?:do you know whether|is|has|does)\b/.test(text))return ask('reservation',{subject:ids.find(id=>language.r.entities[id]?.type==='ship')??context.focus??cfg.defaultShip});
  if(/^(?:how many|could you count|can you count)\b/.test(text)&&!ids.length)return {function:'ask_count_unknown'};
  if(/\b(?:what is .+ like|what can you tell me about .+ itself)\b/.test(text)&&ids.length===1)return ask(undefined,{subject:ids[0]});
  if(/\bsanctuary\b/.test(text)&&ids.length)return ask('sanctuary',{subject:ids[0]});
  if(/\b(?:meant to be|purpose|what (?:is|does) .+ for)\b/.test(text)&&ids.length)return ask('purpose',{subject:ids[0]});
  if(/\burgency\b/.test(text)&&context.focus)return ask('practice',{subject:context.focus});
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
  if(/\b(?:your favorite subject|your favourite subject)\b/.test(text)&&ids.some(id=>cfg.personalTopics?.[person]?.includes(id)))return social('interest');
  if(/^(?:i'd|i would) like to (?:return|come back) to .+ (?:another time|later)$/.test(text))return {function:'social_boundary'};
  if(/^(?:can|could|would) you (?:check|verify) (?:that|my (?:statement|claim|report))(?: against .+)?$/.test(text))return {function:'check_report'};
  if(/^please (?:keep|remember) my .+(?:report|statement)$/.test(text))return {function:'remember_report'};
  if(/^(?:could|can) you estimate\b/.test(text)&&context.lastQuery?.predicate==='numeric_count')return {...ask('numeric_count',context.lastQuery.args),estimateRequested:true};
  if(/^who (?:helps|welcomes) arrivals\b/.test(text)&&cfg.welcoming)return ask(cfg.welcoming.predicate,{subject:{$var:'person'}});
  if(/\b(?:same (?:person|individual)|same as|are you (?:the )?(?:governing )?mind)\b/.test(text)&&cfg.identity){
    const subject=/\b(?:are you|you the same)\b/.test(text)?person:/\bthat person\b/.test(text)?context.focus:ids.find(id=>id!==cfg.identity.governor);
    if(subject)return verify(cfg.identity.predicate,{subject,object:cfg.identity.governor});
  }
  if(/\b(?:governs?|rules?)\b/.test(text)&&/\b(?:whole|entire)\b/.test(text)){
    const region=ids.find(id=>language.r.entities[id]?.type==='region')??ids.at(-1);
    const governor=ids.find(id=>id!==region)??context.focus;
    if(region&&governor)return verify('governed_by',{subject:region,object:governor});
  }
  if(cfg.consent&&/\b(?:copying|copies|copy)\b/.test(text)&&/\b(?:mind|minds|consent)\b/.test(text)){
    const {subject,scope}=cfg.consent;
    if(/\b(?:norm|taboo|ordinary practice)\b/.test(text)){
      if(/^(?:i heard|someone (?:said|told me)|i was told)\b/.test(text)){
        // Scope is part of the proposition. Never silently turn "everywhere" into "most habitats".
        if(!/\bmost habitats\b/.test(text))return {function:'clarify',reason:'unsupported'};
        const value=/\btaboo\b/.test(text)?'taboo':'ordinary practice';
        return {function:'assert',content:{predicate:'norm_status',args:{subject,scope,value},polarity:!/\b(?:not|isn't)\b/.test(text)}};
      }
      return ask('norm_status',{subject,scope});
    }
  }
  if(cfg.travel&&/\b(?:array|arrays|operator)\b/.test(text)&&/\b(?:trip|travel|journey|ship)\b/.test(text)&&/^(?:why|how)\b/.test(text)){
        return {function:'ask_reason',query:{anyOf:[{predicate:'requires',args:{subject:cfg.travel.supportSubjects[0],object:cfg.travel.subject}},{predicate:'enables',args:{subject:cfg.travel.subject}},{predicate:'controls',args:{subject:cfg.travel.subject}},{predicate:'constrained_by',args:{subject:cfg.travel.supportSubjects[1]}}]}};
  }
  if(cfg.travelRoles&&ids.includes(cfg.travelRoles.windows)&&ids.includes(cfg.travelRoles.braking)&&/\bboth matter\b/.test(text))
    return {function:'ask',query:{anyOf:[{predicate:'constrained_by',args:{object:cfg.travelRoles.windows}},{predicate:'controls',args:{object:cfg.travelRoles.braking}}]}};
  if(/^(?:what makes|why is|how is)\b/.test(text)&&/\b(?:influential|powerful|influence)\b/.test(text)&&focus)return {function:'ask_reason',query:{predicate:'power_basis',args:{subject:focus}}};
  if(/\bhow many\b/.test(text)){
    const place=ids.find(id=>['place','polity','body','region'].includes(language.r.entities[id]?.type));
    if(place)return ask('numeric_count',{subject:place,...(ids.find(id=>id!==place)?{object:ids.find(id=>id!==place)}:{})});
  }
  if(/\bwho (?:may|can|is allowed to) enter\b/.test(text)&&focus)return {function:'ask_access',query:{args:{subject:focus},anyOf:[{predicate:'preserves_as'},{predicate:'access_status'}]}};
  if(/\b(?:neural interface|interface)\b/.test(text)&&/\b(?:cue|cues|whistle|translate|translation)\b/.test(text)&&cfg.interfaceTopic)return ask('nature',{subject:cfg.interfaceTopic});
  if(/^(?:where is|where's) (?:it|that)(?: being held)?$/.test(text))return context.focus?ask('located_at',{subject:context.focus}):{function:'clarify',reason:'missing-context'};
  // Explicit topic introduction is different from an arbitrary question containing a known noun.
  const introduction=/^i (?:mean|meant) (.+)$/.exec(text);
  if(introduction&&ids.length===1)return {function:'set_topic',subject:ids[0]};
  if(/^(?:tell me (?:something you (?:do )?know )?about|could i hear about|what do you know about|describe|about)\b/.test(text)&&ids.length===1)return ask(undefined,{subject:ids[0]});
  if(/^(?:is|does|do|can|could|would|who|what|why|how|where|when|tell|explain|describe)\b/.test(text))return null;
  // Preserve uncertainty as testimony when its actual proposition is supported by the schema.
  if(/^(?:someone told me|i heard that)\b/.test(text)&&/\bwelcomes? (?:every|all) arrivals?\b/.test(text))return {function:'assert',content:{predicate:'welcomes_every_arrival',args:{subject:cfg.identity.governor},polarity:true}};
  return null;
}

export function splitTurn(raw){
  const chunks=raw.trim().split(/(?<=[.!?])\s+(?=[A-Za-z])|,?\s+and\s+(?=(?:what|how|where|who|why|when)\b)/i).filter(Boolean);
  return chunks.length>1&&chunks.length<=6?chunks:null;
}
