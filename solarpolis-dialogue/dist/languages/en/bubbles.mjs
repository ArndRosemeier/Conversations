// All language-specific profile voices and bubble segmentation live here.
const voices={
  warm:{greeting:['Oh, hello! How are you doing?','Good to see you. How’s your day going?','Hello there. How have you been?'],wellbeing:['Pretty good. A little company helps.','Doing all right. I’m glad we stopped to talk.','A bit tired, but happy to see you.'],reciprocal:['Much the same here. It’s nice to slow down.','I’m well, thanks. No rush today.','I could use a quiet moment myself.'],reflection:['Sometimes a little company is enough.','I like having time to stop and talk.','A quiet moment can make a whole day better.'],response:['I know what you mean.','Yes. I could use more of that.','I’m glad you said that.'],opinion:['I can see why you enjoy it.','That sounds like time well spent.','I like the sound of that.']},
  reserved:{greeting:['Hello. How are things?','Good to see you. Doing all right?','Hello. How’s your day?'],wellbeing:['All right. A quiet day suits me.','A little tired. Nothing much to say.','Well enough. Thanks for asking.'],reciprocal:['About the same.','I’m all right too.','Quietly getting along.'],reflection:['I like a little space to think.','Silence can be comfortable too.','I don’t always feel like filling the quiet.'],response:['Yes. That makes sense.','I understand that.','I think so too.'],opinion:['I can see the appeal.','That sounds pleasant.','Something to think about.']},
  curious:{greeting:['Hello! How has your day been?','Oh, hello. What kind of day are you having?','There you are. How are things?'],wellbeing:['Good. I’m in the mood to try something new.','A little restless, actually. How about you?','Fine. My thoughts keep wandering.'],reciprocal:['I know that feeling. I’m a little restless too.','Doing well. I’m glad we crossed paths.','I’m all right. Happy to have someone to talk to.'],reflection:['I wonder how much we miss by hurrying.','I like leaving room for something unexpected.','There’s usually more to things than I first notice.'],response:['That’s an interesting way to put it.','I hadn’t thought of it like that.','Yes, I’d like to think about that some more.'],opinion:['I might like to try that sometime.','That gives me something to think about.','I can see how that would hold your attention.']},
  dry:{greeting:['Hello. Surviving the day?','Well, hello. How goes it?','There you are. How’s life treating you?'],wellbeing:['Still here. I count that as a decent start.','Quite well. I’m trying not to make a habit of complaining.','A little tired. I’ll spare you the full account.'],reciprocal:['Likewise. Nothing dramatic to report.','I’m fine. A wonderfully uneventful answer.','Much the same. I’ll take it.'],reflection:['I’m getting rather good at taking my time.','A pause is an underrated achievement.','Doing nothing in a hurry sounds exhausting.'],response:['Fair enough. I won’t argue with that.','That seems a sensible use of a day.','You have a point. Annoying, but true.'],opinion:['There are worse ways to spend an afternoon.','That sounds worth the trouble, at least.','I’ll admit that has a certain appeal.']},
  lively:{greeting:['Hey! How are you today?','Oh, hey! Good day so far?','Hello! How’s everything going?'],wellbeing:['Good! I’ve got a bit of energy to spare.','Pretty well. I’m itching to do something.','A bit worn out, but I’m happy to stop for a chat.'],reciprocal:['I’m good too. Glad I caught you!','Same here. It’s good to stop for a minute.','Doing all right. Better with company.'],reflection:['I like a day with room for a surprise.','I find it hard to sit still for long.','Sometimes I just want to change the pace.'],response:['Yes! I know that feeling.','I like the way you put that.','That sounds about right to me.'],opinion:['That sounds lovely!','I can get behind that.','Now that sounds like a good way to spend some time.']}
};
const pursuits={
  orchard_keeping:{name:'orchard keeping',reasons:['I like watching things grow at their own pace.','There’s something calming about tending trees.','I enjoy the patient work of caring for trees.']},
  hiking:{name:'hiking',reasons:['I like having time to notice what’s around me.','I enjoy seeing what’s beyond the next bend.','It helps me slow my thoughts down.']},
  music:{name:'music',reasons:['I like how a familiar tune can still surprise me.','It gives my thoughts somewhere to go.','I enjoy finding a rhythm I can settle into.']}
};
export function splitBubbles(text){
  // Preserve every word, polarity and qualifier. Long host prose may span pieces.
  const sentences=String(text).trim().match(/[^.!?]+[.!?]+(?:[”’"']+)?|[^.!?]+$/gu)??[];
  const pieces=[];
  for(const raw of sentences){
    let piece='';
    for(const word of raw.trim().split(/\s+/u)){
      if(Array.from(word).length>90){
        if(piece){pieces.push(piece);piece='';}
        const points=Array.from(word);while(points.length>90)pieces.push(points.splice(0,90).join(''));piece=points.join('');
      }else if(Array.from(piece+(piece?' ':'')+word).length>90){pieces.push(piece);piece=word;}
      else piece+=(piece?' ':'')+word;
    }
    if(piece)pieces.push(piece);
  }
  return pieces;
}
export function realizeBubble(language,move){
  const p=move.profile??{},voice=voices[p.temperament]??voices.warm;
  const select=(items,salt=0)=>items[(move.variant+salt) % items.length];
  const pursuit=language.r.pursuits?.[move.pursuit]??pursuits[move.pursuit];
  const activity=pursuit?.name??'my own projects';
  let text;
  switch(move.kind){
    case 'greeting':text=select(voice.greeting);break;
    case 'wellbeing':text=select(voice.wellbeing);break;
    case 'reciprocal':text=select(voice.reciprocal);break;
    case 'pursuit':text=select([`I keep coming back to ${activity}.`,`I’ve been thinking about ${activity}.`,`I’d like to spend more time on ${activity}.`]);break;
    case 'pursuit-question':text=select(['What do you enjoy most about it?','What draws you to it?','What is it you like about that?']);break;
    case 'pursuit-answer':text=select(pursuit?.reasons?.length?pursuit.reasons:['I like having something that’s mine to work on.','It gives me a little room to think.']);break;
    case 'opinion':text=select(voice.opinion);break;
    case 'home':text=select([`I like having ${language.name(move.home)} to come back to.`,`Sometimes I just want a quiet evening in ${language.name(move.home)}.`]);break;
    case 'home-response':text=select(['It’s good to have somewhere you feel at home.','That sounds rather nice.','I can understand that.']);break;
    case 'reflection':{
      const body={grown_human:'I could use a little rest.',shell:'I feel at home in this shell.',drone_person:'I’m quite comfortable in this body.'}[p.bodyKind];
      const age={young:'I still have so many things I want to try.',adult:'I like making time for things I care about.',elder:'I’ve grown rather fond of taking my time.'}[p.ageGroup];
      const themes={pace:select(voice.reflection),company:'I’m glad we stopped for a little company.',possibility:'I like leaving room for something unexpected.',rest:p.temperament==='dry'?'I’m ready for a pause. A thoroughly modest ambition.':'I could use a little rest.',embodiment:body??'I’m comfortable as I am.',experience:age??'I like making time for things I care about.'};
      text=themes[move.reflectionTopic]??select([...voice.reflection,...body?[body]:[],...age?[age]:[]]);break;
    }
    case 'reflection-response':text={company:'So am I. It’s nice to have a moment together.',possibility:'A little variety does help.',rest:'Then let’s take a moment. There’s no rush.',embodiment:'It’s good to feel comfortable with yourself.',experience:'It’s good to have something you enjoy.'}[move.reflectionTopic]??select(voice.response);break;
    case 'question':text=language.r.bubbleQuestions?.[move.act.query.predicate]?.replace(/\{(\w+)\}/g,(_,key)=>language.name(move.act.query.args?.[key]))??language.label(move.act);break;
    case 'answer':{
      const groups=move.plan?.results??[];
      text=groups.length?groups.map(g=>{
        const evidence=g.primary;
        const claim=language.clause(evidence,move.speaker);
        const lead=evidence.certainty==='reported'?`I heard that ${claim}`:evidence.certainty==='inferred'?`I think ${claim}`:claim;
        return language.sentence(lead)+(g.conflict?' I’ve also heard something different.':'');
      }).join(' '):select(['I don’t know, actually.','You’ve got me there. I’m not sure.','I haven’t heard about that.']);break;
    }
    case 'source-question':text=select(['How did you hear about that?','Oh? How do you know?','Where did you hear that?']);break;
    case 'source':{
      const e=move.evidence,s=e?.source??{};
      if(e?.certainty==='inferred')text='That’s how it looks to me. I could be wrong.';
      else if(s.speaker)text=`${language.name(s.speaker)} told me. I haven’t checked it myself.`;
      else if(s.kind==='common-knowledge')text='It’s common knowledge around here.';
      else if(s.kind==='observation')text='I saw it myself.';
      else if(s.kind==='received-signal')text='I got a message about it.';
      else if(s.kind==='publication'||s.kind==='shared-publication')text=select(['I read about it.','I came across it in something I read.']);
      else text='That’s what I remember. I can’t place where I heard it.';
      break;
    }
    case 'acknowledge':text=select(['Ah, I see.','Thanks. I’ll bear that in mind.','Right. Thanks for telling me.']);break;
    case 'unknown-response':text=select(['Fair enough. I was just wondering.','No worries. We can ask around later.','Neither do I. Something to find out.']);break;
    default:throw new Error(`Unknown English bubble move: ${move.kind}`);
  }
  const pieces=splitBubbles(text),combined=[];
  for(let i=0;i<pieces.length;i++){
    if(i+1<pieces.length&&/[.!?]$/.test(pieces[i])&&Array.from(pieces[i]+' '+pieces[i+1]).length<=90)combined.push(pieces[i++]+' '+pieces[i]);
    else combined.push(pieces[i]);
  }
  return combined;
}

// Small hosts need only names and templates, not authored character speeches.
export function createEnglishResources({entities={},predicates={},pursuits:customPursuits={},bubbleQuestions={}}={}){
  return {entities:Object.fromEntries(Object.entries(entities).map(([id,e])=>[id,typeof e==='string'?{name:e}:e])),predicates,voices:{generated:{}},pursuits:customPursuits,bubbleQuestions};
}
