export type EntityId = string;
export type Seed = string | number;
export type Metadata = Record<string, unknown>;
export interface Atom { predicate: string; args: Record<string,string|number>; polarity?: boolean }
export interface Query { predicate?:string; args?:Record<string,string|number|{$var:string}>; polarity?:boolean; anyOf?:Query[]; allOf?:Query[]; atTime?:number; temporal?:string }
export interface Act { function:string; query?:Query; content?:Atom; speaker?:string; [key:string]:unknown }
export interface Fact { id:string; atom:Atom; validFrom:number; validTo:number|null; knownBy?:string[]; sourceLabel?:string; sourceKey?:string; sourceKind?:string; origin:{kind:string;[key:string]:unknown} }
export interface Predicate { roles:Record<string,'entity'|'string'|'number'>; keyRoles:string[] }
export interface Profile { id:string; temperament?:'warm'|'reserved'|'curious'|'dry'|'lively'; pursuits?:string[]; bodyKind?:string; ageGroup?:string; home?:string }
export interface Character { id:string; voice:string; profile?:Profile; personality:{detail:number;testimony:'strict'|'provisional'|'cautious';affiliation?:number}; [key:string]:unknown }
export interface Rule { id:string; body:Array<{predicate:string;args:Record<string,string|number|{$var:string}>;polarity?:boolean}>; head:{predicate:string;args:Record<string,string|number|{$var:string}>;polarity?:boolean}; [key:string]:unknown }
export interface Canon { id?:string; version?:number; entities:Record<string,Metadata>; predicates:Record<string,Predicate>; facts:Fact[]; rules?:Rule[] }
export interface Domain extends Canon { version:number; characters:Character[]; discourse?:{locationPredicate?:string}; [key:string]:unknown }
export interface Source { kind:string; speaker?:string; label?:string; labelKey?:string; shareable?:boolean; [key:string]:unknown }
export interface Evidence { id:string; holder:string; atom:Atom; certainty:'confirmed'|'reported'|'inferred'; source:Source; aboutTime:number; learnedAt:number; supports:string[]; [key:string]:unknown }
export interface Belief { primary:Evidence; confirmed?:Evidence|null; reports?:Evidence[]; conflict:boolean; [key:string]:unknown }
export interface Plan { function:string; results:Belief[]; time:number; holder:string; [key:string]:unknown }
export interface CoreSnapshot { version:number; domainVersion:number; time:number; sequence:number; evidence:Evidence[]; contexts:Record<string,Metadata>; world:Fact[]; [key:string]:unknown }
export interface HostEvent { id:string; changes:Array<{atom:Atom}>; observers?:string[]; recipients?:string[]; deliverAfter?:number; label?:string; sourceKey?:string; source?:Source; origin?:Metadata }
export class AgentCore {
  constructor(domain:Domain,snapshot?:CoreSnapshot);
  domain:Domain; schemas:Record<string,Predicate>; state:CoreSnapshot;
  next(prefix:string):string; validate(atom:Atom):void; key(atom:Atom):string;
  world(query?:Query):Fact[]; beliefs(holder:string,query?:Query):Belief[]; baseBeliefs(holder:string,query?:Query):Belief[];
  observe(holder:string,fact:Pick<Fact,'id'|'atom'|'validFrom'|'origin'>,source:Source,log?:boolean):Evidence;
  applyEvent(event:HostEvent):boolean; advance(minutes:number):void;
  context(holder:string):Metadata; respond(holder:string,act:Act):Plan; snapshot():CoreSnapshot;
}
export interface LanguageSchema { entities:Record<string,Metadata>; predicates:Record<string,Predicate>; characters:Character[]; discourse?:{locationPredicate?:string} }
export interface BubbleMove { kind:string; speaker?:string; to?:string; variant:number; profile?:Profile; pursuit?:string; home?:string; reflectionTopic?:'pace'|'company'|'possibility'|'rest'|'embodiment'|'experience'; act?:Act; plan?:Plan|null; evidence?:Evidence }
export interface LanguageAdapter {
  locale:string; interpret(text:string,context?:Metadata):Act; realize(plan:Plan,actor:Character):string;
  name(id:string):string; label(act:Act):string; npcLine(key:string,actor:Character,args?:Record<string,string>):string;
  bubbleVersion?:1; realizeBubble?(move:BubbleMove,actor?:Character):string[];
}
export interface LanguageModule<R=unknown> { apiVersion:1; locale:string; validateResources(resources:R,schema:LanguageSchema):void; create(args:{resources:R;schema:LanguageSchema;options?:Metadata}):LanguageAdapter }
export const LANGUAGE_API_VERSION:1;
export function createLanguage<R>(module:LanguageModule<R>,options:{resources:R;domain:Domain;locale?:string;options?:Metadata;validateOnly?:boolean}):LanguageAdapter;
export function assertSemanticAct(act:Act,core:AgentCore):void;
export function characterFromProfile(profile:Profile):Character;
export interface SettingPackage<R=unknown> { contractVersion:1; id:string; domain:Domain; languages:Record<string,R>; [key:string]:unknown }
export interface SettingSnapshot { contractVersion:1; settingId:string; domainVersion:number; core:CoreSnapshot }
export interface SettingSession { core:AgentCore; language:LanguageAdapter; respondAct(holder:string,act:Act):{act:Act;plan:Plan;text:string}; respondText(holder:string,text:string):{act:Act;plan:Plan;text:string}; snapshot():SettingSnapshot }
export function validateSetting<R>(pkg:SettingPackage<R>,options?:{languageModule?:LanguageModule<R>;locale?:string}):SettingPackage<R>;
export function createSettingSession<R>(pkg:SettingPackage<R>,options:{languageModule:LanguageModule<R>;locale?:string;saved?:SettingSnapshot;languageOptions?:Metadata}):SettingSession;
export interface ConversationOptions { participants?:string[]; seed?:Seed; occasion?:Seed; day?:Seed; maxTurns?:number; topics?:Act[]; saved?:ConversationSnapshot }
export interface ConversationSnapshot { version:1; identity:string; state:Metadata }
export interface Exchange { from:string; to:string; reports:string[]; verified?:string[] }
export interface BubbleTurn { index:number; speaker:string; to?:string; kind:string; act:Act|null; plan:Plan|null; pieces:string[]; text:string; time:number; exchanges:Exchange[] }
export interface NPCConversation { readonly status:'active'|'paused'|'stopped'|'complete'; readonly stopReason:string|null; readonly turnCount:number; next():BubbleTurn|null; pause():void; resume():void; stop(reason?:string):void; snapshot():ConversationSnapshot }
export function createNPCConversation(core:AgentCore,language:LanguageAdapter|(()=>LanguageAdapter),options:ConversationOptions&{participants:string[];beforeTurn?:()=>void}):NPCConversation;
export interface PartySnapshot { version:1; participants:string[]; cursors:Record<string,number>; core:CoreSnapshot }
export interface PartyOptions<R=unknown> { participants:string[]; languageModule:LanguageModule<R>; resources:R; languageOptions?:Metadata; saved?:PartySnapshot }
export interface PartySession<R=unknown> { core:AgentCore; readonly language:LanguageAdapter; syncKnowledge():void; addCharacter(id:string,resources?:R):void; refreshLanguage(resources:R):void; conversation(options?:ConversationOptions):NPCConversation; snapshot():PartySnapshot }
export interface ConversationWorld { readonly revision:number; readonly characterCount:number; readonly factCount:number; readonly schema:Domain; character(id:string):Character|undefined; addEntities(entities:Record<string,Metadata>):void; addCharacter(profile:Profile):string; addFacts(facts:Fact[]):void; knowledge(holder:string,after?:number):Fact[]; createSession<R>(options:PartyOptions<R>):PartySession<R> }
export function createConversationWorld(options?:{canon?:Canon;entities?:Record<string,Metadata>;predicates?:Record<string,Predicate>;facts?:Fact[];rules?:Rule[];profiles?:Profile[]}):ConversationWorld;
export function createPartySession<R>(world:ConversationWorld,options:PartyOptions<R>):PartySession<R>;
export function hearResponse(core:AgentCore,sender:string,receiver:string,plan:Plan):Evidence[];
export function sharePublication(core:AgentCore,sender:string,receiver:string,evidence:Evidence):Evidence|null;
export function simulateNPCConversation(core:AgentCore,language:LanguageAdapter,options:ConversationOptions&{mode:'ambient'}):{turns:BubbleTurn[];exchanges:Exchange[];stopReason:string|null};
export function simulateNPCConversation(core:AgentCore,language:LanguageAdapter,options:{initiator:string;partner:string;goal:Act;maxTurns?:number}):{turns:Array<{speaker:string;act:Act;plan:Plan|null;text:string;time:number}>;exchanges:Exchange[];stopReason:string};
export class MemoryStorage<T=unknown> { load():Promise<T|null>; save(value:T):Promise<void>; clear():Promise<void> }
export class IndexedDBStorage<T=unknown> extends MemoryStorage<T> { constructor(name?:string) }
