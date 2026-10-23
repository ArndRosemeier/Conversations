// The only runtime language boundary. No concrete language imports or defaults.
export const LANGUAGE_API_VERSION=1;
export const ACT_FUNCTIONS=Object.freeze(['ask','ask_reason','ask_evidence','opinion','assert','verify','check_report','remember_report','set_topic','greet','thank','farewell','social','disclose','social_boundary','accept','reject','agree','disagree','elaborate','sequence','clarify','confirm_reference','qualify_report','evidence_requirements','ask_count_unknown','ask_access','ask_list','ask_consensus','compare']);
const required=['interpret','realize','name','label','npcLine'];
const fail=message=>{throw new Error(`Language contract: ${message}`);};
export function createLanguage(module,{locale=module?.locale,resources,domain,options={},validateOnly=false}={}){
  if(!module||module.apiVersion!==LANGUAGE_API_VERSION)fail('a languageModule with apiVersion 1 is required');
  if(typeof module.locale!=='string'||!module.locale||locale!==module.locale)fail(`module does not support locale ${locale}`);
  if(typeof module.validateResources!=='function'||typeof module.create!=='function')fail('module needs validateResources and create');
  if(resources==null)fail(`setting resources missing for ${locale}`);
  // Schema and character metadata only. No world facts, evidence, or core handle.
  const schema=structuredClone({entities:domain.entities,predicates:domain.predicates,characters:domain.characters,discourse:domain.discourse});
  module.validateResources(resources,schema);
  if(validateOnly)return;
  const language=module.create({resources,schema,options});
  if(language?.locale!==locale)fail('adapter locale does not match its module');
  for(const method of required)if(typeof language[method]!=='function')fail(`adapter missing ${method}`);
  return language;
}
export function assertSemanticAct(act,core){
  if(!act||!ACT_FUNCTIONS.includes(act.function))fail('interpret must return a supported semantic act');
  if(act.function==='sequence'){
    if(!Array.isArray(act.acts)||!act.acts.length||act.acts.length>6||act.acts.some(a=>a?.function==='sequence'))fail('invalid act sequence');
    act.acts.forEach(a=>assertSemanticAct(a,core));
  }
  if(['assert','verify'].includes(act.function))core.validate(act.content);
  if(act.function==='set_topic'&&!core.domain.entities[act.subject])fail('unknown topic');
  if(act.function==='social'&&!['wellbeing','activity','interest','identity','reciprocal','reason','wellbeing_reason','activity_reason','interest_reason','uncertainty','coping','welcome_reason','interest_detail','invitation','greeting_repair','appreciation'].includes(act.topic))fail('unsupported social topic');
  if(act.function==='disclose'&&!['positive','negative','tired','worried','neutral'].includes(act.state))fail('unsupported disclosure state');
  const query=q=>{
    if(!q||typeof q!=='object'||Array.isArray(q))fail('invalid query');
    if(q.predicate&&!core.schemas[q.predicate])fail('unknown query predicate');
    for(const child of [...(q.anyOf??[]),...(q.allOf??[])])query(child);
  };
  if(act.query)query(act.query);
}
