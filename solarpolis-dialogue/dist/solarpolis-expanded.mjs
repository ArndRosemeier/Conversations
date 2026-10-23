// Selected structured canon. The original world bible remains private and uncommitted.
// Identifiers and schemas are language independent; labels live in solarpolis-expanded-en.mjs.
const canon = section => ({kind:'canon', source:'SOLARPOLIS — WORLD BIBLE', section});
const entityTypes = {
  polity:['earth','union','pelagic_nation','selenipolis','aurelipolis','thraxipolis','tessivorn','krillix','threnody','phobos','mossgrown','velloran','grixmaw'],
  body:['moon','mercury','mimas','enceladus'],
  mind:['pritt','halvorn','threnody_mind','mossgrown_mind'],
  institution:['assembly','schedule_authority'],
  movement:['liberators'],
  project:['arks','proxima_venture','epsilon_ark','tau_ark'],
  region:['inner_system','outer_system','mercury_orbit','earth_ocean','proxima','alpha_centauri','epsilon_eridani','tau_ceti','empty_stars'],
  technology:['arrays','lunar_arrays','sails','fusion_torch','mind_copy','mind_transfer','mind_backup','virtual_afterlife','interface','nanites','skyhook'],
  culture:['long_song'],
  category:['major_player','significant_player','attractor','born_digital_minds','biological_origin_minds','humans','ais','uplifts','dolphins','cyborgs','starships','habitat_citizens','minor_habitats','major_players','krillix_access_advocates','outside_observers','krillix_critics','aurelipolis_opponents','hibernating_adventurer'],
  form:['oneill_cylinder','spin_torus','bubble_habitat','water_volume','habitat_cluster','swarm_habitat'],
  concept:['central_government','universal_personhood','legal_personhood','local_jurisdiction','system_law','array_access','cheap_sail_travel','braking_push','denied_braking_push','artificial_gravity','massive_body','airless_body','atmosphere','recoil','launch_windows','urgency_pricing','political_leverage','earth_transit','cultural_authority','original_biosphere','tourism','ocean_conservation','fisheries','acoustic_governance','biological_origin','digital_substrate','organic_avatar','conditioned_consent','manual_effort','reeducation','memory_reframing','individual_memories','mind_consent','cloning_taboo','personal_uniqueness','independent_instances','light_lag','free_port','citizen_rights','codified_procedure','human_administration','ai_civil_service','benevolent_dictatorship','habitat_body','paternalism','krillix_dependency','dolphin_governance','enforced_reserve','multicellular_life','mimas_mining','democracy','nonaggression','weapon_disassembly','orbital_maintenance','preferred_push_direction','forced_deconditioning','restorable_core_self','debated_personal_continuity','latent_instance','original_destruction','physical_possibility','near_universal_taboo','jurisdictional_variation','collective_memory','acoustic_art','signature_whistle','current_flow','still_water','deliberate_isolation','expanded_translation','propositional_content','multimodal_context','radio_tracking','acoustic_technology','no_deity','fission_fusion_society','alliance_bonds','voluntary_pursuits','dividend','market_trade','external_stipend','fabricator_access','economic_survival','scarce_resources','no_money_model','dividend_model','capitalism_model','transit_tolls','resource_concessions','engineered_population','seed_factory','frozen_embryo','hibernating_founder','fusion_braking','untargeted_destination','biological_founders','arrived_ai_stations','in_transit','long_lived_process','limited_hard_power','costly_gravity_well','no_fixed_schedule','peaceful_trade','no_internal_dissent','contested_access','acoustic_contributions','final_whistle','no_ftl','spin_or_thrust','finite_reaction_mass']
};
export const entities = Object.fromEntries(Object.entries(entityTypes).flatMap(([type, ids])=>ids.map(id=>[id,{type}])));

