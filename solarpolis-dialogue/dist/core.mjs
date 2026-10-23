// Host-independent semantic engine. No DOM, English, IndexedDB, or Solarpolis imports.
import {deriveEvidence} from './reasoning.mjs';
import {respondDiscourse} from './discourse.mjs';
import {respondSocial} from './social.mjs';
export const copy = value => structuredClone(value);
const variable = x => x && typeof x === 'object' && '$var' in x;
const sameAtom=(a,b)=>a.predicate===b.predicate&&(a.polarity??true)===(b.polarity??true)&&Object.keys(a.args).length===Object.keys(b.args).length&&Object.entries(a.args).every(([k,v])=>b.args[k]===v);
export function matches(atom, query = {}) {
  if (query.anyOf && !query.anyOf.some(q=>matches(atom,q))) return false;
  if (query.allOf && !query.allOf.every(q=>matches(atom,q))) return false;
  return (!query.predicate || atom.predicate === query.predicate) &&
    (query.polarity === undefined || (atom.polarity ?? true) === query.polarity) &&
    Object.entries(query.args ?? {}).every(([role, value]) => variable(value) || atom.args[role] === value);
}
export class AgentCore {
  constructor(domain, snapshot) {
    this.domain = domain;
    this.schemas = domain.predicates;
    this.state = snapshot ? copy(snapshot) : {
      version: 1, domainVersion: domain.version, time: 0, sequence: 0,
      world: copy(domain.facts), evidence: [], contexts: {}, history: [], events: [], pending: [], applied: [], viewpoints: []
    };
    if (this.state.domainVersion !== domain.version) {
      if (!domain.migrateFrom?.includes(this.state.domainVersion)) throw new Error('Incompatible domain snapshot');
      // Add new canon without replacing events, reports, or observations from the saved game.
      const existing=new Set(this.state.world.map(f=>f.id));
      for(const fact of domain.facts.filter(f=>!existing.has(f.id))){
        this.state.world.push(copy(fact));
        for(const npc of domain.characters)if(!fact.knownBy||fact.knownBy.includes(npc.id))
          this.observe(npc.id,fact,{kind:'publication',label:fact.sourceLabel,labelKey:fact.sourceKey??'source.initial'},false);
      }
      this.state.viewpoints??=[];
      for(const npc of domain.characters)for(const view of domain.viewpoints??[])
        if((!view.knownBy||view.knownBy.includes(npc.id))&&!this.state.viewpoints.some(v=>v.id===view.id&&v.holder===npc.id))this.state.viewpoints.push({...copy(view),holder:npc.id});
      this.state.domainVersion=domain.version;
    }
    if (!snapshot) {
      for (const npc of domain.characters) {
        this.state.contexts[npc.id] = { focus: null, referents:{}, lastQuery: null, lastAct: null, lastResults:[], pendingOffer:null, turn: 0 };
        for (const view of domain.viewpoints??[]) if (!view.knownBy||view.knownBy.includes(npc.id)) this.state.viewpoints.push({...copy(view),holder:npc.id});
        for (const fact of domain.facts.filter(f => !f.knownBy || f.knownBy.includes(npc.id))) {
          this.observe(npc.id, fact, { kind: 'publication', label: fact.sourceLabel,labelKey:fact.sourceKey??'source.initial' }, false);
        }
      }
    }
  }
  next(prefix) { return `${prefix}:${++this.state.sequence}`; }
  validate(atom) {
    const schema = this.schemas[atom.predicate];
    if (!schema) throw new Error(`Unknown predicate: ${atom.predicate}`);
    if (Object.keys(atom.args).length !== Object.keys(schema.roles).length) throw new Error('Incorrect argument count');
    for (const [role, type] of Object.entries(schema.roles)) {
      const value = atom.args[role];
      if (value === undefined) throw new Error(`Missing ${role}`);
      if (type === 'entity' && !this.domain.entities[value]) throw new Error(`Unknown entity: ${value}`);
      if (type === 'number' && typeof value !== 'number') throw new Error(`Expected number: ${role}`);
      if (type === 'string' && typeof value !== 'string') throw new Error(`Expected string: ${role}`);
    }
    if (atom.polarity !== undefined && typeof atom.polarity !== 'boolean') throw new Error('Invalid polarity');
  }
  key(atom) {
    const roles = this.schemas[atom.predicate].keyRoles ?? Object.keys(atom.args);
    return JSON.stringify([atom.predicate, ...roles.map(r => [r, atom.args[r]])]);
  }
  world(query = {}) {
    return this.state.world.filter(f => (typeof query.atTime==='number'
      ? f.validFrom<=query.atTime&&(f.validTo==null||f.validTo>query.atTime)
      : f.validTo==null) && matches(f.atom,query));
  }
  observe(holder, fact, source, log = true) {
    if (!this.state.contexts[holder]) throw new Error('Unknown observer');
    this.validate(fact.atom);
    const e = { id: this.next('evidence'), holder, atom: copy(fact.atom),
      aboutTime: fact.validFrom, learnedAt: this.state.time, certainty: 'confirmed',
      source: copy(source), origin: copy(fact.origin), supports: [fact.id] };
    this.state.evidence.push(e);
    if (log) this.state.events.push({ id: this.next('event'), time: this.state.time, kind: 'observation', holder, evidence: e.id });
    return e;
  }
  // Resolve only this holder's evidence. Never consult authoritative world state here.
  baseBeliefs(holder, query = {}) {
    const groups = new Map();
    for (const e of this.state.evidence.filter(e => e.holder === holder && (typeof query.atTime!=='number'||(Number.isFinite(e.aboutTime)&&e.aboutTime<=query.atTime)))) {
      const key = this.key(e.atom);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
    const actor = this.domain.characters.find(c => c.id === holder);
    return [...groups.values()].map(items => {
      items.sort((a,b) => (b.aboutTime??-1)-(a.aboutTime??-1) || b.learnedAt-a.learnedAt || Number(b.id.split(':')[1])-Number(a.id.split(':')[1]));
      const confirmations=items.filter(e => e.certainty === 'confirmed').filter((e,i,all)=>all.findIndex(x=>x.aboutTime===e.aboutTime&&sameAtom(x.atom,e.atom))===i);
      const confirmed = query.temporal==='previous' ? confirmations[1]??confirmations[0] : confirmations[0];
      const reports = items.filter(e => e.certainty === 'reported' && (!confirmed || e.learnedAt >= confirmed.learnedAt));
      const tentative = reports.find(e => !confirmed || e.aboutTime > confirmed.aboutTime);
      const primary = actor?.personality.testimony === 'provisional' && tentative ? tentative : confirmed ?? tentative;
      return { primary, confirmed, reports, history: items, conflict: !!confirmed && reports.some(e => !sameAtom(e.atom,confirmed.atom)) };
    }).filter(g => g.primary && matches(g.primary.atom,query));
  }
  beliefs(holder, query = {}) {
    const base=this.baseBeliefs(holder,{atTime:query.atTime,temporal:query.temporal});
    const inferred=deriveEvidence(holder,base.map(g=>g.primary),this.domain.rules,atom=>this.validate(atom));
    const groups=new Map(base.map(g=>[this.key(g.primary.atom),{...g,derivations:[]} ]));
    for(const e of inferred){
      const key=this.key(e.atom),group=groups.get(key);
      if(group){
        if(sameAtom(group.primary.atom,e.atom))group.derivations.push(e);
      }else groups.set(key,{primary:e,confirmed:null,reports:[],history:[e],derivations:[e],conflict:false});
    }
    return [...groups.values()].filter(g=>matches(g.primary.atom,query));
  }
  knownViewpoints(holder,topic){
    return (this.state.viewpoints??[]).filter(v=>v.holder===holder&&(v.topic===topic||v.alsoTopics?.includes(topic)));
  }
  rank(groups,actor){
    const order=this.domain.summaryOrder??[];
    return [...groups].sort((a,b)=>{
      const score=g=>(actor.interests?.[g.primary.atom.predicate]??0)*10+(order.length-(order.indexOf(g.primary.atom.predicate)<0?order.length:order.indexOf(g.primary.atom.predicate)));
      return score(b)-score(a);
    });
  }
  // Host-authorized, atomic state change. Observers and delivery time are supplied by the host.
  applyEvent(event) {
    if (this.state.applied.includes(event.id)) return false;
    for (const change of event.changes ?? []) this.validate(change.atom);
    for (const holder of event.observers ?? []) if (!this.state.contexts[holder]) throw new Error('Unknown observer');
    for (const holder of event.recipients ?? []) if (!this.state.contexts[holder]) throw new Error('Unknown recipient');
    if (event.deliverAfter != null && (!Number.isFinite(event.deliverAfter) || event.deliverAfter < 0)) throw new Error('Invalid delivery delay');
    const before = copy(this.state);
    try {
      for (const change of event.changes ?? []) {
        const key = this.key(change.atom);
        for (const old of this.state.world.filter(f => f.validTo == null && this.key(f.atom) === key)) old.validTo = this.state.time;
        const fact = { id: this.next('fact'), atom: copy(change.atom), validFrom: this.state.time,
          validTo: null, origin: copy(event.origin), sourceLabel: event.label, sourceKey:event.sourceKey };
        this.state.world.push(fact);
        for (const holder of event.observers ?? []) this.observe(holder, fact, {...(event.source??{kind:'observation'}), label:event.label,labelKey:event.sourceKey});
        if (event.deliverAfter != null) this.state.pending.push({
          id: this.next('delivery'), due: this.state.time + event.deliverAfter,
          holders: event.recipients ?? [], fact: copy(fact), label: event.label,labelKey:event.sourceKey, sentAt: this.state.time
        });
      }
      this.state.events.push({ id:event.id, kind:'world-change', time:this.state.time, label:event.label });
      this.state.applied.push(event.id);
      return true;
    } catch (error) { this.state = before; throw error; }
  }
  advance(minutes) {
    if (!Number.isFinite(minutes) || minutes < 0) throw new Error('Time must advance by a finite non-negative amount');
    const target = this.state.time + minutes;
    const due = this.state.pending.filter(p => p.due <= target).sort((a,b) => a.due-b.due);
    for (const p of due) {
      this.state.time = p.due;
      for (const holder of p.holders) this.observe(holder,p.fact,{kind:'received-signal',label:p.label,labelKey:p.labelKey,sentAt:p.sentAt,receivedAt:p.due});
    }
    this.state.pending = this.state.pending.filter(p => p.due > target);
    this.state.time = target;
  }
  context(holder) { return copy(this.state.contexts[holder]); }
  respond(holder, act) {
    const actor = this.domain.characters.find(c => c.id === holder);
    if (!actor) throw new Error('Unknown character');
    const context = this.state.contexts[holder];
    const discoursePlan=respondDiscourse(this,actor,act);
    if(discoursePlan)return discoursePlan;
    const socialPlan=respondSocial(this,actor,act);
    if(socialPlan)return socialPlan;
    const plan = { id:this.next('plan'), holder, function:act.function, results:[], time:this.state.time, decision:'',delivery:{engagement:actor.personality.affiliation>.8?'inviting':'neutral'}};
    const finish=()=>{
      context.turn++;context.lastAct=act.id??plan.id;
      if(plan.results.length)context.lastResults=plan.results.map(g=>copy(g.primary));
      const location=plan.results.find(g=>g.primary.atom.predicate===(this.domain.discourse?.locationPredicate??'located_at')&&(g.primary.atom.polarity??true));
      if(location)context.lastPlace=location.primary.atom.args.place;
      this.state.history.push({id:this.next('turn'),holder,time:this.state.time,act:copy(act),plan:copy(plan)});
      return plan;
    };
    if(['agree','accept','elaborate'].includes(act.function)){
      if(context.pendingOffer){
        const offer=copy(context.pendingOffer);context.pendingOffer=null;
        return this.respond(holder,{...offer.act,function:'ask',offset:offer.offset,speaker:act.speaker});
      }
      plan.function='clarify';plan.reason='no-pending-offer';return finish();
    }
    if(['disagree','reject'].includes(act.function)){
      plan.function=context.pendingOffer?'decline':'acknowledge_disagreement';context.pendingOffer=null;
      plan.decision="decision.feedback";return finish();
    }
    if(act.function==='ask_consensus'){
      const topic=act.query?.args?.subject??context.focus;
      if(!topic){plan.function='clarify';plan.reason='missing-context';return finish();}
      plan.topic=topic;plan.viewpoints=copy(this.knownViewpoints(holder,topic));
      plan.stance=actor.attitudes?.[topic]??actor.attitudes?.[this.domain.attitudeLinks?.[topic]]??'undecided';
      plan.decision="decision.known-viewpoints";
      return finish();
    }
    if(act.function==='compare'){
      const left=act.query?.args?.subject,right=act.query?.args?.other;
      if(!left||!right){plan.function='clarify';plan.reason='multiple-subjects';return finish();}
      const facets=this.domain.comparisonPredicates??Object.keys(this.schemas);
      const a=this.beliefs(holder,{args:{subject:left}}),b=this.beliefs(holder,{args:{subject:right}});
      plan.comparison=facets.map(predicate=>({predicate,left:a.filter(g=>g.primary.atom.predicate===predicate),right:b.filter(g=>g.primary.atom.predicate===predicate)}))
        .filter(f=>f.left.length||f.right.length).slice(0,3);
      plan.results=plan.comparison.flatMap(f=>[...f.left,...f.right]);plan.entities=[left,right];
      context.focus=left;context.referents={topic:[left]};context.lastQuery={args:{subject:left}};
      plan.decision="decision.compare-evidence";
      return finish();
    }
    if(act.function==='ask_list'){
      plan.query=copy(act.query??{});plan.results=this.beliefs(holder,plan.query).filter(g=>(g.primary.atom.polarity??true));
      const select=act.select??Object.entries(plan.query.args??{}).find(([,v])=>variable(v))?.[0]??'subject';
      plan.items=[...new Set(plan.results.map(g=>g.primary.atom.args[select]))];
      plan.descriptions=plan.items.map(id=>({id,evidence:this.domain.listDescriptionPredicate?this.beliefs(holder,{predicate:this.domain.listDescriptionPredicate,args:{subject:id}}).slice(0,1):[]}));
      context.focus=act.topic??this.domain.listTopics?.[plan.query.args?.object]??null;context.lastQuery=copy(plan.query);
      plan.decision="decision.known-members";
      return finish();
    }
    if (act.function === 'assert') {
      this.validate(act.content);
      const speaker=act.speaker??'player';
      const evidence = { id:this.next('evidence'),holder,atom:copy(act.content),aboutTime:act.temporal==='past_unspecified'?null:act.aboutTime??this.state.time,
        learnedAt:this.state.time,certainty:'reported',source:{kind:'testimony',speaker,labelKey:'source.testimony'},origin:{kind:speaker==='player'?'player':'testimony',speaker},supports:[] };
      if(act.temporal)evidence.temporal=act.temporal;
      this.state.evidence.push(evidence);
      plan.report = evidence;
      plan.results = this.beliefs(holder,{predicate:act.content.predicate,args:Object.fromEntries(this.schemas[act.content.predicate].keyRoles.map(r=>[r,act.content.args[r]]))});
      plan.decision = actor.personality.testimony === 'provisional' ? "decision.provisional-testimony" : "decision.retain-confirmed";
      context.focus = act.content.args.subject ?? context.focus;
      context.lastReportId=evidence.id;context.lastProposition=copy(act.content);
      context.lastQuery={predicate:act.content.predicate,args:Object.fromEntries((this.schemas[act.content.predicate].keyRoles??Object.keys(act.content.args)).map(r=>[r,act.content.args[r]]))};
      plan.query=copy(context.lastQuery);
    } else if (['ask','ask_reason','ask_evidence','opinion'].includes(act.function)) {
      const query = act.query ?? context.lastQuery;
      if (!query) { plan.function='clarify'; plan.reason='missing-context'; }
      else {
        context.lastQuery = copy(query);
        context.focus = typeof query.args?.subject==='string'?query.args.subject:context.focus;
        context.referents={topic:context.focus?[context.focus]:[]};
        plan.query = copy(query);
        let candidates=this.beliefs(holder,query);
        if(!query.predicate&&!query.anyOf)for(const rule of this.domain.summaryRedundancies??[]){
          if(candidates.some(g=>g.primary.atom.predicate===rule.preferred&&(!rule.subject||g.primary.atom.args.subject===rule.subject)))
            candidates=candidates.filter(g=>g.primary.atom.predicate!==rule.redundant||(rule.subject&&g.primary.atom.args.subject!==rule.subject));
        }
        const all=this.rank(candidates,actor),offset=act.offset??0;
        const limit=act.function==='ask_evidence'?6:act.function==='ask_reason'?4:actor.personality.detail;
        plan.results=all.slice(offset,offset+limit);
        if(variable(query.args?.subject)&&plan.results.length===1)context.focus=plan.results[0].primary.atom.args.subject;
        plan.explanations=plan.results.flatMap(g=>(g.primary.proof?[g.primary]:g.derivations??[]).slice(0,1));
        plan.stance=act.function==='opinion' ? actor.attitudes?.[context.focus]??actor.attitudes?.[this.domain.attitudeLinks?.[context.focus]]??'undecided':null;
        if(act.function==='ask'&&all.length>offset+limit){
          plan.offer={kind:'elaboration',remaining:all.length-offset-limit};
          context.pendingOffer={act:{function:'ask',query:copy(query)},offset:offset+limit};
        }else context.pendingOffer=null;
        plan.decision = plan.results.length ? "decision.select-evidence" : "decision.unknown";
      }
    } else if (act.function === 'clarify') {
      plan.reason=act.reason; plan.candidates=act.candidates;
      plan.decision="decision.clarify";
    } else plan.decision="decision.social";
    return finish();
  }
  snapshot() { return copy(this.state); }
}
