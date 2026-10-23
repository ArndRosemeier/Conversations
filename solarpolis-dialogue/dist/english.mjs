// First language implementation. Domain vocabulary/templates are injected.
import {interpretMeaning,splitTurn} from './english-meaning.mjs';
import {defaultVoice,defaultSocial} from './english-defaults.mjs';
import {createGFParser} from './gf/adapter.mjs';
import {LexicalIndex} from './lexical-index.mjs';
import {interpretSocial,realizeSocial,realizeEvidence} from './english-social.mjs';
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalize = s => s.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
export class EnglishLanguage {
  constructor(resources,options={}) {
    this.r={...resources,voices:{},social:{}};
    for(const [id,voice] of Object.entries(resources.voices??{})){
      this.r.voices[id]={...defaultVoice,...voice,stances:{...defaultVoice.stances,...voice.stances},repairs:{...defaultVoice.repairs,...voice.repairs}};
      const social=resources.social?.[id]??{};
      this.r.social[id]={...defaultSocial,...social,responses:{...defaultSocial.responses,...social.responses},npc:{...defaultSocial.npc,...social.npc}};
    }
    this.locale='en';this.gf=createGFParser(this.r);
    this.schemas=options.schemas;
    this.lexicon=new LexicalIndex(options.lexicalPack);this.lastInterpretation=null;
  }
  name(id) { return this.r.entities[id]?.name ?? id; }
  entitiesIn(text) {
    return Object.entries(this.r.entities).flatMap(([id,e]) => {
      const aliases=[e.name,...(e.aliases??[])].sort((a,b)=>b.length-a.length);
      const hits=aliases.map(alias=>new RegExp(`(^|[^a-z0-9])${escape(normalize(alias))}(?=$|[^a-z0-9])`,'i').exec(text)).filter(Boolean);
      return hits.length ? [{id,index:Math.min(...hits.map(m=>m.index))}] : [];
    }).sort((a,b)=>a.index-b.index).map(x=>x.id);
  }
  mentionsIn(raw){
    const text=normalize(raw),candidates=Object.entries(this.r.entities).flatMap(([id,e])=>[e.name,...(e.aliases??[])].map(alias=>{
      const match=new RegExp(`(^|[^a-z0-9])(${escape(normalize(alias))})(?=$|[^a-z0-9])`,'i').exec(text);
      return match?{id,index:match.index+match[1].length,length:match[2].length}:null;
    }).filter(Boolean)).sort((a,b)=>b.length-a.length);
    const accepted=[];
    for(const c of candidates)if(!accepted.some(a=>c.index<a.index+a.length&&a.index<c.index+c.length))accepted.push(c);
    return accepted.sort((a,b)=>a.index-b.index);
  }
  normalizeAct(act){
    if(!act.query||!this.r.queryFacets)return act;
    const q=act.query,subject=q.args?.subject;
    const facet=this.r.queryFacets[q.predicate]??(act.function==='ask_reason'&&!q.predicate?this.r.reasonPredicates:null);
    if(!facet||!subject)return act;
    return {...act,query:{...q,predicate:undefined,anyOf:facet.map(predicate=>({predicate}))}};
  }
  interpret(raw,context={}) {
    const act=this.interpretRaw(raw,context);
    // Bind shared English concepts to the setting's predicate vocabulary.
    const bind=node=>{
      if(!node||typeof node!=='object')return node;
      if(Array.isArray(node))return node.map(bind);
      return Object.fromEntries(Object.entries(node).map(([key,value])=>[key,key==='predicate'?(this.r.bindings?.[value]??value):bind(value)]));
    };
    const result=bind(act);
    const valid=(node,complete=false)=>{
      if(!node||typeof node!=='object')return true;
      if(node.predicate){
        const schema=this.schemas?.[node.predicate];
        if(this.schemas&&!schema)return false;
        if(schema){
          if(complete&&Object.keys(node.args??{}).length!==Object.keys(schema.roles).length)return false;
          for(const [role,value] of Object.entries(node.args??{})){
            const type=schema.roles[role];
            if(!type||value==null)return false;
            if(!complete&&typeof value==='object'&&typeof value.$var==='string')continue;
            if(type==='entity'&&!this.r.entities[value])return false;
            if(type==='number'&&!Number.isFinite(value))return false;
            if(type==='string'&&typeof value!=='string')return false;
          }
        }
      }
      return Object.entries(node).every(([key,value])=>typeof value!=='object'||value===null||
        (Array.isArray(value)?value.every(v=>valid(v)):valid(value,key==='content')));
    };
    if(!valid(result)){
      this.lastInterpretation={...this.lastInterpretation,rejected:'unsupported setting relation'};
      return {function:'clarify',reason:'unsupported'};
    }
    return result;
  }
  interpretRaw(raw,context={}) {
    const socialAct=interpretSocial(raw,context,this.r.entities);
    if(socialAct){this.lastInterpretation={engine:'English social constructions'};return socialAct;}
    const parts=splitTurn(raw);
    if(parts){
      const local=structuredClone(context),acts=[],traces=[];
      for(const part of parts){
        const act=this.interpretRaw(part,local);acts.push(act);traces.push(this.lastInterpretation);
        if(act.function==='set_topic')local.focus=act.subject;
        if(act.function==='assert')local.lastProposition=act.content;
        if(act.query?.args?.subject&&typeof act.query.args.subject==='string')local.focus=act.query.args.subject;
      }
      this.lastInterpretation={engine:'English composed turn',parts:traces};
      return {function:'sequence',acts};
    }
    const text=normalize(raw),hits=this.lexicon.candidates(text);
    const remember=(act,trace)=>{this.lastInterpretation={...trace,lexicalCandidates:hits};return this.normalizeAct(act);};
    for(const construction of this.r.constructions??[]){
      const act=construction(this,raw,context);
      if(act)return remember(act,{engine:'Setting English construction'});
    }
    const meaning=interpretMeaning(this,raw,context);
    if(meaning)return remember(meaning,{engine:'English relation construction'});
    if(/^(tell me more|more|go on|continue)[.! ]*$/.test(text))return remember({function:'elaborate'},{engine:'English discourse construction'});
    let input=raw,temporal=null;
    if(/^where was\b/.test(text)) {input=raw.replace(/^where was/i,'where is').replace(/\s+(before|earlier)\??$/i,'?');temporal='previous';}
    // Only approved senses participate in these bounded paraphrase constructions.
    if(hits.some(h=>['knowledge.know','knowledge.remember'].includes(h.concept)))input=input.replace(/^what (?:do|can) you (?:know|remember|recall) about\s+/i,'tell me about ');
    if(hits.some(h=>h.concept==='authority.rule'))input=input.replace(/\bgovern\b/gi,'rule');
    input=input.replace(/^can you (?:please )?(describe|tell me about)\s+/i,'$1 ');
    const parsed=this.gf.parse(input,context);
    if(parsed.status==='parsed'){
      let act=parsed.acts[0];
      if(temporal&&act.query)act={...act,query:{...act.query,temporal}};
      return remember(act,{...parsed.trace,trees:parsed.trees,paraphrase:input!==raw?input:undefined});
    }
    if(parsed.status==='ambiguous')return remember({function:'clarify',reason:'ambiguous-meaning',candidates:[...new Set(parsed.acts.flatMap(a=>Object.values(a.query?.args??{}).filter(v=>typeof v==='string')))]},{...parsed.trace,trees:parsed.trees});
    if(parsed.status==='needs-context')return remember({function:'clarify',reason:'missing-context'},parsed.trace);
    const mentions=this.mentionsIn(text);
    const departure=this.lexicon.departureFrame(text,mentions,this.r.entities);
    if(departure)return remember(departure.act,departure.trace);
    if(/^are\s+.+\s+safe in\s+/.test(text)&&mentions.length>=2){
      const place=mentions.at(-1).id;
      return remember({function:'ask',query:{predicate:'rights',args:{subject:place}},scope:'legal_personhood'},{engine:'English legal-status construction'});
    }
    if(/^who\s+(governs|rules)\b/.test(text)&&hits.some(h=>h.concept==='authority.rule')&&mentions.length===1){
      return remember({function:'ask',query:{predicate:'governed_by',args:{subject:mentions[0].id}}},{engine:'WordNet-approved governing-verb construction'});
    }
    const fallback=this.interpretLegacy(raw,context);
    if(temporal&&fallback.query)fallback.query.temporal=temporal;
    return remember(fallback,{engine:fallback.function==='clarify'?'unresolved':'English pattern grammar',gfStatus:parsed.status});
  }
  interpretLegacy(raw,context={}) {
    const text=normalize(raw);
    if (!text) return {function:'clarify',reason:'empty'};
    if (/^(hi|hello|hey|greetings)[!. ]*$/.test(text)) return {function:'greet'};
    if (/^(thanks|thank you|cheers)[!. ]*$/.test(text)) return {function:'thank'};
    if (/^(why|how do you know|what is your source|source|according to whom)\??$/.test(text)) return {function:'ask_evidence'};
    if (/^(yes|no|ok|okay)\W*$/.test(text)) return {function:'clarify',reason:'no-pending-offer'};
    let ids=[...new Set(this.mentionsIn(text).map(m=>m.id))];
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
    else if (!/^(?:tell me about|who is|what is|describe|about)\b/.test(text) && !this.r.entities[subject].aliases?.some(a=>normalize(a)===text.replace(/[.!?]$/,'')) && normalize(this.name(subject))!==text.replace(/[.!?]$/,'')) return {function:'clarify',reason:'unsupported'};
    return {function:'ask',query};
  }
  clause(e,speaker) {
    const a=e.atom,args=Object.fromEntries(Object.entries(a.args).map(([k,v])=>[k,this.r.entities[v]?this.name(v):v]));
    const specific=this.r.statements?.[`${a.predicate}|${a.args.subject}|${a.args.object}${a.polarity===false?'|false':''}`];
    if(specific)return specific.replace(/[.!]$/,'');
    const schema=this.r.predicates[a.predicate];
    let template=a.polarity===false?schema?.negative:schema?.positive;
    if(a.args.subject===speaker)template=(a.polarity===false?schema?.firstPerson?.negative:schema?.firstPerson?.positive)??template;
    if (!template && a.polarity===false) return `the claim about ${args.subject} is false`;
    if (a.args.value!=null) template=this.r.values?.[a.args.value]??template;
    if (a.args.minute!=null) args.minute=this.clock(a.args.minute);
    return (template??'{subject}: {value}').replace(/\{(\w+)\}/g,(_,key)=>args[key]??key);
  }
  clock(minute) {if(minute==null)return 'an unspecified time';const t=(this.r.clock?.startMinute??0)+minute;return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;}
  sentence(s) {return s.charAt(0).toUpperCase()+s.slice(1).replace(/[.!?]$/,'')+'.';}
  realize(plan,actor,options={}) {
    if(plan.function==='sequence'){
      let repair=false;
      return [...new Set(plan.plans.filter(p=>{const bad=p.function==='clarify'||p.social?.topic==='repair';if(bad&&repair)return false;if(bad)repair=true;return true;}).map(p=>this.realize(p,actor,options)).filter(Boolean))].join(' ');
    }
    if(plan.function==='confirm_reference')return plan.confirmed?`Yes, I was referring to ${this.name(plan.subject)}.`:'I don’t have that reference in my last factual answer. Which part did you mean?';
    if(plan.function==='set_topic')return '';
    if(plan.function==='qualify_report')return plan.report?'Understood. Your report stays unverified; you haven’t seen the source yourself.':'Understood. I won’t treat that as a firsthand observation.';
    if(plan.function==='evidence_requirements')return 'I would need a reliable observation or an updated source that I can actually read. Someone saying it changed would remain a separate report.';
    if(plan.function==='ask_count_unknown')return 'I don’t have a current count, or enough information to estimate one.';
    if(plan.function==='verify'){
      const lead={supported:'Yes, that agrees with what I know.',opposed:'That differs from what I know.',conflicted:'I have conflicting evidence on that.',unknown:'I don’t have enough evidence to confirm that.'}[plan.outcome];
      return lead+(plan.results.length?' '+plan.results.map(g=>this.sentence(this.clause(g.primary,actor.id))).join(' '):'');
    }
    if(plan.function==='remember_report')return plan.report?`I have kept your report: ${this.clause(plan.report)}. It remains attributed to ${plan.report.source.speaker==='player'?'you':this.name(plan.report.source.speaker)}, without treating it as confirmed.`:'I haven’t recorded a clear factual claim from you yet. Could you state it again?';
    if(plan.function==='ask_access')return (plan.results.length?plan.results.map(g=>this.sentence(this.clause(g.primary,actor.id))).join(' ')+' ':'')+'I don’t have a list of who is permitted to enter.';
    if(plan.social)return realizeSocial(plan,this.r.social?.[actor.voice],id=>this.name(id));
    if(plan.function==='ask_evidence'){const text=realizeEvidence(plan,actor,this.r.social?.[actor.voice],this);if(text)return text;}
    const voice=this.r.voices[actor.voice];
    let text='';
    if (plan.function==='clarify') {
      if (['multiple-subjects','ambiguous-meaning'].includes(plan.reason)) text=`Which subject do you mean: ${(plan.candidates??[]).map(id=>this.name(id)).join(' or ')}?`;
      else text=voice.repairs[plan.reason]??voice.repairs.unsupported;
    } else if(plan.function==='ask_list'){
      text=plan.items.length?`${voice.listLead??'The members I can name are:'}\n`+plan.items.map(id=>{
        const description=plan.descriptions?.find(x=>x.id===id)?.evidence?.[0];
        return `• ${this.name(id)}${description?': '+this.clause(description.primary):''}`;
      }).join('\n'):voice.unknown;
    } else if(plan.function==='compare'){
      text=plan.comparison.length?plan.comparison.map(f=>[
        ...f.left.map(g=>this.sentence(this.clause(g.primary,actor.id))),
        ...f.right.map(g=>this.sentence(this.clause(g.primary,actor.id))),
        ...(!f.left.length?[`I have no matching information about ${this.name(plan.entities[0])} on this point.`]:[]),
        ...(!f.right.length?[`I have no matching information about ${this.name(plan.entities[1])} on this point.`]:[])
      ].join(' ')).join('\n\n'):voice.unknown;
    } else if(plan.function==='ask_consensus'){
      const views=plan.viewpoints??[];
      text=views.length?(new Set(views.map(v=>v.position)).size>1?'There is disagreement. ':'I can report some positions, but not everyone’s. ')+views.map(v=>this.r.viewpointLabels?.[v.id]??`${this.name(v.attributedTo)}: ${v.position}.`).join(' '):'I do not know enough about other people’s views to claim a consensus.';
      if(plan.stance&&plan.stance!=='undecided')text+=' '+(voice.stances[plan.stance]??'');
    } else if(plan.function==='decline') text=voice.decline??'Understood. We can leave that there.';
    else if(plan.function==='acknowledge_disagreement')text=voice.disagreement??'I hear your objection. That does not, by itself, settle the factual question.';
    else if(plan.function==='acknowledge')text=plan.updated?(voice.updated??'I have read the source. I will use the amended information.'):(voice.acknowledge??'That agrees with the information I have. Thank you.');
    else if (plan.function==='greet') text=voice.greeting;
    else if (plan.function==='thank') text=voice.thanks;
    else if (plan.function==='assert') {
      const claim=this.clause(plan.report);
      text=voice.report.replace('{claim}',claim);
      if(plan.report.temporal==='past_unspecified')text+=' The exact time of that event is not established.';
      const prior=plan.results.map(g=>g.confirmed).find(Boolean);
      if (prior && actor.personality.testimony!=='provisional') text+=` ${voice.confirmed.replace('{claim}',this.clause(prior)).replace('{time}',this.clock(prior.aboutTime))}`;
    } else if (plan.function==='ask_evidence') {
      if (!plan.results.length) text=voice.unknown;
      else text=plan.results.map(g=>{
        const e=g.primary;
        const proof=e.proof??g.derivations?.[0]?.proof;
        if(proof)return `${this.sentence(this.clause(e))} ${this.r.explanations?.[proof.explanationKey]??'This follows from the premises.'} Premises: ${proof.premises.map(p=>this.sentence(this.clause(p))).join(' ')}`;
        return `Recorded claim: ${this.clause(e)}. Source: ${e.source.label}; about ${this.clock(e.aboutTime)}, learned at ${this.clock(e.learnedAt)}${e.source.sentAt!=null?`, sent at ${this.clock(e.source.sentAt)}`:''}. ${e.certainty==='reported'?'That is testimony, not independent confirmation.':''}`;
      }).join(' ');
    } else {
      if (plan.function==='opinion') text=voice.stances[plan.stance]??voice.stances.undecided;
      if (!plan.results.length) text+=(text?' ':'')+voice.unknown;
      else {
        const phrases=plan.results.map(g=>{
          const e=g.primary,claim=this.clause(e,actor.id);
          if (e.certainty==='reported') return voice.tentative.replace('{claim}',claim);
          if (this.r.predicates[e.atom.predicate]?.evidential) return voice.confirmed.replace('{claim}',claim).replace('{time}',this.clock(e.aboutTime));
          return this.sentence(claim);
        });
                const lead='';
        text+=(text?' ':'')+lead+phrases.join(' ');
        if(plan.function==='ask_reason'&&plan.explanations?.length){
          const proof=plan.explanations[0].proof;
          text+=' '+(this.r.explanations?.[proof.explanationKey]??'')+' '+proof.premises.map(p=>this.sentence(this.clause(p))).join(' ');
        }
        if (plan.results.some(g=>g.conflict) && actor.personality.testimony!=='provisional') text+=' I also have an unverified report that differs.';
      }
    }
    if(plan.offer)text+=' '+(voice.offerMore??'I can say more about that, if you would like.');
    if (options.expanded && actor.voice==='relational'&&plan.delivery?.engagement==='inviting') text+='\n\n[Expanded interface: this reply carries an invitation to continue the exchange, without an obligation to agree.]';
    return text;
  }
  npcLine(key,actor,args={}) {
    return (this.r.social?.[actor.voice]?.npc?.[key]??key).replace(/\{(\w+)\}/g,(_,name)=>args[name]??name);
  }
  label(act) {
    if(act.function==='ask_list')return 'Who are the major players?';
    if(act.function==='ask_consensus')return 'Does everyone agree with that?';
    if(act.function==='compare')return `How does ${this.name(act.query.args.subject)} differ from ${this.name(act.query.args.other)}?`;
    if(act.function==='ask_reason')return act.query?.predicate==='recognized_because'?`Why is ${this.name(act.query.args.subject)} recognized as a person?`:`What explains ${this.name(act.query?.args.subject)}’s position?`;
    if(act.function==='elaborate'||act.function==='agree')return 'Tell me more.';
    if (act.function==='ask_evidence') return 'How do you know?';
    if (act.function==='opinion') return `What do you think of ${this.name(act.query.args.subject)}?`;
    if (act.function==='assert') return this.sentence(this.clause({atom:act.content}));
    const q=act.query;
    if(q?.predicate===(this.r.bindings?.located_at??'located_at')) return `Where is ${this.name(q.args.subject)}?`;
    return `Tell me about ${this.name(q?.args.subject)}.`;
  }
}
