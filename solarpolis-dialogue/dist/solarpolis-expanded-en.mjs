// English labels, constructions and discourse resources. No labels are core semantics.
const entry=(name,type='concept',aliases=[])=>({name,type,aliases});
const names={
  earth:'Earth',union:'the Union',pelagic_nation:'the Pelagic Nation',selenipolis:'Selenipolis',aurelipolis:'Aurelipolis',thraxipolis:'Thraxipolis',tessivorn:'Tessivorn',krillix:'Krillix',threnody:'Threnody',phobos:'Phobos',mossgrown:'Mossgrown',velloran:'Velloran Reach',grixmaw:'Grixmaw',
  moon:'the Moon',mercury:'Mercury',mimas:'Mimas',enceladus:'Enceladus',pritt:'Alexander Pritt',halvorn:'the Halvorn',threnody_mind:'Threnody’s governing Mind',mossgrown_mind:'Mossgrown’s governing AI',assembly:'the Assembly',schedule_authority:'the Schedule Authority',liberators:'the Liberators',arks:'the twenty-ark project',proxima_venture:'the crewed Proxima venture',epsilon_ark:'the Epsilon Eridani ark',tau_ark:'the Tau Ceti ark',
  inner_system:'the inner system',outer_system:'the outer system',mercury_orbit:'Mercury orbit',earth_ocean:'Earth’s oceans',proxima:'Proxima Centauri',alpha_centauri:'Alpha Centauri',epsilon_eridani:'Epsilon Eridani',tau_ceti:'Tau Ceti',empty_stars:'previously untargeted, unsettled star systems',arrays:'the laser-array network',lunar_arrays:'the lunar array network',sails:'laser-sail propulsion',fusion_torch:'a fusion torch',mind_copy:'mind copying',mind_transfer:'mind transfer',mind_backup:'a mind backup',virtual_afterlife:'a virtual afterlife',interface:'the dolphin neural interface',nanites:'Mossgrown’s nanite technology',skyhook:'the Mercury orbital tether',long_song:'the Long Song',
  major_player:'a major player',significant_player:'a significant player below the major tier',attractor:'an attractor',born_digital_minds:'born-digital minds',biological_origin_minds:'minds of biological origin',humans:'humans',ais:'AIs',uplifts:'uplifts',dolphins:'uplifted-dolphin culture',cyborgs:'a cyborg intelligence',starships:'starships',habitat_citizens:'habitat citizens',minor_habitats:'smaller habitats',major_players:'the major-player tier',krillix_access_advocates:'some Krillix dolphins',outside_observers:'outside observers',krillix_critics:'critics of Krillix’s dependence',aurelipolis_opponents:'many opponents of Aurelipolis',hibernating_adventurer:'hibernating human adventurers',
  oneill_cylinder:'an O’Neill cylinder',spin_torus:'a spin torus',bubble_habitat:'a bubble habitat',water_volume:'a water-volume habitat',habitat_cluster:'a habitat cluster',swarm_habitat:'a swarm habitat',
  central_government:'a central government',universal_personhood:'universal legal personhood',legal_personhood:'legal personhood',local_jurisdiction:'the local jurisdiction',system_law:'the system’s legal order',array_access:'control of array access',cheap_sail_travel:'access to cheap sail travel',braking_push:'the braking push for arriving sail ships',denied_braking_push:'denial of an expected braking push',artificial_gravity:'artificial gravity',massive_body:'a massive mounting body to absorb recoil',airless_body:'an airless mounting body',atmosphere:'an atmosphere',recoil:'array recoil',launch_windows:'trajectory-dependent launch windows',urgency_pricing:'higher tolls for greater urgency',political_leverage:'political leverage',earth_transit:'traffic to and from Earth',cultural_authority:'cultural authority rooted in humanity’s origin',original_biosphere:'the original terrestrial biosphere',tourism:'heritage tourism',ocean_conservation:'ocean conservation',fisheries:'fisheries management',acoustic_governance:'acoustic governance',biological_origin:'his biological origin',digital_substrate:'digital substrate',organic_avatar:'a fully organic public avatar',conditioned_consent:'consent engineered through upbringing and conditioning',manual_effort:'the dignity of manual effort',reeducation:'Aurelipolis re-education',memory_reframing:'the loyalties and interpretations attached to memories',individual_memories:'individual facts, skills, and memories',mind_consent:'the near-universal norm against unconsented mind manipulation',cloning_taboo:'the widespread taboo against simultaneous copies',personal_uniqueness:'personal uniqueness',independent_instances:'independent instances that diverge from duplication',light_lag:'lightspeed communication delays',free_port:'sanctuary for endangered minds',citizen_rights:'strong citizen rights',codified_procedure:'codified procedure',human_administration:'human administrators',ai_civil_service:'AI civil-service support',benevolent_dictatorship:'a benevolent dictatorship',habitat_body:'a habitat inhabited as a body',paternalism:'careful but paternalistic government',krillix_dependency:'Krillix’s dependence on its protector',dolphin_governance:'uplifted-dolphin government',enforced_reserve:'a closed, policed nature reserve',multicellular_life:'genuine multicellular life in its subsurface ocean',mimas_mining:'strip-mining Mimas',democracy:'broad, robust democracy',nonaggression:'refusal to attack',weapon_disassembly:'quiet molecular disassembly of nearby weapons',orbital_maintenance:'maintenance of its decaying orbit',preferred_push_direction:'the array direction that helps maintain its orbit',forced_deconditioning:'forced rewriting of conditioned minds',restorable_core_self:'the belief in a true, restorable core self',debated_personal_continuity:'unresolved questions of personal continuity',latent_instance:'a latent possible second instance',original_destruction:'destruction of the original instance',physical_possibility:'physically possible',near_universal_taboo:'a near-universal cultural taboo',jurisdictional_variation:'different laws in different jurisdictions',collective_memory:'collective memory',acoustic_art:'acoustic art',signature_whistle:'identity-bearing signature whistles',current_flow:'moving water and current',still_water:'still water',deliberate_isolation:'deliberate isolation of a podmate',expanded_translation:'expanded translation of social and acoustic context',propositional_content:'propositional content between whistle-language and human language',multimodal_context:'emotional, positional, touch, and acoustic context',radio_tracking:'radio tracking of the transmitter',acoustic_technology:'sophisticated acoustic and water-compatible technology',no_deity:'a tradition of continuity without a deity',fission_fusion_society:'groups that continually form and dissolve',alliance_bonds:'long-lasting alliance bonds',voluntary_pursuits:'chosen pursuits rather than compulsory employment',dividend:'a citizen dividend',market_trade:'market trade',external_stipend:'an external-travel stipend',fabricator_access:'access to communal fabricators',economic_survival:'economic survival',scarce_resources:'genuinely scarce resources',no_money_model:'communal allocation without internal money',dividend_model:'the dividend model',capitalism_model:'rare habitats without communal provision or a safety net',transit_tolls:'transit tolls',resource_concessions:'resource concessions',engineered_population:'a self-renewing engineered population',seed_factory:'bootstrap autofactories',frozen_embryo:'frozen human embryos',hibernating_founder:'hibernating human founders',fusion_braking:'onboard fusion braking at the destination',untargeted_destination:'an otherwise untargeted destination',biological_founders:'biological founders',arrived_ai_stations:'established AI stations',in_transit:'still in transit',long_lived_process:'a continuous, centuries-old mind process',limited_hard_power:'very limited coercive power',costly_gravity_well:'the cost of entering and leaving its gravity well',no_fixed_schedule:'wandering without a fixed schedule',peaceful_trade:'peaceful and reliable trade',no_internal_dissent:'the absence of internally arising dissent',contested_access:'contested access to Enceladus',acoustic_contributions:'recorded contributions layered into the shared work',final_whistle:'a contributor’s signature whistle after death',no_ftl:'the prohibition of faster-than-light travel, signals, or sensing',spin_or_thrust:'rotation or sustained thrust',finite_reaction_mass:'a finite supply of reaction mass'
};
const entities=Object.fromEntries(Object.entries(names).map(([id,name])=>[id,entry(name)]));
Object.assign(entities,{
  selenipolis:entry('Selenipolis','polity',['the moon','moon','lunar society']),
  pritt:entry('Alexander Pritt','mind',['pritt','alexander','the ruler','founder']),
  mossgrown:entry('Mossgrown','polity',['the slow verdict of mossgrown things','slow verdict']),
  threnody:entry('Threnody','polity',['the long afternoon of threnody']),
  velloran:entry('Velloran Reach','polity',['velloran']),
  major_players:entry('the major players','category',['major powers','major polities','big powers','major players']),
  mind_copy:entry('mind copying','technology',['copying','copy a mind','mind copies','cloning']),
  mind_transfer:entry('mind transfer','technology',['transfer','transition','transitioning']),
  mind_backup:entry('a mind backup','technology',['backup','backups']),
  arrays:entry('the laser-array network','technology',['arrays','laser arrays','laser array']),
  long_song:entry('the Long Song','culture',['long song']),
  interface:entry('the dolphin neural interface','technology',['neural interface','interface','translator']),
  arks:entry('the twenty-ark project','project',['arkships','arks','seed-ships','twenty arks','ark project']),
  legal_personhood:entry('legal personhood','concept',['personhood','rights','ai rights']),
  biological_origin:entry('biological origin','concept',['human origin','biological origin'])
});
const p=(positive,negative)=>({positive,negative:negative??`It is not the case that ${positive}`});
export const resources={entities,predicates:{
  political_tier:p('{subject} is {object}','{subject} is not {object}'),
  classified_as:p('{subject} is {object}','{subject} is not {object}'),
  has_form:p('{subject} takes the form of {object}'),situated_at:p('{subject} is situated at {object}'),
  governed_by:p('{subject} is governed by {object}','{subject} has no {object}'),
  controls:p('{subject} controls {object}','{subject} does not control {object}'),
  power_basis:p('{subject} gains leverage from {object}'),
  requires:p('{subject} requires {object}'),favors:p('{subject} strongly favors {object}'),
  enables:p('{subject} enables {object}'),endangers:p('{subject} can endanger {object}'),
  constrained_by:p('{subject} is constrained by {object}'),prices_by:p('{subject} sets prices according to {object}'),
  represents:p('{subject} represents {object} in the Assembly'),preserves:p('{subject} preserves {object}'),
  participates_in:p('{subject} participates in {object}','{subject} has no seat in {object}'),
  has_autonomy_within:p('{subject} has special autonomous status within {object}'),
  relies_on:p('{subject} relies on {object}'),origin_category:p('{subject} belongs to {object}'),
  substrate:p('{subject} runs on {object}'),
  recognizes_personhood:p('{subject} recognizes {object} as persons','{subject} denies personhood to {object}'),
  recognizes_person:p('{subject} recognizes {object} as a person'),
  recognized_because:p('{subject} is recognized as a person in Aurelipolis because of {object}'),
  uses:p('{subject} uses {object}'),values:p('{subject} values {object}'),practices:p('{subject} practices {object}'),
  applies:p('{subject} applies {object}','{subject} provides no guarantee of {object}'),
  retains:p('{subject} retains {object}'),changes:p('{subject} changes {object}'),
  commands:p('{subject} commands {object}'),carries:p('{subject} carries {object}'),
  targets:p('{subject} targets {object}'),avoids:p('{subject} avoids {object}'),
  implies:p('{subject} entails {object}'),distinguishes:p('{subject} is distinct from {object}'),
  supports:p('{subject} supports {object}'),disputes:p('{subject} disputes {object}'),
  protects:p('{subject} protects {object}'),welcomes:p('{subject} welcomes {object}'),
  provides:p('{subject} provides {object}'),merges_with:p('{subject} is physically integrated with {object}'),
  funds:p('{subject} funds {object}'),permits:p('{subject} permits {object}'),
  rejects:p('{subject} rejects {object}'),seeks:p('{subject} seeks access to {object}'),
  preserves_as:p('{subject} is maintained as {object}'),expresses:p('{subject} carries {object}'),
  translates:p('{subject} translates {object}'),omits_by_default:p('{subject} omits {object} by default'),
  can_request:p('Either participant using {subject} can request {object}'),tracks:p('{subject} tracks {object}'),
  commonly_supports:p('Most major players became major by being attractors'),
  depends_on:p('{subject} depends on {object}'),
  finds_distasteful:p('{subject} finds {object} deeply distasteful, despite choosing it for the ark project'),
  permits_candidacy:p('{subject} permits {object} to be citizens and elected candidates'),
  numeric_count:p('{subject} includes {value} {object}')
},values:{},explanations:{
  'origin-personhood':'The jurisdiction recognizes minds in this origin category, and this individual belongs to that category.',
  'origin-recognition-reason':'Aurelipolis draws its line by origin, not present substrate. Pritt began as a biological human.',
  'array-travel-leverage':'An operator that controls access to this array can control access to cheap sail travel.'
},
// Optional specialized constructions preserve scope or number where a generic
// relation template alone would lose important meaning. Keys are semantic triples.
statements:{
  'requires|sails|arrays':'Laser-pushed sail travel relies on external arrays for acceleration and braking.',
  'governed_by|inner_system|central_government|false':'There is no central government of the inner system, despite its comparatively heavy policing.',
  'governed_by|outer_system|central_government|false':'There is no central government of the outer system; outside a few core settlements it is thinly policed.',
  'applies|system_law|universal_personhood|false':'There is no system-wide guarantee of legal personhood.',
  'controls|assembly|political_leverage|false':'The Assembly has no inherent enforcement power. Major-player agreement gives decisions force within their spheres.',
  'controls|earth|arrays|false':'Earth has no laser arrays: its thick atmosphere fouls the beam.',
  'carries|arks|mind_copy':'Each seed-ship carries a copy of Alexander Pritt as its commanding instance.',
  'numeric_count|arks|starships':'The Aurelipolis project comprises twenty seed-ships.',
  'numeric_count|arks|frozen_embryo':'Each seed-ship carries 1,000 frozen human embryos.',
  'numeric_count|arks|hibernating_founder':'Each seed-ship carries twenty humans in hibernation, intended as teachers and founders.',
  'numeric_count|proxima_venture|hibernating_adventurer':'The crewed Proxima venture carries 150 human adventurers in hibernation.',
  'governed_by|earth|union':'The Union holds Earth’s Assembly seat and is its closest approximation to a global government, but remains deeply divided.',
  'governed_by|grixmaw|central_government|false':'Grixmaw has no fixed government.',
  'origin_category|pritt|biological_origin_minds':'Pritt began as a biological human before transitioning to digital substrate.',
  'commonly_supports|habitat_citizens|voluntary_pursuits':'People ordinarily follow chosen pursuits rather than working from economic necessity. Rare habitats without a safety net are the explicit exception.',
  'provides|capitalism_model|dividend|false':'Rare stone-cold-capitalism habitats provide no dividend, safety net, or communal provision.',
  'requires|capitalism_model|economic_survival':'In those rare habitats, humans must trade or receive charity to survive; an ordinary wage labor market still does not exist.',
  'uses|major_players|transit_tolls':'Major players extract revenue through transit tolls and other leverage over smaller habitats.',
  'uses|major_players|resource_concessions':'Major players can extract resource concessions from smaller habitats.',
  'uses|minor_habitats|market_trade':'Trade between habitats is market-based, with fragmented currencies.',
  'seeks|krillix_access_advocates|enceladus':'Some Krillix dolphins seek direct access to Enceladus to study its ocean by immersion.',
  'permits_candidacy|velloran|starships':'Velloran Reach admits unusually broad citizenship and candidacy: it once elected a starship president.',
  'constrained_by|mind_copy|mind_consent':'Copying or modifying a mind without consent is deeply taboo in the vast majority of habitats.',
  'can_request|interface|expanded_translation':'Either participant can request expanded translation that includes more social and acoustic context.',
  'uses|dolphins|signature_whistle':'Uplifted dolphins maintain identity and relationships through signature whistles; talking over one is deeply rude.',
  'practices|liberators|forced_deconditioning':'The Liberators usually pursue deconditioning by forcibly rewriting minds during trade contact.',
  'values|liberators|restorable_core_self':'The Liberators believe a true, restorable self survives beneath conditioning. That is their conviction, not an established fact.'
},
viewpointLabels:{
  'origin-doctrine':'Aurelipolis’s own doctrine recognizes biological origin as the basis of personhood.',
  'external-continuity-dispute':'Outside that doctrine, the distinction between transitioned minds and born-digital AIs is contested.',
  'stewardship':'The Halvorn describes its protection of Krillix as stewardship.',
  'gilded-leash':'Critics call that protection a gilded leash.',
  'consent-objection':'Even many opponents of Aurelipolis condemn forced deconditioning as a violation of consent.'
}};