const binary = (keyRoles=['subject','object'])=>({roles:{subject:'entity',object:'entity'},keyRoles});
export const predicates = {
  political_tier:binary(['subject']), classified_as:binary(), has_form:binary(['subject']),
  situated_at:binary(['subject']), governed_by:binary(['subject']), controls:binary(),
  power_basis:binary(), requires:binary(), favors:binary(), enables:binary(), endangers:binary(),
  constrained_by:binary(), prices_by:binary(), represents:binary(), preserves:binary(),
  participates_in:binary(), has_autonomy_within:binary(), relies_on:binary(),
  origin_category:binary(['subject']), substrate:binary(['subject']), recognizes_personhood:binary(),
  recognizes_person:binary(), uses:binary(), values:binary(), practices:binary(),
  applies:binary(), retains:binary(), changes:binary(), commands:binary(), carries:binary(),
  targets:binary(), avoids:binary(), implies:binary(), distinguishes:binary(),
  supports:binary(), disputes:binary(), protects:binary(), welcomes:binary(),
  provides:binary(), merges_with:binary(), funds:binary(), permits:binary(),
  rejects:binary(), seeks:binary(), preserves_as:binary(), expresses:binary(),
  translates:binary(), omits_by_default:binary(), can_request:binary(),
  tracks:binary(), commonly_supports:binary(), depends_on:binary(), recognized_because:binary(),
  finds_distasteful:binary(), permits_candidacy:binary(),
  numeric_count:{roles:{subject:'entity',object:'entity',value:'number'},keyRoles:['subject','object']}
};

const rows = [];
const add=(section,entries,knownBy)=>entries.forEach(([predicate,subject,object,options={}])=>rows.push({
  id:`x-${rows.length+1}`,atom:{predicate,args:{subject,object,...(options.value===undefined?{}:{value:options.value})},polarity:options.polarity??true},
  validFrom:0,validTo:null,origin:canon(section),sourceLabel:`World bible · ${section}`,
  ...(knownBy?{knownBy}:{}),...(options.note?{note:options.note}:{})
}));

