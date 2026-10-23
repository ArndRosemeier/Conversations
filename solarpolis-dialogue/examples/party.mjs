import {createConversationWorld} from '../dist/index.mjs';
import {englishModule,createEnglishResources} from '../dist/languages/en/index.mjs';

export function makeParty(){
  const world=createConversationWorld({
    entities:{court:{type:'place'},pavilion:{type:'place'},dance:{type:'event'}},
    predicates:{located_at:{roles:{subject:'entity',place:'entity'},keyRoles:['subject']}},
    profiles:[
      {id:'ona',temperament:'warm',pursuits:['orchard_keeping'],bodyKind:'grown_human',ageGroup:'adult',home:'court'},
      {id:'teo',temperament:'dry',pursuits:['hiking'],bodyKind:'shell',ageGroup:'elder',home:'court'},
      {id:'pip',temperament:'curious',pursuits:['music'],bodyKind:'drone_person',ageGroup:'young',home:'court'}
    ],
    facts:[{id:'dance-today',atom:{predicate:'located_at',args:{subject:'dance',place:'pavilion'}},validFrom:0,validTo:null,
      knownBy:['teo'],sourceKind:'observation',origin:{kind:'sample',source:'Host-created event'}}]
  });
  const resources=createEnglishResources({
    entities:{court:'Orchard Court',pavilion:'the pavilion',dance:'the dance',ona:'Ona',teo:'Teo',pip:'Pip'},
    predicates:{located_at:{positive:'{subject} is at {place}',negative:'{subject} is not at {place}'}}
  });
  const session=world.createSession({participants:['ona','teo','pip'],languageModule:englishModule,resources});
  return {world,resources,session};
}
export const conversationOptions={seed:'orchard-ring-7',day:12,maxTurns:24,topics:[{function:'ask',query:{predicate:'located_at',args:{subject:'dance',place:{$var:'place'}}}}]};
