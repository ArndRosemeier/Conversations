// Entity recognition is lexical; sentence structure and meaning constructors
// come from the GF-compiled Conversation grammar. No engine or storage imports.
import {Conversation} from './grammar.mjs';
const concrete=Conversation.concretes.ConversationEng;
const normalize=text=>text.toLocaleLowerCase('en').replace(/[’‘]/g,"'").replace(/\s+/gu,' ').trim();
const word=ch=>!!ch&&/[\p{L}\p{N}_]/u.test(ch);

export function createGFParser(resources) {
  const entities=resources.entities??resources;
  const aliases=new Map();
  for(const [id,e] of Object.entries(entities)) for(const value of [e.name,...(e.aliases??[])]) {
    if(!value) continue;
    const alias=normalize(value);
    if(!aliases.has(alias)) aliases.set(alias,new Set());
    aliases.get(alias).add(id);
  }
  const names=[...aliases.keys()].sort((a,b)=>b.length-a.length);
  const intentQuery=(constructor,defaults,args={})=>{
    const configured=resources.intentQueries?.[constructor]??{};
    return {...defaults,...configured,args:{...(defaults.args??{}),...args,...(configured.args??{})}};
  };
  const surface=(text,bindings={})=>text.replace(/"(gfentity\d+)"/g,(_,token)=>bindings[token]??token);
  function lexicalize(text) {
    const matches=[];
    let output='',i=0;
    while(i<text.length) {
      const alias=names.find(name=>text.startsWith(name,i)&&!word(text[i-1])&&!word(text[i+name.length]));
      if(alias) {
        const token=`gfentity${matches.length}`;
        matches.push({token,alias,ids:[...aliases.get(alias)],start:i,end:i+alias.length});
        output+=token;i+=alias.length;
      } else output+=text[i++];
    }
    return {output,matches};
  }
  function parse(raw,context={}) {
    const text=normalize(raw).replace(/[.!?]+$/u,'').trim();
    if(/\bgfentity\d+\b/u.test(text)) return {status:'unsupported',acts:[],trees:[],trace:{engine:'GF',reason:'reserved-token'}};
    const {output,matches}=lexicalize(text);
    const named=new Map(matches.map(m=>[m.token,m.ids]));
    // A domain alias can also be a literal grammar terminal ("power", "rights",
    // "the major players"). Keep those readings instead of greedily destroying
    // them. Parse raw, fully lexicalized, and bounded mixed lexicalizations.
    const inputs=new Set([text,output]);
    const subsetCount=matches.length<=6?2**matches.length:0;
    const masks=subsetCount?Array.from({length:subsetCount},(_,i)=>i):
      matches.slice(0,62).map((_,skip)=>matches.map((_,i)=>i!==skip));
    for(const mask of masks) {
      let input='',end=0;
      for(let i=0;i<matches.length;i++) {
        const match=matches[i],replace=Array.isArray(mask)?mask[i]:!!(mask&(2**i));
        input+=text.slice(end,match.start)+(replace?match.token:match.alias);
        end=match.end;
      }
      inputs.add(input+text.slice(end));
    }
    const trees=[...inputs].flatMap(input=>concrete.parseString(input,'Act'));
    const candidates=[];
    let unresolved=false;
    const resolveRef=ref=>{
      if(ref.name==='Named') return named.get(ref.args[0]?.name.slice(1,-1))??[];
      if(ref.name==='You') return context.speaker?[context.speaker]:[];
      if(['She','He','They','It','That'].includes(ref.name)) {
        const ids=context.referents?.[ref.name.toLowerCase()]??(context.focus?[context.focus]:[]);
        if(!ids.length) unresolved=true;
        return Array.isArray(ids)?ids:[ids];
      }
      return [];
    };
    for(const tree of trees) {
      const refs=tree.args.map(resolveRef);
      if(refs.some(ids=>!ids.length)) continue;
      const combinations=refs.reduce((all,ids)=>all.flatMap(row=>ids.map(id=>[...row,id])),[[]]).slice(0,16);
      for(const ids of combinations) {
        const [subject,other]=ids,args=subject?{subject}:{};
        let act;
        switch(tree.name) {
          case 'AskLocation':act={function:'ask',query:{predicate:'located_at',args:{subject,place:{$var:'place'}}}};break;
          case 'AskAbout':act={function:'ask',query:{args}};break;
          case 'AskReason':act={function:'ask_reason',query:{args}};break;
          case 'AskPower':act={function:'ask_reason',query:intentQuery('AskPower',{predicate:'power'},args)};break;
          case 'AskRule':act={function:'ask_reason',query:intentQuery('AskRule',{predicate:'rule'},{subject,object:other})};break;
          case 'AskOpinion':act={function:'opinion',query:{args}};break;
          case 'AskTime':act={function:'ask',query:{predicate:'starts_at',args}};break;
          case 'AskRights':act={function:'ask',query:{predicate:'rights',args}};break;
          case 'AskOrigin':act={function:'ask',query:{predicate:'origin',args}};break;
          case 'AskCompare':act={function:'compare',query:{args:{subject,other}}};break;
          case 'AssertLocation':case 'DenyLocation':act={function:'assert',content:{predicate:'located_at',args:{subject,place:other},polarity:tree.name==='AssertLocation'}};break;
          case 'AskPlayers':act={function:'ask_list',query:intentQuery('AskPlayers',{predicate:'major_players',args:{}})};break;
          case 'AskEvidence':act={function:'ask_evidence'};break;
          case 'AskAgreement':act={function:'ask_consensus'};break;
          case 'Greet':act={function:'greet'};break;
          case 'Thank':act={function:'thank'};break;
          case 'Agree':act={function:'agree'};break;
          case 'Disagree':act={function:'disagree'};break;
        }
        if(act) candidates.push({act,tree:tree.print(),canonical:surface(concrete.linearize(tree),Object.fromEntries(matches.map(m=>[m.token,entities[m.ids[0]]?.name??m.alias])))});
      }
    }
    const unique=[...new Map(candidates.map(c=>[JSON.stringify(c.act),c])).values()];
    return {status:unique.length>1?'ambiguous':unique.length?'parsed':unresolved?'needs-context':'unsupported',
      acts:unique.map(c=>c.act),trees:unique.map(c=>c.tree),
      trace:{engine:'GF',grammar:'ConversationEng',input:output,inputs:[...inputs],entities:matches,canonical:unique.map(c=>c.canonical)}};
  }
  return {parse,parseWithGF:parse,linearize(treeText,bindings={}) {
    return surface(concrete.linearize(Conversation.abstract.parseTree(treeText,'Act')),bindings);
  }};
}
