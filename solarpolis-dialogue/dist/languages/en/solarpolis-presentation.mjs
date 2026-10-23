// English presentation for the Solarpolis demo host.
export const characterPresentation={
  "serein": {
    "name": "Serein",
    "initials": "SE",
    "kind": "Born-digital AI",
    "role": "A welcome freely offered",
    "home": "Threnody",
    "introduction": "Hello. I’m Serein. I help arriving minds find their bearings, but I’m quite happy to be distracted by a conversation.",
    "location": "Arrival Commons",
    "description": "Patient, gently wry, attentive to consent. A separate individual from Threnody’s governing Mind."
  },
  "iona": {
    "name": "Iona Venn",
    "initials": "IV",
    "kind": "Human · Selenipolis",
    "role": "A collector of good timing",
    "home": "Selenipolis",
    "introduction": "Iona Venn. I’m from Selenipolis. I collect transit histories, mostly for the pleasure of getting lost in them.",
    "location": "Arrival Commons",
    "description": "Exact and courteous, with little patience for avoidable urgency. A visitor pursuing transit history for pleasure."
  },
  "rill": {
    "name": "Rill",
    "initials": "RI",
    "kind": "Uplifted dolphin · Krillix",
    "role": "A listener who answers",
    "home": "Krillix",
    "introduction": "Rill, approximately. My whistle fits less neatly into letters. I’m listening through the text link. What caught your attention?",
    "location": "Flow Chamber · local text link",
    "description": "Playful, relational, acoustically minded. English arrives through the neural interface; Rill speaks for themself."
  }
};
export const scenario = {
  title:'The Arrival Commons',host:'The Long Afternoon of Threnody',
  premise:'An acoustic exchange, three visitors, and a notice that not everyone has read.',
  addition:'The commons, all four named visitors, rooms, exchange, ship, and mutable events are sample additions. The wider polities and cultural principles come from your world bible.',
  delayNote:'12 minutes is an illustrative scenario link budget, not a canonical orbit or calculated ephemeris. No ship travels during this test. The reservation concerns a future journey.',
  starterQueries:[
    {label:'Where is the exchange?',act:{function:'ask',query:{predicate:'located_at',args:{subject:'exchange',place:{$var:'place'}}}}},
    {label:'How are you today?',act:{function:'social',topic:'wellbeing'}},
    {label:'What is Threnody like?',act:{function:'ask',query:{args:{subject:'threnody'}}}},
    {label:'Are AIs safe in Aurelipolis?',act:{function:'ask',query:{predicate:'rights',args:{subject:'aurelipolis'}}}},
    {label:'Tell me about the Long Song.',act:{function:'ask',query:{args:{subject:'long_song'}}}},
    {label:'Is the ship’s slot confirmed?',act:{function:'ask',query:{predicate:'reservation',args:{subject:'patient_margin'}}}},
    {label:'Where is Rill?',act:{function:'ask',query:{predicate:'located_at',args:{subject:'rill',place:{$var:'place'}}}}}
  ]
};