add('II · Hard rules; III · Political order',[
  ['applies','inner_system','no_ftl'],
  ['applies','outer_system','no_ftl'],
  ['requires','sails','arrays',{note:'Laser-pushed sail travel depends on external arrays; this is not a universal statement about all sail maneuvers.'}],
  ['requires','fusion_torch','finite_reaction_mass'],
  ['requires','artificial_gravity','spin_or_thrust'],
  ['governed_by','inner_system','central_government',{polarity:false}],
  ['governed_by','outer_system','central_government',{polarity:false}],
  ['applies','system_law','universal_personhood',{polarity:false}],
  ['depends_on','legal_personhood','local_jurisdiction'],
  ['controls','assembly','political_leverage',{polarity:false,note:'The Assembly has no inherent enforcement power; major-player agreement supplies enforcement in their own spheres.'}],
  ['power_basis','major_player','array_access'],
  ['commonly_supports','major_players','attractor'],
  ['constrained_by','outer_system','light_lag']
]);
add('IV · Laser Array Network',[
  ['requires','arrays','massive_body'],
  ['favors','arrays','airless_body'],
  ['constrained_by','arrays','recoil'],
  ['enables','arrays','cheap_sail_travel'],
  ['controls','arrays','braking_push'],
  ['endangers','denied_braking_push','starships'],
  ['power_basis','arrays','political_leverage'],
  ['controls','earth','arrays',{polarity:false}]
]);
add('VIII · Earth',[
  ['governed_by','earth','union'],
  ['represents','union','earth'],
  ['participates_in','union','assembly'],
  ['power_basis','earth','cultural_authority'],
  ['preserves','earth','original_biosphere'],
  ['power_basis','earth','tourism'],
  ['constrained_by','earth','limited_hard_power'],
  ['constrained_by','earth','costly_gravity_well'],
  ['relies_on','earth','selenipolis'],
  ['has_autonomy_within','pelagic_nation','union'],
  ['situated_at','pelagic_nation','earth_ocean'],
  ['governed_by','pelagic_nation','dolphin_governance'],
  ['practices','pelagic_nation','acoustic_governance'],
  ['provides','pelagic_nation','ocean_conservation'],
  ['provides','pelagic_nation','fisheries'],
  ['participates_in','pelagic_nation','assembly',{polarity:false}]
]);
add('VIII · Selenipolis',[
  ['political_tier','selenipolis','major_player'],
  ['situated_at','selenipolis','moon'],
  ['classified_as','selenipolis','attractor',{polarity:false}],
  ['governed_by','selenipolis','schedule_authority'],
  ['controls','selenipolis','lunar_arrays'],
  ['controls','schedule_authority','lunar_arrays'],
  ['power_basis','selenipolis','array_access'],
  ['power_basis','selenipolis','earth_transit'],
  ['controls','lunar_arrays','earth_transit'],
  ['enables','lunar_arrays','cheap_sail_travel'],
  ['constrained_by','lunar_arrays','launch_windows'],
  ['prices_by','schedule_authority','urgency_pricing'],
  ['power_basis','selenipolis','launch_windows']
]);
add('VIII · Aurelipolis; VI · Transfer vs. copying',[
  ['political_tier','aurelipolis','significant_player'],
  ['has_form','aurelipolis','oneill_cylinder'],
  ['situated_at','aurelipolis','mercury_orbit'],
  ['governed_by','aurelipolis','pritt'],
  ['classified_as','aurelipolis','attractor',{polarity:false}],
  ['recognizes_personhood','aurelipolis','biological_origin_minds'],
  ['recognizes_personhood','aurelipolis','born_digital_minds',{polarity:false}],
  ['origin_category','pritt','biological_origin_minds'],
  ['substrate','pritt','digital_substrate'],
  ['recognizes_person','aurelipolis','pritt'],
  ['recognized_because','pritt','biological_origin'],
  ['uses','pritt','organic_avatar'],
  ['practices','aurelipolis','conditioned_consent'],
  ['uses','aurelipolis','engineered_population'],
  ['values','aurelipolis','manual_effort'],
  ['practices','aurelipolis','peaceful_trade'],
  ['applies','aurelipolis','reeducation'],
  ['retains','reeducation','individual_memories'],
  ['changes','reeducation','memory_reframing'],
  ['uses','aurelipolis','skyhook']
]);
add('VIII · Aurelipolis · The Arkships',[
  ['commands','pritt','arks'],
  ['numeric_count','arks','starships',{value:20}],
  ['carries','arks','mind_copy',{note:'Each ship carries one copy of Pritt, not a generic crew of copied minds.'}],
  ['carries','arks','seed_factory'],
  ['numeric_count','arks','frozen_embryo',{value:1000,note:'Per seed-ship.'}],
  ['numeric_count','arks','hibernating_founder',{value:20,note:'Per seed-ship.'}],
  ['uses','arks','sails'],
  ['uses','arks','fusion_braking'],
  ['targets','arks','empty_stars'],
  ['avoids','arks','proxima'],
  ['avoids','arks','alpha_centauri'],
  ['avoids','arks','epsilon_eridani'],
  ['avoids','arks','tau_ceti'],
  ['finds_distasteful','pritt','mind_copy'],
  ['implies','mind_copy','independent_instances'],
  ['constrained_by','arks','light_lag']
],['serein','iona']);
add('VIII · Thraxipolis; Tessivorn; Krillix; Threnody',[
  ['political_tier','thraxipolis','major_player'],
  ['classified_as','thraxipolis','attractor'],
  ['has_form','thraxipolis','oneill_cylinder'],
  ['situated_at','thraxipolis','inner_system'],
  ['provides','thraxipolis','citizen_rights'],
  ['values','thraxipolis','codified_procedure'],
  ['governed_by','thraxipolis','human_administration'],
  ['uses','thraxipolis','ai_civil_service'],
  ['political_tier','tessivorn','major_player'],
  ['has_form','tessivorn','spin_torus'],
  ['governed_by','tessivorn','halvorn'],
  ['classified_as','halvorn','cyborgs'],
  ['merges_with','halvorn','tessivorn'],
  ['practices','halvorn','paternalism'],
  ['protects','halvorn','krillix'],
  ['provides','tessivorn','citizen_rights'],
  ['has_form','krillix','water_volume'],
  ['governed_by','krillix','dolphin_governance'],
  ['relies_on','krillix','halvorn'],
  ['seeks','krillix_access_advocates','enceladus'],
  ['has_form','threnody','bubble_habitat'],
  ['governed_by','threnody','threnody_mind'],
  ['classified_as','threnody','attractor'],
  ['welcomes','threnody','ais'],
  ['welcomes','threnody','uplifts'],
  ['provides','threnody','free_port']
]);
add('VIII · Phobos; Mossgrown; Velloran Reach; Grixmaw',[
  ['controls','phobos','arrays'],
  ['power_basis','phobos','array_access'],
  ['uses','phobos','recoil'],
  ['requires','phobos','orbital_maintenance'],
  ['constrained_by','phobos','preferred_push_direction'],
  ['has_form','mossgrown','oneill_cylinder'],
  ['governed_by','mossgrown','mossgrown_mind'],
  ['practices','mossgrown_mind','nonaggression'],
  ['uses','mossgrown','nanites'],
  ['enables','nanites','weapon_disassembly'],
  ['practices','mossgrown','no_fixed_schedule'],
  ['political_tier','velloran','major_player'],
  ['has_form','velloran','habitat_cluster'],
  ['situated_at','velloran','mimas'],
  ['practices','velloran','democracy'],
  ['permits_candidacy','velloran','starships'],
  ['power_basis','velloran','mimas_mining'],
  ['protects','velloran','enceladus'],
  ['preserves_as','enceladus','enforced_reserve'],
  ['supports','enceladus','multicellular_life'],
  ['has_form','grixmaw','swarm_habitat'],
  ['situated_at','grixmaw','outer_system'],
  ['governed_by','grixmaw','central_government',{polarity:false}],
  ['permits','grixmaw','mind_copy',{note:'Casual mind-state meddling is accepted here, unlike most habitats; this does not establish a detailed written law.'}]
]);
add('VI · Minds; IX · Liberators',[
  ['classified_as','mind_copy','physical_possibility'],
  ['classified_as','mind_transfer','physical_possibility'],
  ['classified_as','mind_backup','latent_instance'],
  ['requires','mind_transfer','original_destruction'],
  ['distinguishes','mind_transfer','mind_copy'],
  ['constrained_by','mind_copy','cloning_taboo'],
  ['constrained_by','mind_copy','mind_consent'],
  ['constrained_by','mind_transfer','debated_personal_continuity'],
  ['implies','virtual_afterlife','mind_copy'],
  ['constrained_by','virtual_afterlife','debated_personal_continuity'],
  ['practices','liberators','forced_deconditioning'],
  ['values','liberators','restorable_core_self'],
  ['constrained_by','liberators','jurisdictional_variation']
],['serein','iona']);
add('X · Uplifted dolphins',[
  ['expresses','long_song','collective_memory'],
  ['expresses','long_song','acoustic_art'],
  ['practices','long_song','acoustic_contributions'],
  ['preserves','long_song','final_whistle'],
  ['classified_as','long_song','no_deity'],
  ['values','dolphins','current_flow'],
  ['rejects','dolphins','still_water'],
  ['rejects','dolphins','deliberate_isolation'],
  ['practices','dolphins','fission_fusion_society'],
  ['values','dolphins','alliance_bonds'],
  ['uses','dolphins','signature_whistle'],
  ['uses','dolphins','acoustic_technology'],
  ['translates','interface','propositional_content'],
  ['omits_by_default','interface','multimodal_context'],
  ['can_request','interface','expanded_translation'],
  ['enables','interface','radio_tracking']
],['serein','rill']);

