// Semantic discourse operations. No language, game, browser, or global truth access.
const copy=value=>structuredClone(value);
const sameArgs=(a,b)=>Object.keys(a).length===Object.keys(b).length&&Object.entries(a).every(([k,v])=>b[k]===v);
export function respondDiscourse(core,actor,act){
  const context=core.state.contexts[actor.id];
  const finish=plan=>{
    plan={id:core.next('plan'),holder:actor.id,results:[],time:core.state.time,...plan};
    context.turn++;context.lastAct=act.id??plan.id;
    core.state.history.push({id:core.next('turn'),holder:actor.id,time:core.state.time,act:copy(act),plan:copy(plan)});return plan;
  };
  if(act.function==='confirm_reference')return finish({function:'confirm_reference',subject:act.subject,confirmed:(context.lastResults??[]).some(e=>e.atom.args.subject===act.subject),decision:"decision.confirm-reference"});
  if(['evidence_requirements','ask_count_unknown'].includes(act.function))return finish({function:act.function,decision:"decision.knowledge-boundary"});
  if(act.function==='qualify_report'){
    const report=core.state.evidence.find(e=>e.id===context.lastReportId&&e.holder===actor.id);
    if(report){report.qualifications??=[];report.qualifications.push({verification:act.verification,learnedAt:core.state.time,speaker:act.speaker??'player'});}
    return finish({function:'qualify_report',report:report?copy(report):null,decision:"decision.qualify-testimony"});
  }
  if(act.function==='set_topic'){
    if(!core.domain.entities[act.subject])throw new Error('Unknown topic');
    context.focus=act.subject;context.lastQuery={args:{subject:act.subject}};
    return finish({function:'set_topic',decision:"decision.set-topic"});
  }
  if(act.function==='ask_access'){
    const plan=core.respond(actor.id,{...act,function:'ask'});
    plan.function='ask_access';return plan;
  }
  if(act.function==='sequence'){
    if(!Array.isArray(act.acts)||act.acts.length>6||act.acts.some(a=>a.function==='sequence'))throw new Error('Invalid semantic turn sequence');
    for(const child of act.acts)if(child.function==='assert')core.validate(child.content);
    const plans=act.acts.map((a,i)=>core.respond(actor.id,{...a,speaker:act.speaker??a.speaker,reciprocate:i===act.acts.length-1?a.reciprocate:false}));
    return finish({function:'sequence',plans,results:plans.flatMap(p=>p.results),decision:"decision.sequence"});
  }
  if(act.function==='remember_report'){
    const report=core.state.evidence.find(e=>e.id===context.lastReportId&&e.holder===actor.id);
    return finish({function:'remember_report',report:report?copy(report):null,decision:"decision.recall-report"});
  }
  if(act.function==='verify'||act.function==='check_report'){
    const report=core.state.evidence.find(e=>e.id===context.lastReportId&&e.holder===actor.id);
    const content=act.content??(act.function==='check_report'?report?.atom:null);
    if(!content)return finish({function:'clarify',reason:'missing-context',decision:"decision.missing-proposition"});
    core.validate(content);
    const schema=core.schemas[content.predicate],keyArgs=Object.fromEntries(schema.keyRoles.map(k=>[k,content.args[k]]));
    const evidence=core.beliefs(actor.id,{predicate:content.predicate,args:keyArgs}).flatMap(g=>{
      const e=g.primary.certainty==='reported'?g.confirmed:g.primary;
      return e?[{...g,primary:e}]:[];
    });
    const supporting=evidence.filter(g=>sameArgs(g.primary.atom.args,content.args)&&(g.primary.atom.polarity??true)===(content.polarity??true));
    const opposing=evidence.filter(g=>sameArgs(g.primary.atom.args,content.args)?(g.primary.atom.polarity??true)!==(content.polarity??true):(g.primary.atom.polarity??true)&&(content.polarity??true));
    const outcome=supporting.length&&opposing.length?'conflicted':supporting.length?'supported':opposing.length?'opposed':'unknown';
    context.focus=act.focus??content.args.subject;context.lastQuery={predicate:content.predicate,args:keyArgs};
    context.lastProposition=copy(content);
    const location=[...supporting,...opposing].find(g=>g.primary.atom.predicate===(core.domain.discourse?.locationPredicate??'located_at')&&(g.primary.atom.polarity??true));
    if(location)context.lastPlace=location.primary.atom.args.place;
    return finish({function:'verify',query:copy(context.lastQuery),content:copy(content),outcome,report:act.function==='check_report'?copy(report):undefined,results:[...supporting,...opposing],decision:"decision.verify"});
  }
  return null;
}
