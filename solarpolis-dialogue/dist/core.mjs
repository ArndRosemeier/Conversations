// Host-independent semantic engine. No DOM, English, IndexedDB, or Solarpolis imports.
export const copy = value => structuredClone(value);
const variable = x => x && typeof x === 'object' && '$var' in x;
export function matches(atom, query = {}) {
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
      world: copy(domain.facts), evidence: [], contexts: {}, history: [], events: [], pending: [], applied: []
    };
    if (this.state.domainVersion !== domain.version) throw new Error('Incompatible domain snapshot');
    if (!snapshot) {
      for (const npc of domain.characters) {
        this.state.contexts[npc.id] = { focus: null, lastQuery: null, lastAct: null, turn: 0 };
        for (const fact of domain.facts.filter(f => !f.knownBy || f.knownBy.includes(npc.id))) {
          this.observe(npc.id, fact, { kind: 'publication', label: fact.sourceLabel ?? 'visitor reference archive' }, false);
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
  world(query = {}) { return this.state.world.filter(f => f.validTo == null && matches(f.atom, query)); }
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
  beliefs(holder, query = {}) {
    const groups = new Map();
    for (const e of this.state.evidence.filter(e => e.holder === holder && matches(e.atom, query))) {
      const key = this.key(e.atom);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
    const actor = this.domain.characters.find(c => c.id === holder);
    return [...groups.values()].map(items => {
      items.sort((a,b) => b.aboutTime - a.aboutTime || b.learnedAt - a.learnedAt || Number(b.id.split(':')[1]) - Number(a.id.split(':')[1]));
      const confirmed = items.find(e => e.certainty === 'confirmed');
      const reports = items.filter(e => e.certainty === 'reported' && (!confirmed || e.learnedAt >= confirmed.learnedAt));
      const tentative = reports.find(e => !confirmed || e.aboutTime > confirmed.aboutTime);
      const primary = actor?.personality.testimony === 'provisional' && tentative ? tentative : confirmed ?? tentative;
      return { primary, confirmed, reports, history: items, conflict: !!confirmed && reports.some(e => JSON.stringify(e.atom) !== JSON.stringify(confirmed.atom)) };
    }).filter(g => g.primary);
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
          validTo: null, origin: copy(event.origin), sourceLabel: event.label };
        this.state.world.push(fact);
        for (const holder of event.observers ?? []) this.observe(holder, fact, {kind:'observation', label:event.label});
        if (event.deliverAfter != null) this.state.pending.push({
          id: this.next('delivery'), due: this.state.time + event.deliverAfter,
          holders: event.recipients ?? [], fact: copy(fact), label: event.label, sentAt: this.state.time
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
      for (const holder of p.holders) this.observe(holder,p.fact,{kind:'received-signal',label:p.label,sentAt:p.sentAt,receivedAt:p.due});
    }
    this.state.pending = this.state.pending.filter(p => p.due > target);
    this.state.time = target;
  }
  context(holder) { return copy(this.state.contexts[holder]); }
  respond(holder, act) {
    const actor = this.domain.characters.find(c => c.id === holder);
    if (!actor) throw new Error('Unknown character');
    const context = this.state.contexts[holder];
    const plan = { id:this.next('plan'), holder, function:act.function, results:[], time:this.state.time, decision:'' };
    if (act.function === 'assert') {
      this.validate(act.content);
      const evidence = { id:this.next('evidence'),holder,atom:copy(act.content),aboutTime:this.state.time,
        learnedAt:this.state.time,certainty:'reported',source:{kind:'testimony',speaker:'player',label:'your unverified statement'},origin:{kind:'player'},supports:[] };
      this.state.evidence.push(evidence);
      plan.report = evidence;
      plan.results = this.beliefs(holder,{predicate:act.content.predicate,args:Object.fromEntries(this.schemas[act.content.predicate].keyRoles.map(r=>[r,act.content.args[r]]))});
      plan.decision = actor.personality.testimony === 'provisional' ? 'Use testimony provisionally, preserving attribution.' : 'Record testimony separately; retain confirmed evidence.';
      context.focus = act.content.args.subject ?? context.focus;
    } else if (['ask','ask_evidence','opinion'].includes(act.function)) {
      const query = act.query ?? context.lastQuery;
      if (!query) { plan.function='clarify'; plan.reason='missing-context'; }
      else {
        context.lastQuery = copy(query);
        context.focus = query.args?.subject ?? context.focus;
        plan.query = copy(query);
        plan.results = this.beliefs(holder,query).slice(0,act.function==='ask_evidence'?6:actor.personality.detail);
        plan.stance = act.function === 'opinion' ? actor.attitudes?.[context.focus] ?? 'undecided' : null;
        plan.decision = plan.results.length ? 'Select personal evidence matching the query; preserve source and uncertainty.' : 'No matching personal evidence; acknowledge the knowledge boundary.';
      }
    } else if (act.function === 'clarify') {
      plan.reason=act.reason; plan.candidates=act.candidates;
      plan.decision='Preserve ambiguity instead of inventing an interpretation.';
    } else plan.decision='Handle a social conversational act.';
    context.turn++;
    context.lastAct=act.id ?? plan.id;
    this.state.history.push({id:this.next('turn'),holder,time:this.state.time,act:copy(act),plan:copy(plan)});
    return plan;
  }
  snapshot() { return copy(this.state); }
}