add('V · Economy',[
  ['commonly_supports','habitat_citizens','voluntary_pursuits'],
  ['provides','dividend_model','dividend'],
  ['provides','no_money_model','fabricator_access'],
  ['provides','capitalism_model','dividend',{polarity:false}],
  ['requires','capitalism_model','economic_survival'],
  ['uses','major_players','transit_tolls'],
  ['uses','major_players','resource_concessions'],
  ['uses','minor_habitats','market_trade']
]);
add('XI · Beyond the Solar System',[
  ['supports','proxima','arrived_ai_stations'],
  ['supports','alpha_centauri','arrived_ai_stations'],
  ['classified_as','epsilon_ark','in_transit'],
  ['classified_as','tau_ark','in_transit'],
  ['targets','proxima_venture','proxima'],
  ['numeric_count','proxima_venture','hibernating_adventurer',{value:150}],
  ['constrained_by','proxima','light_lag']
],['serein','iona']);

export const facts = rows;

// Declarative, domain-specific rules. A host-independent engine can instantiate these
// against one NPC's accepted evidence, with all premise evidence retained as supports.
const v = name=>({$var:name});
const atom=(predicate,args)=>({predicate,args,polarity:true});
export const rules = [
  {id:'origin-personhood',
    body:[atom('origin_category',{subject:v('mind'),object:v('category')}),atom('recognizes_personhood',{subject:v('jurisdiction'),object:v('category')})],
    head:atom('recognizes_person',{subject:v('jurisdiction'),object:v('mind')}),
    explanationKey:'origin-personhood',origin:{kind:'modeled-rule',source:'Structured interpretation of world-bible doctrine',section:'VI · Transfer vs. copying; VIII · Alexander Pritt'}},
  {id:'array-travel-leverage',
    body:[atom('controls',{subject:v('polity'),object:v('array')}),atom('enables',{subject:v('array'),object:'cheap_sail_travel'})],
    head:atom('power_basis',{subject:v('polity'),object:'cheap_sail_travel'}),
    explanationKey:'array-travel-leverage',origin:{kind:'modeled-rule',source:'Structured interpretation of world-bible travel leverage',section:'IV · Laser Array Network; VIII · Selenipolis'}},
  {id:'origin-recognition-reason',
    body:[atom('origin_category',{subject:v('mind'),object:'biological_origin_minds'}),atom('recognizes_personhood',{subject:'aurelipolis',object:'biological_origin_minds'})],
    head:atom('recognized_because',{subject:v('mind'),object:'biological_origin'}),
    explanationKey:'origin-recognition-reason',origin:{kind:'modeled-rule',source:'Structured interpretation of Aurelipolis doctrine',section:'VI · Transfer vs. copying; VIII · Alexander Pritt'}}
];

