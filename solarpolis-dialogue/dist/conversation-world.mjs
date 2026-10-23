import {AgentCore} from './core.mjs';
import {characterFromProfile} from './profiles.mjs';
import {createLanguage} from './language-contract.mjs';
import {createNPCConversation} from './group-conversation.mjs';

const clone=value=>structuredClone(value);
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const context=()=>({focus:null,referents:{},lastQuery:null,lastAct:null,lastResults:[],pendingOffer:null,turn:0});

// One catalog for a whole population. Only active party members get core state.
// Facts are indexed by recipient; unrelated private facts are never copied to a party.
export function createConversationWorld({canon,entities={},predicates={},facts=[],rules=[],profiles=[]}={}){
  const schema={version:1,entities:clone({...canon?.entities,...entities}),predicates:clone({...canon?.predicates,...predicates}),characters:[],facts:[],rules:clone([...canon?.rules??[],...rules])};
  const validator=new AgentCore(schema),characters=new Map(),records=new Map(),publicFacts=[],byHolder=new Map();
  let revision=0;
  const world={
    get revision(){return revision;},
    get characterCount(){return characters.size;},
    get factCount(){return records.size;},
    // Schema is shared read-only by party cores. Mutations use these methods.
    get schema(){return schema;},
    character(id){return characters.get(id);},
    addEntities(entries){
      for(const [id,e] of Object.entries(entries))if(!id||!e||typeof e!=='object'||schema.entities[id])throw new Error(`Duplicate or invalid entity ${id}`);
      Object.assign(schema.entities,freeze(clone(entries)));
    },
    addCharacter(profile){
      const actor=characterFromProfile(profile);
      if(characters.has(actor.id))throw new Error(`Duplicate character ${actor.id}`);
      if(actor.profile.home&&!schema.entities[actor.profile.home])throw new Error('Unknown profile home');
      schema.entities[actor.id]??=freeze({type:'person'});
      characters.set(actor.id,freeze(actor));return actor.id;
    },
    addFacts(additions){
      const ids=new Set();
      for(const f of additions){
        if(!f.id||records.has(f.id)||ids.has(f.id))throw new Error(`Duplicate or missing fact id ${f.id}`);
        ids.add(f.id);validator.validate(f.atom);
        if(Object.values(f.atom.args).some(v=>typeof v==='number'&&!Number.isFinite(v)))throw new Error('Fact numbers must be finite');
        if(!Number.isFinite(f.validFrom)||f.validFrom<0||f.validTo!==null)throw new Error('New facts need nonnegative validFrom and null validTo');
        if(!f.origin?.kind)throw new Error('Fact needs provenance');
        if(f.knownBy!==undefined&&(!Array.isArray(f.knownBy)||f.knownBy.some(id=>typeof id!=='string'||!id)))throw new Error('Invalid fact recipients');
      }
      for(const input of additions){
        const fact=freeze(clone(input)),record={revision:++revision,fact};records.set(fact.id,record);
        if(fact.knownBy===undefined)publicFacts.push(record);
        else for(const id of new Set(fact.knownBy)){if(!byHolder.has(id))byHolder.set(id,[]);byHolder.get(id).push(record);}
      }
    },
    knowledge(holder,after=0){return after>=revision?[]:[...publicFacts,...byHolder.get(holder)??[]].filter(r=>r.revision>after).sort((a,b)=>a.revision-b.revision).map(r=>r.fact);},
    createSession(options){return createPartySession(world,options);}
  };
  profiles.forEach(p=>world.addCharacter(p));world.addFacts([...canon?.facts??[],...facts]);
  return world;
}

export function createPartySession(world,{participants,languageModule,resources,languageOptions={},saved}={}){
  if(!Array.isArray(participants)||participants.length<2||participants.length>6||new Set(participants).size!==participants.length||participants.some(id=>!world.character(id)))throw new Error('A party needs 2 to 6 distinct registered characters');
  if(saved&&(saved.version!==1||JSON.stringify(saved.participants)!==JSON.stringify(participants)))throw new Error('Incompatible party snapshot');
  const domain={...world.schema,characters:participants.map(id=>world.character(id)),facts:[]};
  const core=new AgentCore(domain,saved?.core),cursors={...saved?.cursors};
  let language;
  const installLanguage=()=>{
    const candidate=createLanguage(languageModule,{resources,domain,options:languageOptions});
    if(candidate.bubbleVersion!==1||typeof candidate.realizeBubble!=='function')throw new Error('Language module needs bubbleVersion 1 and realizeBubble');
    language=candidate;
  };
  installLanguage();
  const session={core,get language(){return language;},
    syncKnowledge(){
      for(const id of domain.characters.map(c=>c.id)){
        for(const fact of world.knowledge(id,cursors[id]??0)){
          if(fact.validFrom>core.state.time)continue; // delivered on a later sync after host advance
          if(!core.state.evidence.some(e=>e.holder===id&&e.supports?.includes(fact.id)))core.observe(id,fact,{kind:fact.sourceKind??'publication',labelKey:fact.sourceKey??'source.initial'},false);
        }
        // Keep future deliveries pending without rescanning older records.
        const pending=world.knowledge(id,cursors[id]??0).some(f=>f.validFrom>core.state.time);
        if(!pending)cursors[id]=world.revision;
      }
    },
    addCharacter(id,nextResources=resources){
      if(domain.characters.length>=6||domain.characters.some(c=>c.id===id)||!world.character(id))throw new Error('Invalid party addition');
      const previous=domain.characters,oldResources=resources;
      domain.characters=[...previous,world.character(id)];resources=nextResources;
      try{installLanguage();}catch(error){domain.characters=previous;resources=oldResources;throw error;}
      core.state.contexts[id]=context();session.syncKnowledge();
    },
    refreshLanguage(nextResources){const previous=resources;resources=nextResources;try{installLanguage();}catch(error){resources=previous;throw error;}},
    conversation(options){session.syncKnowledge();return createNPCConversation(core,()=>language,{...options,participants:options?.participants??domain.characters.map(c=>c.id),beforeTurn:()=>session.syncKnowledge()});},
    snapshot(){return {version:1,participants:domain.characters.map(c=>c.id),cursors:{...cursors},core:core.snapshot()};}
  };
  session.syncKnowledge();return session;
}
