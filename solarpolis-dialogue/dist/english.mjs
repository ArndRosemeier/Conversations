// First language implementation. Domain vocabulary/templates are injected.
import {interpretSocial,realizeSocial,realizeEvidence} from './english-social.mjs';
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalize = s => s.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
export class EnglishLanguage {
  constructor(resources) { this.r=resources; this.locale='en'; }
  name(id) { return this.r.entities[id]?.name ?? id; }
  entitiesIn(text) {
    return Object.entries(this.r.entities).flatMap(([id,e]) => {
      const aliases=[e.name,...(e.aliases??[])].sort((a,b)=>b.length-a.length);
      const hits=aliases.map(alias=>new RegExp(`(^|[^a-z0-9])${escape(normalize(alias))}(?=$|[^a-z0-9])`,'i').exec(text)).filter(Boolean);
      return hits.length ? [{id,index:Math.min(...hits.map(m=>m.index))}] : [];
    }).sort((a,b)=>a.index-b.index).map(x=>x.id);
  }
  interpret(raw,context={}) {
    const socialAct=interpretSocial(raw,context,this.r.entities);
    if(socialAct){this.lastInterpretation={engine:'English social constructions'};return socialAct;}
    const text=normalize(raw);
    if (!text) return {function:'clarify',reason:'empty'};
    if (/^(hi|hello|hey|greetings)[!. ]*$/.test(text)) return {function:'greet'};
    if (/^(thanks|thank you|cheers)[!. ]*$/.test(text)) return {function:'thank'};
    if (/^(why|how do you know|what is your source|source|according to whom)\??$/.test(text)) return {function:'ask_evidence'};
    if (/^(yes|no|ok|okay)\W*$/.test(text)) return {function:'clarify',reason:'no-pending-offer'};
    let ids=this.entitiesIn(text);
    if (!ids.length && /\b(he|she|they|them|it|there|that|this)\b/.test(text) && context.focus) ids=[context.focus];
    const places=ids.filter(id=>this.r.entities[id]?.type==='place');
    const subjects=ids.filter(id=>this.r.entities[id]?.type!=='place');
    // Assertions are deliberately bounded and anchored. Questions never become testimony.
    if (!/\?|^(where|what|when|who|why|how|is|are|can|do|does|tell|please)\b/.test(text) && subjects.length===1 && places.length===1) {
      const subject=subjects[0],place=places[0];
      if (/\b(is|isn't|is not|has moved to|moved to|will be|takes place|happens)\b/.test(text)) {
        return {function:'assert',content:{predicate:'located_at',args:{subject,place},polarity:!(/\b(isn't|is not|not in|not at)\b/.test(text))}};
      }
    }
    if (/^(what time|when)\b|[.!?]\s*(what time|when)\b/.test(text)) {
      if (subjects.length===1) return {function:'ask',query:{predicate:'starts_at',args:{subject:subjects[0]}}};
      if (context.focus && this.r.entities[context.focus]?.type==='event') return {function:'ask',query:{predicate:'starts_at',args:{subject:context.focus}}};
      return {function:'clarify',reason:'which-time'};
    }
    if (subjects.length>1) return {function:'clarify',reason:'multiple-subjects',candidates:subjects};
    let subject=subjects[0];
    if (!subject && /\b(yourself|your pursuit|you do|you from)\b/.test(text)) subject=context.speaker;
    if (!subject) return {function:'clarify',reason:'unsupported'};
    const query={args:{subject}};
    if(/\bhow many\b/.test(text))return {function:'ask',query:{predicate:'numeric_count',args:{subject}}};
    if (/\bwhere\b/.test(text)) {query.predicate='located_at';query.args.place={$var:'place'};}
    else if (/\b(source|how do you know|evidence)\b/.test(text)) return {function:'ask_evidence',query};
    else if (/\b(slot|reservation|confirmed|booking)\b/.test(text)) query.predicate='reservation';
    else if (/\b(rights|safe|personhood|legal|persons|people|tools)\b/.test(text)) query.predicate='rights';
    else if (/\b(think|opinion|feel|support|trust)\b/.test(text)) return {function:'opinion',query};
    else if (!/^(what|who|how|why|tell|explain|describe|is|are|can|do|does|about|please)|\?$/.test(text) && !this.r.entities[subject].aliases?.some(a=>normalize(a)===text) && normalize(this.name(subject))!==text) return {function:'clarify',reason:'unsupported'};
    return {function:'ask',query};
  }
  clause(e) {
    const a=e.atom,args=Object.fromEntries(Object.entries(a.args).map(([k,v])=>[k,this.r.entities[v]?this.name(v):v]));
    const schema=this.r.predicates[a.predicate];
    let template=a.polarity===false?schema?.negative:schema?.positive;
    if (!template && a.polarity===false) return `the claim about ${args.subject} is false`;
    if (a.args.value!=null) template=this.r.values[a.args.value]??template;
    if (a.args.minute!=null) args.minute=this.clock(a.args.minute);
    return (template??'{subject}: {value}').replace(/\{(\w+)\}/g,(_,key)=>args[key]??key);
  }
  clock(minute) {const t=16*60+minute;return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;}
  sentence(s) {return s.charAt(0).toUpperCase()+s.slice(1).replace(/[.!?]$/,'')+'.';}
  realize(plan,actor,options={}) {
    if(plan.social)return realizeSocial(plan,this.r.social?.[actor.voice],id=>this.name(id));
    if(plan.function==='ask_evidence'){const text=realizeEvidence(plan,actor,this.r.social?.[actor.voice],this);if(text)return text;}
    const voice=this.r.voices[actor.voice];
    let text='';
    if (plan.function==='clarify') {
      if (plan.reason==='multiple-subjects') text=`Which subject do you mean: ${(plan.candidates??[]).map(id=>this.name(id)).join(' or ')}?`;
      else text=voice.repairs[plan.reason]??voice.repairs.unsupported;
    } else if (plan.function==='greet') text=voice.greeting;
    else if (plan.function==='thank') text=voice.thanks;
    else if (plan.function==='assert') {
      const claim=this.clause(plan.report);
      text=voice.report.replace('{claim}',claim);
      const prior=plan.results.map(g=>g.confirmed).find(Boolean);
      if (prior && actor.personality.testimony!=='provisional') text+=` ${voice.confirmed.replace('{claim}',this.clause(prior)).replace('{time}',this.clock(prior.aboutTime))}`;
    } else if (plan.function==='ask_evidence') {
      if (!plan.results.length) text=voice.unknown;
      else text=plan.results.map(g=>{
        const e=g.primary;
        return `Recorded claim: ${this.clause(e)}. Source: ${e.source.label}; about ${this.clock(e.aboutTime)}, learned at ${this.clock(e.learnedAt)}${e.source.sentAt!=null?`, sent at ${this.clock(e.source.sentAt)}`:''}. ${e.certainty==='reported'?'That is testimony, not independent confirmation.':''}`;
      }).join(' ');
    } else {
      if (plan.function==='opinion') text=voice.stances[plan.stance]??voice.stances.undecided;
      if (!plan.results.length) text+=(text?' ':'')+voice.unknown;
      else {
        const phrases=plan.results.map(g=>{
          const e=g.primary,claim=this.clause(e);
          if (e.certainty==='reported') return voice.tentative.replace('{claim}',claim);
          if (['located_at','reservation'].includes(e.atom.predicate)) return voice.confirmed.replace('{claim}',claim).replace('{time}',this.clock(e.aboutTime));
          return this.sentence(claim);
        });
        const staticOnly=plan.results.every(g=>!['located_at','reservation'].includes(g.primary.atom.predicate)&&g.primary.certainty!=='reported');
        const lead=staticOnly&&plan.function!=='opinion'?voice.factLeads[Number(plan.id.split(':')[1])%voice.factLeads.length]:'';
        text+=(text?' ':'')+lead+phrases.join(' ');
        if (plan.results.some(g=>g.conflict) && actor.personality.testimony!=='provisional') text+=' I also have an unverified report that differs.';
      }
    }
    if (options.expanded && actor.voice==='relational') text+='\n\n[Expanded interface: this reply carries an invitation to continue the exchange, without an obligation to agree.]';
    return text;
  }
  npcLine(key,actor,args={}) {
    return (this.r.social?.[actor.voice]?.npc?.[key]??key).replace(/\{(\w+)\}/g,(_,name)=>args[name]??name);
  }
  label(act) {
    if (act.function==='ask_evidence') return 'How do you know?';
    if (act.function==='opinion') return `What do you think of ${this.name(act.query.args.subject)}?`;
    if (act.function==='assert') return this.sentence(this.clause({atom:act.content}));
    const q=act.query;
    if(q?.predicate==='located_at') return `Where is ${this.name(q.args.subject)}?`;
    return `Tell me about ${this.name(q?.args.subject)}.`;
  }
}
