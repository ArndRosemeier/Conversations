// Solarpolis is replaceable data, never imported by the agent core.
import {expandDomain} from './solarpolis-integration.mjs';
import {socialProfiles} from './solarpolis-social.mjs';
const canon = section => ({kind:'canon',source:'SOLARPOLIS — WORLD BIBLE',section});
const addition = {kind:'sample',source:'Arrival Commons sample additions'};
const fact = (id,predicate,subject,value,section,extra={}) => ({id,atom:{predicate,args:{subject,...value},polarity:true},validFrom:0,validTo:null,origin:section?canon(section):addition,...extra});
export const domain = {
  id:'solarpolis-arrival-commons',version:1,
  entities:{
    threnody:{type:'habitat'},selenipolis:{type:'polity'},krillix:{type:'habitat'},aurelipolis:{type:'habitat'},
    tessivorn:{type:'habitat'},halvorn:{type:'mind'},enceladus:{type:'moon'},velloran:{type:'polity'},
    minds:{type:'concept'},arrays:{type:'concept'},long_song:{type:'concept'},interface:{type:'concept'},liberators:{type:'movement'},arks:{type:'project'},
    serein:{type:'person'},iona:{type:'person'},rill:{type:'person'},neris:{type:'person'},
    commons:{type:'place'},echo_gallery:{type:'place'},current_court:{type:'place'},flow_chamber:{type:'place'},
    exchange:{type:'event'},patient_margin:{type:'ship'}
  },
  predicates:{
    located_at:{roles:{subject:'entity',place:'entity'},keyRoles:['subject']},
    starts_at:{roles:{subject:'entity',minute:'number'},keyRoles:['subject']},
    reservation:{roles:{subject:'entity',status:'string'},keyRoles:['subject']},
    nature:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    governance:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    sanctuary:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    rights:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    practice:{roles:{subject:'entity',value:'string'},keyRoles:['subject','value']},
    protects:{roles:{subject:'entity',object:'entity'},keyRoles:['subject','object']},
    restriction:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    purpose:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    origin:{roles:{subject:'entity',value:'string'},keyRoles:['subject']},
    pursuit:{roles:{subject:'entity',value:'string'},keyRoles:['subject']}
  },
  characters:[
    {id:'serein',name:'Serein',initials:'SE',kind:'Born-digital AI',role:'A welcome freely offered',home:'Threnody',
      introduction:'Hello. I’m Serein. I help arriving minds find their bearings, but I’m quite happy to be distracted by a conversation.',
      personality:{detail:3,testimony:'cautious',directness:0.5,affiliation:0.9},
      attitudes:{aurelipolis:'opposed',minds:'protective',liberators:'cautious',enceladus:'cautious',threnody:'supportive'},
      color:'sage',voice:'gentle',location:'Arrival Commons',
      description:'Patient, gently wry, attentive to consent. A separate individual from Threnody’s governing Mind.'},
    {id:'iona',name:'Iona Venn',initials:'IV',kind:'Human · Selenipolis',role:'A collector of good timing',home:'Selenipolis',
      introduction:'Iona Venn. I’m from Selenipolis. I collect transit histories, mostly for the pleasure of getting lost in them.',
      personality:{detail:2,testimony:'strict',directness:0.9,affiliation:0.4},
      attitudes:{arrays:'supportive',selenipolis:'supportive',aurelipolis:'cautious',liberators:'opposed',minds:'protective'},
      color:'amber',voice:'precise',location:'Arrival Commons',
      description:'Exact and courteous, with little patience for avoidable urgency. A visitor pursuing transit history for pleasure.'},
    {id:'rill',name:'Rill',initials:'RI',kind:'Uplifted dolphin · Krillix',role:'A listener who answers',home:'Krillix',
      introduction:'Rill, approximately. My whistle fits less neatly into letters. I’m listening through the text link. What caught your attention?',
      personality:{detail:2,testimony:'provisional',directness:0.65,affiliation:0.95},
      attitudes:{long_song:'supportive',krillix:'supportive',enceladus:'curious',halvorn:'cautious',minds:'protective',aurelipolis:'opposed'},
      color:'blue',voice:'relational',location:'Flow Chamber · local text link',
      description:'Playful, relational, acoustically minded. English arrives through the neural interface; Rill speaks for themself.'}
  ],
  facts:[
    fact('c-threnody','nature','threnody',{value:'bubble_habitat'},'VIII · Threnody'),
    fact('c-threnody-mind','governance','threnody',{value:'gentle_ai'},'VIII · Threnody'),
    fact('c-sanctuary','sanctuary','threnody',{value:'endangered_minds'},'VIII · Threnody'),
    fact('c-lunar','nature','selenipolis',{value:'oldest_offworld'},'VIII · Selenipolis'),
    fact('c-schedule','governance','selenipolis',{value:'schedule_authority'},'VIII · Selenipolis'),
    fact('c-urgency','practice','selenipolis',{value:'urgency_costs'},'VIII · Selenipolis'),
    fact('c-krillix','nature','krillix',{value:'dolphin_water_habitat'},'VIII · Krillix'),
    fact('c-protection','protects','halvorn',{object:'krillix'},'VIII · Tessivorn and Krillix'),
    fact('c-halvorn','nature','halvorn',{value:'city_mind'},'VIII · Tessivorn'),
    fact('c-aureli','nature','aurelipolis',{value:'mercury_cylinder'},'VIII · Aurelipolis'),
    fact('c-aureli-rights','rights','aurelipolis',{value:'origin_based'},'VI; VIII · Aurelipolis'),
    fact('c-arks','purpose','arks',{value:'twenty_seedships'},'VIII · The Arkships'),
    fact('c-mind','restriction','minds',{value:'unconsented_copy_taboo'},'VI · Sacredness of mind-states'),
    fact('c-mind-transfer','practice','minds',{value:'transfer_distinction'},'VI · Transfer vs. copying'),
    fact('c-no-global-law','rights','minds',{value:'local_jurisdiction'},'III; VI'),
    fact('c-array','nature','arrays',{value:'massive_airless'},'IV · Laser Array Network'),
    fact('c-array-power','purpose','arrays',{value:'travel_leverage'},'IV · Laser Array Network'),
    fact('c-song','nature','long_song',{value:'collective_acoustic_record'},'X · The Long Song'),
    fact('c-song-contribution','practice','long_song',{value:'collective_additive'},'X · Technology'),
    fact('c-interface','nature','interface',{value:'lossy_translation'},'X · Neural interface'),
    fact('c-enceladus','nature','enceladus',{value:'living_ocean'},'VIII · Velloran Reach'),
    fact('c-reserve','restriction','enceladus',{value:'closed_reserve'},'VIII · Velloran Reach'),
    fact('c-liberators','purpose','liberators',{value:'forced_deconditioning'},'IX · Liberators'),
    fact('s-exchange','purpose','exchange',{value:'acoustic_exchange'},null),
    fact('s-venue','located_at','exchange',{place:'echo_gallery'},null,{sourceLabel:'16:00 local programme notice'}),
    fact('s-start','starts_at','exchange',{minute:20},null,{sourceLabel:'16:00 local programme notice'}),
    fact('s-rill-location','located_at','rill',{place:'flow_chamber'},null,{sourceLabel:'16:00 local presence notice'}),
    fact('s-neris-location','located_at','neris',{place:'echo_gallery'},null,{sourceLabel:'16:00 local presence notice'}),
    fact('s-slot','reservation','patient_margin',{status:'pending'},null,{sourceLabel:'last received lunar scheduling bulletin'}),
    fact('s-commons','nature','commons',{value:'visitor_space'},null),
    fact('s-serein','pursuit','serein',{value:'welcome_minds'},null),
    fact('s-iona','pursuit','iona',{value:'transit_history'},null),
    fact('s-rill','pursuit','rill',{value:'acoustic_cartography'},null),
    fact('s-neris','nature','neris',{value:'visiting_ai_conservator'},null)
  ],
  events:{
    venue:{id:'sample:venue-change',label:'16:01 local venue amendment',origin:addition,source:{kind:'publication',shareable:true},
      changes:[{atom:{predicate:'located_at',args:{subject:'exchange',place:'current_court'},polarity:true}}],observers:['serein']},
    rill:{id:'sample:rill-moves',label:'Rill’s local presence update',origin:addition,
      changes:[{atom:{predicate:'located_at',args:{subject:'rill',place:'current_court'},polarity:true}}],observers:['serein','rill']},
    signal:{id:'sample:lunar-bulletin',label:'signed Selenipolis reservation bulletin',origin:addition,
      changes:[{atom:{predicate:'reservation',args:{subject:'patient_margin',status:'confirmed'},polarity:true}}],
      observers:[],deliverAfter:12,recipients:['serein','iona','rill']}
  }
};
for(const actor of domain.characters)actor.social=socialProfiles[actor.id];
// Explicit partial knowledge: reference archives are not automatically present in every mind.
for (const f of domain.facts) {
  if (f.atom.args.subject==='arks') f.knownBy=['serein','iona'];
  if (f.atom.args.subject==='liberators') f.knownBy=['serein','iona'];
  if (['c-song-contribution','c-interface'].includes(f.id)) f.knownBy=['serein','rill'];
}
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

expandDomain(domain);
