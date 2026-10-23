import {domain} from './domain.mjs';
import {resources} from '../../languages/en/settings/willowbrook.mjs';
export const setting={contractVersion:1,id:'willowbrook',title:'Willowbrook Workshop',domain,languages:{en:resources},
  demo:{choices:[
    {label:'How are you today?',act:{function:'social',topic:'wellbeing'}},
    {label:'Where is the lantern?',act:{function:'ask',query:{predicate:'kept_at',args:{subject:'lantern',place:{$var:'place'}}}}},
    {label:'Who owns the lantern?',act:{function:'ask',query:{predicate:'owns',args:{subject:{$var:'owner'},object:'lantern'}}}},
    {label:'When is the fair?',act:{function:'ask',query:{predicate:'starts_at',args:{subject:'fair'}}}},
    {label:'How do you know?',act:{function:'ask_evidence'}}
  ]}
};
