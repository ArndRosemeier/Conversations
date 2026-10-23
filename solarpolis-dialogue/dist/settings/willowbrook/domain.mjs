// Entirely invented test setting. Data only: no engine or language imports.
const origin={kind:'sample',label:'Original Willowbrook demonstration'};
const fact=(id,predicate,args,knownBy)=>({id,atom:{predicate,args},validFrom:0,validTo:null,knownBy,sourceLabel:'morning workshop ledger',origin});
export const domain={
  version:1,
  entities:{ada:{},moss:{},lantern:{},workshop:{},greenhouse:{},fair:{}},
  predicates:{
    kept_at:{roles:{subject:'entity',place:'entity'},keyRoles:['subject']},
    starts_at:{roles:{subject:'entity',minute:'number'},keyRoles:['subject']},
    owns:{roles:{subject:'entity',object:'entity'},keyRoles:['object']},
    responsible_for:{roles:{subject:'entity',object:'entity'},keyRoles:['object']},
    nature:{roles:{subject:'entity',value:'string'},keyRoles:['subject']}
  },
  discourse:{locationPredicate:'kept_at'},
  characters:[
    {id:'ada',name:'Ada Reed',voice:'dry',personality:{detail:2,testimony:'strict',affiliation:.4},social:{mood:'content',activity:'mending',interestTopic:'lantern'}},
    {id:'moss',name:'Moss Bell',voice:'warm',personality:{detail:2,testimony:'provisional',affiliation:.9},social:{mood:'curious',activity:'gardening',interestTopic:'greenhouse'}}
  ],
  facts:[
    fact('lamp-place','kept_at',{subject:'lantern',place:'workshop'}),
    fact('lamp-owner','owns',{subject:'ada',object:'lantern'},['ada']),
    fact('fair-time','starts_at',{subject:'fair',minute:120}),
    fact('lamp-description','nature',{subject:'lantern',value:'a battered brass lantern with a new wick'})
  ],
  rules:[{id:'ownership-care',body:[{predicate:'owns',args:{subject:{$var:'who'},object:{$var:'item'}}}],head:{predicate:'responsible_for',args:{subject:{$var:'who'},object:{$var:'item'}}},explanationKey:'ownership-care',origin}],
  events:{move:{id:'carry-lantern',label:'Ada’s signed delivery note',source:{kind:'publication',shareable:true},
    changes:[{atom:{predicate:'kept_at',args:{subject:'lantern',place:'greenhouse'}}}],
    observers:['ada'],recipients:['moss'],deliverAfter:5,origin}}
};
