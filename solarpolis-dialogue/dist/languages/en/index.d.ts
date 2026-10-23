import type {Act,Character,LanguageModule,LanguageSchema,LanguageAdapter,Plan,BubbleMove,Metadata} from '../../index.js';
export interface EnglishEntity { name:string; type?:string; aliases?:string[]; [key:string]:unknown }
export interface EnglishPredicate { positive:string; negative?:string; firstPerson?:{positive?:string;negative?:string}; [key:string]:unknown }
export interface EnglishResources { entities:Record<string,EnglishEntity>; predicates:Record<string,EnglishPredicate>; voices:Record<string,Metadata>; pursuits?:Record<string,{name:string;reasons?:string[]}>; bubbleQuestions?:Record<string,string>; [key:string]:unknown }
export function createEnglishResources(input?:{entities?:Record<string,string|EnglishEntity>;predicates?:Record<string,EnglishPredicate>;pursuits?:Record<string,{name:string;reasons?:string[]}>;bubbleQuestions?:Record<string,string>}):EnglishResources;
export function splitBubbles(text:string):string[];
export function validateResources(resources:EnglishResources,schema:LanguageSchema):void;
export class EnglishLanguage implements LanguageAdapter {
  constructor(resources:EnglishResources,options?:Metadata);
  locale:string; readonly bubbleVersion:1; r:EnglishResources;
  interpret(text:string,context?:Metadata):Act; realize(plan:Plan,actor:Character,options?:Metadata):string;
  name(id:string):string; label(act:Act):string; npcLine(key:string,actor:Character,args?:Record<string,string>):string;
  realizeBubble(move:BubbleMove):string[];
}
export const englishModule:LanguageModule<EnglishResources>;
