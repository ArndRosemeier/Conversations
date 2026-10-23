import {createConversationWorld,createNPCConversation,type Profile,type BubbleTurn,type LanguageModule} from '../../.release/package/dist/index.js';
import {englishModule,createEnglishResources} from '../../.release/package/dist/languages/en/index.js';
import {createSolarpolisCanon} from '../../.release/package/dist/canon/solarpolis.js';
import {solarpolisEnglish} from '../../.release/package/dist/languages/en/solarpolis-canon.js';
const profiles:Profile[]=[{id:'a',temperament:'warm',pursuits:['music']},{id:'b',bodyKind:'shell'},{id:'c',ageGroup:'elder'}];
const world=createConversationWorld({profiles});
const resources=createEnglishResources({entities:{a:'A',b:'B',c:'C'}});
const session=world.createSession({participants:['a','b','c'],languageModule:englishModule,resources});
const conversation=session.conversation({seed:'court-3',day:12,maxTurns:24});
const turn:BubbleTurn|null=conversation.next();
if(turn){const pieces:string[]=turn.pieces;void pieces;}
conversation.pause();conversation.resume();conversation.stop('walking-on');
const snapshot=session.snapshot();
world.createSession({participants:['a','b','c'],languageModule:englishModule,resources,saved:snapshot});
world.addCharacter({id:'d',temperament:'curious'});
world.addEntities({lake:{type:'place'}});
world.addFacts([]);
const canon=createSolarpolisCanon({knownBy:['a']});void canon;void solarpolisEnglish;
createNPCConversation(session.core,session.language,{participants:['a','b'],seed:1});
const probe:LanguageModule<{names:Record<string,string>}>= {
  apiVersion:1,locale:'xx',validateResources(){},create(){return {
    locale:'xx',interpret(){return {function:'greet'};},realize(){return 'x';},name(id){return id;},label(){return 'x';},npcLine(){return 'x';},bubbleVersion:1,realizeBubble(){return ['x'];}
  };}
};void probe;
// @ts-expect-error unknown temperament
world.addCharacter({id:'x',temperament:'undefined-style'});
// @ts-expect-error seeds must be strings or numbers
session.conversation({seed:{}});
// @ts-expect-error module injection is mandatory
world.createSession({participants:['a','b'],resources});
