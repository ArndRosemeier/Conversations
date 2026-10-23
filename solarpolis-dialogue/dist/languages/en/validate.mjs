// English resource validation belongs to this module, not the host or core.
const fail=message=>{throw new Error(`English resources: ${message}`);};
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validateResources(r,d){
  if(!r||!record(r.entities)||!record(r.predicates)||!record(r.voices))fail('English resources need entities, predicates and voices');
  for(const id of Object.keys(d.entities))if(!r.entities[id]?.name)fail(`English name missing for ${id}`);
  for(const [id,e] of Object.entries(r.entities)){
    if(!d.entities[id])fail(`English entity ${id} is absent from domain`);
    if(typeof e.name!=='string'||!e.name.trim()||e.aliases&&(!Array.isArray(e.aliases)||e.aliases.some(a=>typeof a!=='string'||!a.trim())))fail(`invalid English names for ${id}`);
  }
  for(const c of d.characters)if(!r.voices[c.voice])fail(`English voice missing for ${c.id}`);
  for(const [id,p] of Object.entries(d.predicates)){
    const templates=r.predicates[id];
    if(typeof templates?.positive!=='string')fail(`positive English template required for ${id}`);
    for(const template of [templates.positive,templates.negative,...Object.values(templates.firstPerson??{})].filter(t=>t!==undefined))
      for(const [,role] of template.matchAll(/\{(\w+)\}/g))if(!p.roles[role])fail(`unknown template role ${id}.${role}`);
  }
  for(const [concept,target] of Object.entries(r.bindings??{})){
    if(!d.predicates[target])fail(`binding ${concept} targets unknown predicate ${target}`);
    if(target!==concept&&r.bindings[target]&&r.bindings[target]!==target)fail('chained bindings are not supported');
  }
  const location=d.discourse?.locationPredicate??'located_at';
  if(r.bindings?.located_at&&r.bindings.located_at!==location)fail('location binding and domain.discourse.locationPredicate must agree');
  if(r.clock?.startMinute!==undefined&&(!Number.isInteger(r.clock.startMinute)||r.clock.startMinute<0||r.clock.startMinute>=1440))fail('clock.startMinute must be 0..1439');
  if(r.constructions&&(!Array.isArray(r.constructions)||r.constructions.some(c=>typeof c!=='function')))fail('constructions must be functions');
}
