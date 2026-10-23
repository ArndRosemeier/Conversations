// Versioned integration boundary. No setting, browser, or storage imports.
import {AgentCore} from './core.mjs';
import {createLanguage,assertSemanticAct} from './language-contract.mjs';

const fail=message=>{throw new Error(`Setting package: ${message}`);};
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validateSetting(pkg,{languageModule,locale=languageModule?.locale}={}){
  if(pkg?.contractVersion!==1)fail('contractVersion must be 1');
  if(typeof pkg.id!=='string'||!/^[a-z][a-z0-9-]*$/.test(pkg.id))fail('id must be a stable lowercase slug');
  const d=pkg.domain;
  if(!d||!Number.isInteger(d.version)||d.version<1)fail('domain.version must be a positive integer');
  if(!record(d.entities)||!record(d.predicates)||!Array.isArray(d.characters)||!d.characters.length||!Array.isArray(d.facts))fail('domain needs entities, predicates, characters and facts');
  const characters=new Set();
  for(const c of d.characters){
    if(!d.entities[c.id]||characters.has(c.id))fail(`unknown or duplicate character ${c.id}`);
    characters.add(c.id);

    if(!Number.isInteger(c.personality?.detail)||c.personality.detail<1||!['strict','provisional'].includes(c.personality.testimony))fail(`invalid personality for ${c.id}`);
  }
  for(const [id,p] of Object.entries(d.predicates)){
    if(!record(p.roles)||!Object.keys(p.roles).length||Object.values(p.roles).some(t=>!['entity','string','number'].includes(t)))fail(`invalid roles for ${id}`);
    if(!Array.isArray(p.keyRoles)||!p.keyRoles.length||p.keyRoles.some(k=>!p.roles[k])||new Set(p.keyRoles).size!==p.keyRoles.length)fail(`invalid keyRoles for ${id}`);

  }
  const atom=(a,pattern=false)=>{
    const p=d.predicates[a?.predicate];
    if(!p||!record(a.args)||Object.keys(a.args).length!==Object.keys(p.roles).length)fail(`invalid atom ${a?.predicate}`);
    if(a.polarity!==undefined&&typeof a.polarity!=='boolean')fail('polarity must be boolean');
    for(const [role,type] of Object.entries(p.roles)){
      const v=a.args[role];
      if(pattern&&typeof v?.$var==='string')continue;
      if(type==='entity'?!d.entities[v]:type==='number'?!Number.isFinite(v):typeof v!=='string')fail(`invalid atom value ${a.predicate}.${role}`);
    }
  };
  const holders=ids=>{if(ids!==undefined&&(!Array.isArray(ids)||ids.some(id=>!characters.has(id))))fail('unknown evidence recipient');};
  const factIds=new Set();
  for(const f of d.facts){
    if(!f.id||factIds.has(f.id))fail('fact IDs must be unique');factIds.add(f.id);
    atom(f.atom);holders(f.knownBy);
    if(!Number.isFinite(f.validFrom)||(f.validTo!==null&&(!Number.isFinite(f.validTo)||f.validTo<=f.validFrom)))fail(`invalid validity interval ${f.id}`);
    if((typeof f.sourceLabel!=='string'&&typeof f.sourceKey!=='string')||!f.origin?.kind)fail(`sourceLabel or sourceKey, and origin.kind required for ${f.id}`);
  }
  for(const e of Object.values(d.events??{})){
    if(!e.id||(!e.label&&!e.sourceKey)||!Array.isArray(e.changes))fail('events need id, label or sourceKey, and changes');
    e.changes.forEach(c=>atom(c.atom));holders(e.observers);holders(e.recipients);
    if(e.deliverAfter!==undefined&&(!Number.isFinite(e.deliverAfter)||e.deliverAfter<0))fail('invalid event delivery delay');
  }
  for(const rule of d.rules??[]){
    if(!rule.id||!Array.isArray(rule.body)||!rule.body.length)fail('rules need id and nonempty body');
    rule.body.forEach(a=>atom(a,true));atom(rule.head,true);
    const bound=new Set(rule.body.flatMap(a=>Object.values(a.args).map(v=>v?.$var).filter(Boolean)));
    if(Object.values(rule.head.args).some(v=>v?.$var&&!bound.has(v.$var)))fail(`unbound rule variable in ${rule.id}`);
  }
  const location=d.discourse?.locationPredicate??'located_at';
  if(d.discourse?.locationPredicate&&(!d.predicates[location]||d.predicates[location].roles.subject!=='entity'||d.predicates[location].roles.place!=='entity'))fail('location discourse needs subject and place entity roles');
  if(!pkg.languages||!Object.keys(pkg.languages).length)fail('at least one locale resource package is required');
  if(languageModule)createLanguage(languageModule,{locale,resources:pkg.languages[locale],domain:d,validateOnly:true});
  return pkg;
}

export function createSettingSession(pkg,{languageModule,locale=languageModule?.locale,saved,languageOptions={}}={}){
  validateSetting(pkg);
  const language=createLanguage(languageModule,{locale,resources:pkg.languages[locale],domain:pkg.domain,options:languageOptions});
  if(saved&&(saved.contractVersion!==1||saved.settingId!==pkg.id||saved.domainVersion!==pkg.domain.version||saved.core?.domainVersion!==pkg.domain.version))fail('incompatible saved session; reset or explicitly migrate it');
  const core=new AgentCore(pkg.domain,saved?.core);
  const respondAct=(holder,input)=>{
    const act=structuredClone(input);
    assertSemanticAct(act,core);
    const plan=core.respond(holder,act);
    // A realizer receives a copy: wording cannot rewrite evidence or history.
    const text=language.realize(structuredClone(plan),structuredClone(pkg.domain.characters.find(c=>c.id===holder)));
    if(typeof text!=='string')throw new Error('Language contract: realize must return a string');
    return {act,plan,text};
  };
  return {core,language,respondAct,
    respondText(holder,text){
      if(typeof text!=='string')throw new Error('Language contract: input must be text');
      return respondAct(holder,language.interpret(text,{...core.context(holder),addressee:holder}));
    },
    snapshot(){return {contractVersion:1,settingId:pkg.id,domainVersion:pkg.domain.version,core:core.snapshot()};}
  };
}
