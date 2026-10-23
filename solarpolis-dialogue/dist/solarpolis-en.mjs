import {expandEnglish} from './solarpolis-integration-en.mjs';
import {socialEnglish} from './solarpolis-social-en.mjs';
const e=(name,type,aliases=[])=>({name,type,aliases});
export const resources={
  social:socialEnglish,
  entities:{
    threnody:e('Threnody','habitat',['the long afternoon of threnody']),
    selenipolis:e('Selenipolis','polity',['the moon','lunar society']),krillix:e('Krillix','habitat'),
    aurelipolis:e('Aurelipolis','habitat'),tessivorn:e('Tessivorn','habitat'),halvorn:e('the Halvorn','mind',['halvorn']),
    enceladus:e('Enceladus','moon'),velloran:e('Velloran Reach','polity',['velloran']),
    minds:e('mind-states','concept',['minds','mind copying','copy a mind','copying minds','mind copies','backups','personhood']),
    arrays:e('laser arrays','concept',['arrays','laser array']),long_song:e('the Long Song','concept',['long song']),
    interface:e('the neural interface','concept',['interface','translation','translator']),
    liberators:e('the Liberators','movement',['liberators']),arks:e('the twenty arks','project',['arks','arkships','ark project','pritt']),
    serein:e('Serein','person'),iona:e('Iona Venn','person',['iona']),rill:e('Rill','person'),neris:e('Neris','person'),
    commons:e('the Arrival Commons','place',['commons']),echo_gallery:e('Echo Gallery','place',['echo gallery']),
    current_court:e('Current Court','place',['current court']),flow_chamber:e('Flow Chamber','place',['flow chamber']),
    exchange:e('the acoustic exchange','event',['exchange','meeting','session','event']),
    patient_margin:e('Patient Margin','ship',['the ship','ship','slot','reservation','booking'])
  },
  predicates:{
    located_at:{positive:'{subject} is in {place}',negative:'{subject} is not in {place}'},
    starts_at:{positive:'{subject} starts at {minute}'},
    reservation:{positive:'the lunar reservation for {subject} is {status}',negative:'the lunar reservation for {subject} is not {status}'},
    protects:{positive:'{subject} protects {object}; some welcome that shelter and others resent the dependence'},
    nature:{positive:'{subject} is {value}'},governance:{positive:'{subject} is governed by {value}'},
    sanctuary:{positive:'{subject} welcomes {value}'},rights:{positive:'{subject}: {value}'},practice:{positive:'{subject}: {value}'},
    restriction:{positive:'{subject}: {value}'},purpose:{positive:'{subject}: {value}'},origin:{positive:'{subject}: {value}'},pursuit:{positive:'{subject}: {value}'}
  },
  values:{
    bubble_habitat:'{subject} is a bubble habitat, formally The Long Afternoon of Threnody',
    gentle_ai:'{subject} is governed by a gentle, eccentric AI Mind',
    endangered_minds:'{subject} is especially welcoming to AIs and uplifts escaping harsher jurisdictions',
    oldest_offworld:'{subject} is the oldest continuous offworld settlement and a major lunar array power',
    schedule_authority:'the Schedule Authority is the effective government of {subject}; it publishes transit windows years ahead',
    urgency_costs:'on {subject}, urgency raises transit costs; timing is a source of political power',
    dolphin_water_habitat:'{subject} is a young, dolphin-governed water-volume habitat',
    city_mind:'{subject} is a singular cyborg intelligence that inhabits and governs Tessivorn as its body',
    mercury_cylinder:'{subject} is a prosperous, authoritarian O’Neill cylinder orbiting Mercury',
    origin_based:'in {subject}, biological origin determines personhood; born-digital AIs are treated as tools without rights',
    twenty_seedships:'the Aurelipolis project comprises twenty seed-ships; each is intended to carry a copy of Alexander Pritt, embryos, and hibernating human founders to an otherwise untargeted star system',
    unconsented_copy_taboo:'copying or modifying a mind without consent is deeply taboo in the vast majority of habitats',
    transfer_distinction:'mind transfer destroys the original as it moves a mind to new substrate; it is more widely accepted than copying, although contested',
    local_jurisdiction:'legal personhood depends on the local jurisdiction; there is no universal system-wide guarantee',
    massive_airless:'laser arrays sit on massive bodies to absorb recoil and strongly prefer airless sites',
    travel_leverage:'array operators control access to cheap sail travel; denying a braking push can endanger a ship',
    collective_acoustic_record:'the Long Song is an ever-growing collective acoustic record: history, art, and memory, without a deity',
    collective_additive:'contributions to the Long Song are recorded, shared, and layered into a collective work',
    lossy_translation:'the neural interface efficiently translates propositions but omits much social and acoustic context by default; either participant can request expanded translation',
    living_ocean:'Enceladus has genuine multicellular life in its subsurface ocean',
    closed_reserve:'Velloran Reach protects Enceladus as a closed nature reserve; some Krillix dolphins contest the lack of access',
    forced_deconditioning:'the Liberators try to undo Aurelipolis conditioning, usually through forced mind rewriting; even many opponents of Aurelipolis condemn that violation of consent',
    acoustic_exchange:'the acoustic exchange is today’s informal sharing of listening spaces and Long Song contributions',
    visitor_space:'the Arrival Commons is a visitor space with dry rooms connected to continuously circulating aquatic chambers',
    welcome_minds:'Serein voluntarily helps arriving minds find their bearings; Serein is distinct from the governing Mind',
    transit_history:'Iona studies transit history and calendars for pleasure; this is a chosen pursuit, not wage employment',
    acoustic_cartography:'Rill explores acoustic spaces and contributes to the Long Song, participating here from moving water',
    visiting_ai_conservator:'Neris is a visiting born-digital acoustic conservator, using a mobile body; no mind copy is involved'
  },
  voices:{
    precise:{
      factLeads:['As I understand it, ','The way I understand it: ','I’d put it this way. '],
      greeting:'Good afternoon. What would you like to establish?',thanks:'You are welcome.',
      confirmed:'The notice I have for {time} says {claim}.',tentative:'Your report says {claim}. I have no independent confirmation.',
      report:'You’re saying {claim}. I’ll keep that in mind, though I haven’t checked it.',
      unknown:'I don’t know. I haven’t come across anything I’d trust on that point.',
      stances:{supportive:'I consider it a sound arrangement.',opposed:'I object to it.',cautious:'I would separate the available facts from the proposed justification.',protective:'Consent is the relevant boundary.',undecided:'I have not reached a considered position.',curious:'It merits closer examination.'},
      repairs:{unsupported:'I’m not sure what you mean. Could you put it another way?', 'missing-context':'Which claim would you like me to substantiate?', 'which-time':'Do you mean the exchange’s starting time? Ask “When is the exchange?”', 'no-pending-offer':'There is no pending question or offer to which that answers.',empty:'Please state a question.'}
    },
    gentle:{
      factLeads:['Here is what I know. ','A little context may help. ','I can offer this much. '],
      greeting:'Hello. There is room for another question.',thanks:'Gladly.',
      confirmed:'The last I heard, {claim}. That was the update for {time}.',tentative:'You tell me {claim}. I can pass that on as your report, rather than as something I have checked.',
      report:'Thank you. I will remember that you said {claim}, with your name attached to the uncertainty.',
      unknown:'That lies beyond what I have learned. I would rather leave the space open than fill it with a guess.',
      stances:{supportive:'There is something worth caring for in that arrangement.',opposed:'I cannot be comfortable with what it asks of a person.',cautious:'Good intentions deserve questions, too.',protective:'A mind should have a say in what is done to it.',undecided:'I have no settled view to offer.',curious:'I would like to understand it better.'},
      repairs:{unsupported:'I lost the thread there. What did you mean?', 'missing-context':'Which part would you like a source for?', 'which-time':'Do you mean when the exchange starts? “When is the exchange?” will make that clear.', 'no-pending-offer':'I may have missed what you are agreeing to. Could you name it?',empty:'Take your time. What would you like to ask?'}
    },
    relational:{
      factLeads:['This is what has reached me. ','Let me put the pieces beside each other. ','I hear it this way. '],
      greeting:'I hear you. What shall we follow?',thanks:'An answer offered, an answer heard.',
      confirmed:'I heard {claim}, from the update for {time}.',tentative:'Following your report, {claim}. I have not checked that current for myself.',
      report:'I hear you: {claim}. I can follow that provisionally. I will keep your report attached to it.',
      unknown:'I have not heard enough to answer. Will you bring the question back if you learn more?',
      stances:{supportive:'That is something I want to keep contributing to.',opposed:'That cuts someone out of the exchange. I object.',cautious:'I can feel the shelter and the constraint together.',protective:'A mind is a participant. Its answer matters.',undecided:'I have not found my position on that yet.',curious:'I want to explore it carefully, with others able to answer back.'},
      repairs:{unsupported:'That didn’t quite reach me. What did you mean?', 'missing-context':'Which answer should we listen back to?', 'which-time':'The exchange’s starting time? Ask “When is the exchange?” so I follow the right thread.', 'no-pending-offer':'Yes to which part? Give me the subject again.',empty:'I am listening.'}
    }
  }
};

expandEnglish(resources);
