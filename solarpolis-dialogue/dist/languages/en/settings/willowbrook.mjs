// Setting vocabulary and voices. Shared English grammar is NOT copied here.
const entity=(name,type,aliases=[])=>({name,type,aliases});
function ownership(language,raw){
  const text=raw.trim().toLowerCase().replace(/[.!?]+$/,'');
  const match=/^who (owns|looks after) (.+)$/.exec(text);
  if(!match)return null;
  // Resolve the complete noun phrase, not an arbitrary mention inside it.
  const ids=Object.entries(language.r.entities).filter(([,e])=>[e.name,...(e.aliases??[])].some(n=>n.toLowerCase()===match[2])).map(([id])=>id);
  if(ids.length!==1)return {function:'clarify',reason:ids.length?'ambiguous-meaning':'unsupported',candidates:ids};
  return {function:'ask',query:{predicate:match[1]==='owns'?'owns':'responsible_for',args:{subject:{$var:'owner'},object:ids[0]}}};
}
export const resources={
  clock:{startMinute:8*60},bindings:{located_at:'kept_at'},constructions:[ownership],
  entities:{ada:entity('Ada Reed','person',['ada']),moss:entity('Moss Bell','person',['moss']),
    lantern:entity('the brass lantern','object',['the lantern','lantern','brass lantern']),
    workshop:entity('the workshop','place',['workshop']),greenhouse:entity('the greenhouse','place',['greenhouse']),
    fair:entity('the village fair','event',['fair','the fair'])},
  predicates:{
    kept_at:{positive:'{subject} is in {place}',negative:'{subject} is not in {place}',evidential:true},
    starts_at:{positive:'{subject} starts at {minute}',negative:'{subject} does not start at {minute}'},
    owns:{positive:'{subject} owns {object}',negative:'{subject} does not own {object}',firstPerson:{positive:'I own {object}',negative:'I do not own {object}'}},
    responsible_for:{positive:'{subject} looks after {object}',negative:'{subject} does not look after {object}'},
    nature:{positive:'{subject} is {value}',negative:'{subject} is not {value}'}
  },
  explanations:{'ownership-care':'In our workshop, whoever owns a tool is responsible for looking after it.'},
  voices:{
    dry:{unknown:'Couldn’t tell you. I haven’t seen anything about it.',confirmed:'My note at {time} says {claim}.',
      report:'So you say {claim}. I’ll keep your word separate from my notes.',tentative:'Someone told me {claim}. That’s all I have.'},
    warm:{unknown:'Oh, I haven’t heard about that yet.',confirmed:'Last I heard, {claim}. That was at {time}.',
      report:'Ah, you’ve heard that {claim}. I’ll remember you told me.',tentative:'I hear {claim}, though I haven’t checked for myself.'}
  },
  social:{
    dry:{greeting:'Morning. Mind the loose handle on that stool.',greetingAgain:'Back again? Pull up the sound stool.',
      wellbeing:['Quite content. The kettle works again. Small victories.','Still content. The kettle hasn’t let me down yet.'],
      returnQuestion:'And you—how’s your morning?',identity:'Ada Reed. I mend things here. Some of them stay mended.',
      activity:'Replacing the lantern’s wick. Less glamorous than it sounds.',activity_reason:'It would be a shame to throw out a good lamp over a bit of string.',
      interest:'Old tools. You can usually see where someone’s thumb rested.',interest_reason:'They remember people in their own way. Worn handles, little repairs.',
      wellbeing_reason:'Something broken works again. That’s enough for one morning.',
      farewell:'Take care. And mind that handle.',repair:'Lost me there. What did you mean?',repairAgain:'I’m still not following. Try saying it another way.'},
    warm:{greeting:'Morning! Come in. I was just shaking the soil out of my cuffs.',greetingAgain:'Oh, hello again!',
      wellbeing:['Pretty good! A seedling finally came up this morning.','Still thinking about that seedling, honestly.'],
      returnQuestion:'How are things with you?',identity:'I’m Moss Bell. Mostly to be found in the greenhouse, talking to things that don’t answer.',
      activity:'Checking the seedlings. I keep pretending I’m not impatient.',activity_reason:'I planted them myself. Now I want to meet them.',
      interest:'Growing things in awkward little corners. There’s always one more pot’s worth of room.',interest_reason:'An empty corner becoming something alive—I never quite get used to it.',
      wellbeing_reason:'I thought those seeds had given up. Turns out they just needed another day.',farewell:'See you! I’ll be among the pots.',
      repair:'I think I missed a bit. What did you mean?',repairAgain:'Sorry, I haven’t caught your meaning yet. Could you try another way?'}
  }
};
