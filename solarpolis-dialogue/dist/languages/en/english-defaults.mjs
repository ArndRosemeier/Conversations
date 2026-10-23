// Generic English fallbacks, independent of any setting or character.
export const defaultVoice={
  greeting:'Hello.',thanks:'You’re welcome.',unknown:'I don’t know about that.',
  confirmed:'As of {time}, {claim}.',tentative:'I’ve heard that {claim}, but I haven’t checked it.',
  report:'I’ll remember that you said {claim}.',
  stances:{undecided:'I haven’t made up my mind.'},
  repairs:{unsupported:'I didn’t quite follow that. Could you put it another way?',
    'missing-context':'Which thing do you mean?', 'which-time':'When does what happen?',
    'no-pending-offer':'What are you referring to?',empty:'What’s on your mind?'}
};
export const defaultSocial={
  greeting:'Hello. Good to see you.',greetingAgain:'Hello again.',
  wellbeing:['I’m all right, thanks.'],returnQuestion:'How are you?',
  boundary:'Of course. We can leave it there.',company:'I can stay a while.',farewell:'See you later.',
  repair:'I didn’t quite follow that. Could you put it another way?',repairAgain:'I’m still missing your meaning. What did you have in mind?',
  responses:{positive:'Glad to hear it.',negative:'That sounds rough. Would you like some company?',
    tired:'A long day, then?',worried:'That sounds difficult. Would you like some company?',neutral:'One of those days.'},
  sourceReply:'I got that from {source}: {claim}. That was at {time}.',
  testimony:'I heard it from {source}: {claim}. I haven’t checked it myself.',
  npc:{opening:'Hello, {partner}. How are you?',question:'{question}',source:'How do you know?',
    verified:'Thanks. I’ve read it now.',conflict:'That differs from what I knew. I’ll keep your report separate.',
    reported:'Thanks. I’ll remember where I heard it.',unknown:'Perhaps we’ll find out later.'}
};
