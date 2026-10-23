// Bounded positive inference. Inputs are one agent's accepted evidence only.
const isVariable = value => value && typeof value === 'object' && '$var' in value;
const signature = atom => JSON.stringify([atom.predicate, atom.polarity ?? true,
  Object.entries(atom.args).sort(([a],[b])=>a.localeCompare(b))]);
function unify(pattern, atom, bindings) {
  if (pattern.predicate !== atom.predicate || (pattern.polarity ?? true) !== (atom.polarity ?? true)) return null;
  const result = {...bindings};
  for (const [role, value] of Object.entries(pattern.args)) {
    if (isVariable(value)) {
      const name = value.$var;
      if (name in result && result[name] !== atom.args[role]) return null;
      if (!(role in atom.args)) return null;
      result[name] = atom.args[role];
    } else if (value !== atom.args[role]) return null;
  }
  return result;
}
export function deriveEvidence(holder, evidence, rules = [], validate = ()=>{}, limits = {}) {
  const maxRounds = limits.rounds ?? 8, maxDerived = limits.facts ?? 256;
  const known = evidence.filter(e=>['confirmed','inferred'].includes(e.certainty));
  const seen = new Set(known.map(e=>signature(e.atom))), proofs = new Set(), derived = [];
  for (let round=0; round<maxRounds; round++) {
    let added = false;
    const index = new Map();
    for (const e of known) { if (!index.has(e.atom.predicate)) index.set(e.atom.predicate,[]); index.get(e.atom.predicate).push(e); }
    for (const rule of rules) {
      let rows = [{bindings:{}, supports:[]}];
      for (const premise of rule.body) {
        rows = rows.flatMap(row=>(index.get(premise.predicate)??[]).flatMap(e=>{
          const bindings = unify(premise,e.atom,row.bindings);
          return bindings ? [{bindings,supports:[...row.supports,e]}] : [];
        })).slice(0,1024);
        if (!rows.length) break;
      }
      for (const {bindings,supports} of rows) {
        if (!supports.length) continue;
        const atom = {predicate:rule.head.predicate, args:Object.fromEntries(Object.entries(rule.head.args).map(([role,value])=>[role,isVariable(value)?bindings[value.$var]:value])), polarity:rule.head.polarity??true};
        if (Object.values(atom.args).some(v=>v===undefined)) continue;
        validate(atom);
        const key=signature(atom), proofKey=`${rule.id}:${key}`;
        if (proofs.has(proofKey)) continue;
        proofs.add(proofKey);
        const result={id:`inference:${holder}:${derived.length}`,holder,atom,
          certainty:'inferred',aboutTime:Math.max(...supports.map(e=>e.aboutTime)),
          learnedAt:Math.max(...supports.map(e=>e.learnedAt)),origin:rule.origin,
          source:{kind:'inference',rule:rule.id,label:rule.explanationKey??rule.id},
          supports:supports.map(e=>e.id),proof:{rule:rule.id,explanationKey:rule.explanationKey,
            premises:supports.map(e=>({id:e.id,atom:e.atom,source:e.source,origin:e.origin,certainty:e.certainty,aboutTime:e.aboutTime,learnedAt:e.learnedAt, ...(e.proof?{proof:e.proof}:{})}))}};
        derived.push(result);
        if (!seen.has(key)) {known.push(result);seen.add(key);added=true;}
        if (derived.length>=maxDerived) return derived;
      }
    }
    if (!added) break;
  }
  return derived;
}
