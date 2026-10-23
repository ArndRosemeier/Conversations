import {interpretSolarpolis} from './solarpolis-meaning.mjs';
import {resources as expansion} from './solarpolis-expanded-en.mjs';
import {entities as types} from './solarpolis-expanded.mjs';
export function expandEnglish(r){
  r.constructions=[interpretSolarpolis];
  r.clock={startMinute:16*60};
  r.predicates.located_at.evidential=true;
  r.predicates.reservation.evidential=true;
  const old=r.entities;
  r.entities={...old,...Object.fromEntries(Object.entries(expansion.entities).map(([id,e])=>[id,{...e,type:types[id]?.type??e.type}]))};
  r.entities.patient_margin.aliases=['the ship','ship'];
  r.entities.minds={...old.minds,aliases:['minds','mind-states']};
  r.entities.moon={name:'Earth’s Moon',type:'body',aliases:['lunar body']};
  r.entities.arrays.aliases.push('array','array operator','array operators','laser-array operator');
  r.entities.threnody_mind.aliases=['governing mind','the governing mind','mind of threnody'];
  r.entities.enceladus.aliases=['enceladus','reserve','the reserve'];
  r.entities.inner_system.aliases=['inner system','whole inner system','entire inner system'];
  r.entities.sails.aliases=['sail ships','sail travel','ship travel'];
  r.entities.launch_windows.aliases=['launch windows'];r.entities.braking_push.aliases=['braking push'];
  Object.assign(r.entities,{
    unconsented_copying:{name:'copying a mind without consent',type:'concept',aliases:['unconsented copying','unauthorized mind copying','copying minds without consent']},
    most_habitats:{name:'most habitats',type:'scope',aliases:['most habitats']},
    transit_history:{name:'transit history',type:'concept',aliases:['transit calendars','calendars','calendar','transit history']},
    acoustic_spaces:{name:'acoustic spaces',type:'concept',aliases:['acoustic spaces','acoustic exploration']}
  });
  r.predicates={...r.predicates,...expansion.predicates,
    departed_from:{positive:'{subject} left {place}',negative:'{subject} did not leave {place}'},
    norm_status:{positive:'{subject} is {value} in {scope}',negative:'{subject} is not {value} in {scope}'},
    welcomes_every_arrival:{positive:'{subject} personally welcomes every arrival',negative:'{subject} does not personally welcome every arrival'},
    welcomes_arrivals:{firstPerson:{positive:'I voluntarily help arrivals find their bearings'},positive:'{subject} voluntarily helps arrivals find their bearings'},
    same_individual:{firstPerson:{positive:'I am the same individual as {object}',negative:'I am a separate individual from {object}'},positive:'{subject} is the same individual as {object}',negative:'{subject} is a separate individual from {object}'}};
  r.predicates.governed_by.negative='{subject} is not governed by {object}';
  r.statements=expansion.statements;r.viewpointLabels=expansion.viewpointLabels;
  r.explanations={...expansion.explanations,'no-central-polity':'There is no central government of this entire region. A major polity’s influence does not make it the government of the whole region.'};
  r.intentQueries={AskPower:{predicate:'power_basis'},AskRule:{predicate:'recognized_because',args:{object:{$var:'reason'}}},AskPlayers:{predicate:'political_tier',args:{subject:{$var:'subject'},object:'major_player'}}};
  r.queryFacets={rights:['rights','recognizes_personhood','recognizes_person'],located_at:['located_at','situated_at'],origin:['origin','origin_category']};
  r.reasonPredicates=['power_basis','recognized_because','requires','constrained_by','relies_on'];
  const personal={
    precise:{coping:'I tend to turn to a small, absorbing problem. A calendar usually supplies one. It helps me put the rest down for a while.',welcome_reason:'I like showing someone why a route makes sense. Serein is more practiced at making a whole place feel welcoming.',interest_detail:'For me, a calendar is a record of choices. I want to know why this departure was possible and another was not.',invitation:'I would happily keep talking. You have given me a reason to look up from the calendars.',greeting_repair:'Ah, understood. Hello, then. I’m glad you stopped to talk.',appreciation:'I’m pleased it caught your interest.'},
    gentle:{coping:'I would give them room to say what feels unfamiliar, then offer one small place to begin. Arriving needn’t mean understanding everything at once.',welcome_reason:'I like watching a place become less strange to someone. Offering a little orientation gives us a beginning; the conversation can go wherever they choose.',interest_detail:'It is the difference between knowing a direction and feeling free to choose one. I enjoy helping with that.',invitation:'I’d enjoy staying with this a while. You don’t need to leave on my account.',greeting_repair:'I understand. Thank you for the hello; I’m glad you came over.',appreciation:'I’m glad that meant something to you.'},
    relational:{coping:'I tend to listen to a space before trying to answer it. Letting a sound finish can help me find room for my own thoughts.',welcome_reason:'I like a welcome that leaves room for an answer. Serein seems to understand that.',interest_detail:'I mean listening to how a place changes a sound, and how another voice answers it. A description in letters only gives you part of it.',invitation:'I’d like to keep talking. Quiet is welcome too, but I’m not asking you to leave.',greeting_repair:'Oh! Hello back. I was listening too hard for a question.',appreciation:'I’m glad it reached you. There is pleasure in having someone listen.'}
  };
  for(const [voice,lines] of Object.entries(personal))Object.assign(r.social[voice],lines);
  Object.assign(r.social.precise,{uncertainty:'We can check the distinction.',wellbeing:[...r.social.precise.wellbeing,'No change in my answer, but I appreciate the thought.']});
  Object.assign(r.social.gentle,{uncertainty:'We can take a moment to sort that out.',wellbeing:[...r.social.gentle.wellbeing,'Much the same. It’s pleasant to have this conversation.']});
  Object.assign(r.social.relational,{uncertainty:'Let’s listen to that a little more closely.',wellbeing:[...r.social.relational.wellbeing,'Curious as ever. And glad of the company.']});
  r.meaning={
    travel:{subject:'arrays',supportSubjects:['sails','lunar_arrays'],predicates:['enables','controls','requires','constrained_by','power_basis']},
    travelRoles:{array:'arrays',windows:'launch_windows',braking:'braking_push'},
    consent:{subject:'unconsented_copying',scope:'most_habitats'},
    welcoming:{predicate:'welcomes_arrivals'},
    identity:{predicate:'same_individual',governor:'threnody_mind'},
    interfaceTopic:'interface',homes:{iona:'selenipolis',serein:'threnody',rill:'krillix'},defaultShip:'patient_margin',
    personalTopics:{iona:['transit_history'],rill:['acoustic_spaces','long_song'],serein:['welcomes_arrivals']}
  };
}
