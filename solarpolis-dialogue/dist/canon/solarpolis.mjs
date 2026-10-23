// Selected attributed world-bible facts. No Arrival Commons characters or events.
import {entities,predicates,facts} from '../solarpolis-expanded.mjs';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const solarpolisCanon=freeze({
  id:'solarpolis-world-bible',version:1,
  entities:structuredClone(entities),
  predicates:{...structuredClone(predicates),governed_by:{roles:{subject:'entity',object:'entity'},keyRoles:['subject','object']}},
  facts:facts.map(f=>({...structuredClone(f),knownBy:[]})),rules:[]
});
// Knowledge distribution is a host decision, not a property of canon truth.
export function createSolarpolisCanon({knownBy=[]}={}){
  const result=structuredClone(solarpolisCanon);
  for(const fact of result.facts)fact.knownBy=[...knownBy];
  return result;
}
