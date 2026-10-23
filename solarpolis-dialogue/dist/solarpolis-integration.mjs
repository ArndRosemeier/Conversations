import {entities,predicates,facts,rules,viewpoints} from './solarpolis-expanded.mjs';
export function expandDomain(domain){
  domain.version=2;domain.migrateFrom=[1];
  Object.assign(domain.entities,entities,{unconsented_copying:{type:'concept'},most_habitats:{type:'scope'},transit_history:{type:'concept'},acoustic_spaces:{type:'concept'}});
  Object.assign(domain.predicates,predicates,{
    governed_by:{roles:{subject:'entity',object:'entity'},keyRoles:['subject','object']},
    departed_from:{roles:{subject:'entity',place:'entity'},keyRoles:['subject','place']},
    norm_status:{roles:{subject:'entity',scope:'entity',value:'string'},keyRoles:['subject','scope']},
    welcomes_every_arrival:{roles:{subject:'entity'},keyRoles:['subject']},
    welcomes_arrivals:{roles:{subject:'entity'},keyRoles:['subject']},
    same_individual:{roles:{subject:'entity',object:'entity'},keyRoles:['subject','object']}
  });
  const canon={kind:'canon',source:'SOLARPOLIS — WORLD BIBLE',section:'VI · Sacredness of mind-states'};
  const sample={kind:'sample',source:'Arrival Commons characterization'};
  const extra=(id,predicate,args,polarity,origin)=>({id,atom:{predicate,args,polarity},validFrom:0,validTo:null,origin});
  domain.facts.push(...facts,
    extra('meaning-copy-norm','norm_status',{subject:'unconsented_copying',scope:'most_habitats',value:'taboo'},true,canon),
    extra('meaning-serein-role','welcomes_arrivals',{subject:'serein'},true,sample),
    extra('meaning-separate-minds','same_individual',{subject:'serein',object:'threnody_mind'},false,sample));
  domain.rules=[...rules,{id:'no-central-polity',body:[
    {predicate:'governed_by',args:{subject:{$var:'region'},object:'central_government'},polarity:false},
    {predicate:'political_tier',args:{subject:{$var:'polity'},object:'major_player'},polarity:true}],
    head:{predicate:'governed_by',args:{subject:{$var:'region'},object:{$var:'polity'}},polarity:false},
    explanationKey:'no-central-polity',origin:{kind:'modeled-rule',source:'No polity governs an entire region without a central government'}}];
  domain.viewpoints=viewpoints;
  domain.summaryRedundancies=[{preferred:'nature',redundant:'has_form'},{subject:'enceladus',preferred:'nature',redundant:'supports'}];
  domain.summaryOrder=['nature','pursuit','has_form','political_tier','governed_by','power_basis','recognizes_personhood','supports','preserves_as'];
  domain.listDescriptionPredicate='power_basis';domain.listTopics={major_player:'major_players'};
  domain.comparisonPredicates=['recognizes_personhood','welcomes','governed_by','has_form'];
  domain.attitudeLinks={mind_copy:'minds',mind_transfer:'minds',pritt:'aurelipolis'};
}
