// Source data proposes senses/frames. Grammar and domain types must still resolve them.
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const norm=s=>s.toLocaleLowerCase('en').trim();
const contains=(text,word)=>new RegExp(`(^|[^a-z])${escape(word)}(?=$|[^a-z])`,'i').test(text);
export class LexicalIndex {
  constructor(pack={}) {
    this.pack=pack;this.mappings=pack.conceptMappings??[];this.entries=pack.wordnet?.entries??[];
    this.classes=new Map((pack.verbnet?.classes??[]).map(c=>[c.id,c]));
  }
  forms(lemma){
    const actual=this.entries.filter(e=>norm(e.lemma)===lemma).flatMap(e=>e.forms??[]);
    // Regular English morphology is an authored language rule; irregular forms above are sourced.
    const regular=lemma.includes(' ')?[]:[lemma+'s',lemma.endsWith('e')?lemma+'d':lemma+'ed',lemma.endsWith('e')?lemma.slice(0,-1)+'ing':lemma+'ing'];
    return [...new Set([lemma,...actual,...regular].map(norm))];
  }
  candidates(text){
    const value=norm(text),hits=[];
    for(const m of this.mappings){
      const words=m.approvedLemmas.flatMap(lemma=>this.forms(lemma)).filter(w=>contains(value,w));
      if(words.length)hits.push({concept:m.concept,words:[...new Set(words)],wordnetSynsets:m.wordnetSynsets,
        verbnetClasses:m.verbnetClasses,mappingOrigin:m.origin});
    }
    return hits;
  }
  frames(concept){
    const mapping=this.mappings.find(m=>m.concept===concept);
    return (mapping?.verbnetClasses??[]).flatMap(id=>[...this.classes.values()].filter(c=>c.id===id||c.id.startsWith(id+'-'))).flatMap(c=>c.frames.map(frame=>({classId:c.id,...frame})));
  }
  departureFrame(text,mentions,entities){
    if(mentions.length!==2)return null;
    const [a,b]=mentions;
    if(!['place','body','habitat','polity','region'].includes(entities[b.id]?.type))return null;
    const hit=this.candidates(text).find(c=>c.concept==='motion.leave');
    if(!hit)return null;
    const aEnd=a.index+a.length,bStart=b.index;
    const middle=norm(text.slice(aEnd,bStart));
    if(!hit.words.includes(middle)||norm(text.slice(0,a.index))||!/^\s*[.!?]?\s*$/.test(text.slice(b.index+b.length)))return null;
    const frame=this.frames('motion.leave').find(f=>f.children.find(n=>n.tag==='DESCRIPTION')?.attributes.primary==='NP V NP.initial_location');
    if(!frame)return null;
    return {act:{function:'assert',content:{predicate:'departed_from',args:{subject:a.id,place:b.id},polarity:true},temporal:'past_unspecified'},
      trace:{engine:'VerbNet frame + WordNet morphology',classId:frame.classId,frameId:frame.id,
        roles:{Theme:a.id,Source:b.id},wordnetSynsets:hit.wordnetSynsets,temporal:'past event; exact time unspecified'}};
  }
}
