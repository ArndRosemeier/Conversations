// Solarpolis-only English constructions. Injected by its language package.
import {normalizeMeaning} from './english-meaning.mjs';
const ask=(predicate,args)=>({function:'ask',query:{predicate,args}});
const verify=(predicate,args,polarity=true)=>({function:'verify',content:{predicate,args,polarity}});
export function interpretSolarpolis(language,raw,context){
  const text=normalizeMeaning(raw);
  const cfg=language.r.meaning??{},ids=language.mentionsIn(text).map(m=>m.id),person=context.speaker;
  const social=topic=>({function:'social',topic});
  if(/\b(?:reservation|booking|slot)\b/.test(text)&&/^(?:do you know whether|is|has|does)\b/.test(text))return ask('reservation',{subject:ids.find(id=>language.r.entities[id]?.type==='ship')??context.focus??cfg.defaultShip});
  if(/\burgency\b/.test(text)&&context.focus)return ask('practice',{subject:context.focus});
  if(/\b(?:home for you|where (?:is|was) (?:your )?home|where are you from)\b/.test(text)&&cfg.homes?.[person])return ask('nature',{subject:cfg.homes[person]});
  if(/\b(?:you yourself govern|do you govern)\b/.test(text)&&cfg.identity)return verify(cfg.identity.predicate,{subject:person,object:cfg.identity.governor});
  if(/\b(?:your favorite subject|your favourite subject)\b/.test(text)&&ids.some(id=>cfg.personalTopics?.[person]?.includes(id)))return social('interest');
  if(/^who (?:helps|welcomes) arrivals\b/.test(text)&&cfg.welcoming)return ask(cfg.welcoming.predicate,{subject:{$var:'person'}});
  if(/\b(?:same (?:person|individual)|same as|are you (?:the )?(?:governing )?mind)\b/.test(text)&&cfg.identity){
    const subject=/\b(?:are you|you the same)\b/.test(text)?person:/\bthat person\b/.test(text)?context.focus:ids.find(id=>id!==cfg.identity.governor);
    if(subject)return verify(cfg.identity.predicate,{subject,object:cfg.identity.governor});
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
  if(/\b(?:neural interface|interface)\b/.test(text)&&/\b(?:cue|cues|whistle|translate|translation)\b/.test(text)&&cfg.interfaceTopic)return ask('nature',{subject:cfg.interfaceTopic});
  if(cfg.identity&&/^(?:someone told me|i heard that)\b/.test(text)&&/\bwelcomes? (?:every|all) arrivals?\b/.test(text))return {function:'assert',content:{predicate:'welcomes_every_arrival',args:{subject:cfg.identity.governor},polarity:true}};
  return null;
}