// These are sample character perspectives, never assertions of universal agreement.
// Integrators may seed them only into the named character's private perspective.
export const samplePerspectives = [
  {holder:'serein',topic:'aurelipolis',stance:'opposed',reason:'personhood_by_origin',origin:{kind:'sample',source:'Arrival Commons character design'}},
  {holder:'iona',topic:'selenipolis',stance:'supportive',reason:'predictable_scheduling',origin:{kind:'sample',source:'Arrival Commons character design'}},
  {holder:'rill',topic:'halvorn',stance:'cautious',reason:'protection_and_dependency',origin:{kind:'sample',source:'Arrival Commons character design'}}
];

// A report that a party holds a view is distinct from accepting the view. These
// records are available source material, not omniscient access to other minds.
export const viewpoints = [
  {id:'origin-doctrine',topic:'pritt',alsoTopics:['aurelipolis','legal_personhood'],attributedTo:'aurelipolis',position:'endorsed',
    content:atom('recognizes_personhood',{subject:'aurelipolis',object:'biological_origin_minds'}),
    knownBy:['serein','iona','rill'],origin:canon('VI · Transfer vs. copying; VIII · Alexander Pritt')},
  {id:'external-continuity-dispute',topic:'pritt',alsoTopics:['aurelipolis','legal_personhood'],attributedTo:'outside_observers',position:'contested',
    content:atom('distinguishes',{subject:'biological_origin_minds',object:'born_digital_minds'}),
    knownBy:['serein','iona'],origin:canon('VI · Transfer vs. copying')},
  {id:'stewardship',topic:'halvorn',alsoTopics:['krillix','tessivorn'],attributedTo:'halvorn',position:'supportive',
    content:atom('protects',{subject:'halvorn',object:'krillix'}),knownBy:['serein','iona','rill'],origin:canon('VIII · Tessivorn and the Halvorn')},
  {id:'gilded-leash',topic:'halvorn',alsoTopics:['krillix','tessivorn'],attributedTo:'krillix_critics',position:'critical',
    content:atom('relies_on',{subject:'krillix',object:'halvorn'}),knownBy:['serein','iona','rill'],origin:canon('VIII · Tessivorn and the Halvorn')},
  {id:'consent-objection',topic:'liberators',alsoTopics:['aurelipolis','mind_copy'],attributedTo:'aurelipolis_opponents',position:'critical',
    content:atom('practices',{subject:'liberators',object:'forced_deconditioning'}),knownBy:['serein','iona'],origin:canon('IX · Liberators · Reputation')}
];
