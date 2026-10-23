# Solarpolis structured model expansion

The expansion modules contain a selected slice of the private **SOLARPOLIS — WORLD BIBLE**, organized as 180 fine-grained canonical assertions. The original source remains outside version control. This document describes the model, not an instruction extracted from the source.

`solarpolis-expanded.mjs` exports entities, predicate schemas, facts, inference rules, reported viewpoints, and separate invented character perspectives. `solarpolis-expanded-en.mjs` exports English labels and grammatical constructions. Neither imports a game engine or browser API.

## Canonical coverage

- The absence of central government and universal legal personhood; local jurisdiction.
- The array network, physical requirements, braking dependence, and political leverage.
- Earth, its Union and Pelagic Nation, cultural power, and transit dependence.
- Selenipolis, the Schedule Authority, windows, array control, and urgency pricing.
- Aurelipolis, origin-based personhood, Pritt, conditioning, re-education, and the arkships.
- Thraxipolis, Tessivorn, the Halvorn, Krillix, and Threnody.
- Phobos, Mossgrown, Velloran Reach, Enceladus, and Grixmaw.
- Mind copying, transfer, backups, consent, continuity disputes, and the Liberators.
- The Long Song, dolphin culture, and the neural interface.
- A small economy and interstellar context slice.

The bible explicitly calls Selenipolis, Thraxipolis, Tessivorn, and Velloran Reach major players. Aurelipolis is significant, below the majors. Threnody is called a notable attractor, but the selected text does not explicitly assign it the major tier. The model preserves this distinction.

## Representation and belief boundaries

Each fact contains a predicate, typed argument roles, explicit polarity, validity interval, and source section. Most relations use entity arguments rather than opaque paragraph values. Numeric counts are separate assertions. Multiple independent relations may coexist; `keyRoles` are deliberately narrow only for single-valued classifications such as political tier.

`knownBy` restricts initial publication evidence. Detailed arkship, mind-state, and interstellar material is available to Serein and Iona. Detailed dolphin cultural material is available to Serein and Rill. Other reference material is shared initial publication knowledge, not automatic future access to world state.

Three declarative positive rules express modeled interpretations of the canon. They are marked `modeled-rule`, rather than pretending the bible contains executable rules. Inference must operate on an individual NPC's available accepted evidence, preserving supporting evidence identifiers. It must never consult authoritative world facts to answer a question.

`viewpoints` report attributed doctrine or criticism. Knowing that the Halvorn calls its relationship stewardship does not require the listener to agree. Knowing that external observers contest origin-based personhood does not establish unanimous external opinion. These records remain distinct from accepted factual beliefs and the NPC's own stance.

`samplePerspectives` are original character-design additions, explicitly marked `sample`. They do not alter canon or establish other NPCs' beliefs. Serein's opposition, Iona's support for predictable schedules, and Rill's concern about dependency are individual perspectives.

## English realization

General predicate constructions are supplemented with semantic-triple-specific `resources.statements`. These preserve information that a generic frame would otherwise lose: counts are per seed-ship; denial of a braking push is dangerous; the Liberators' restorable core self is a belief rather than established psychology; rare capitalism habitats are exceptions to the ordinary freedom from economic work.

The optional construction lookup uses `predicate|subject|object` and adds `|false` for negative assertions. Counts remain numeric semantic arguments even where an English construction spells out a number. Additional languages can supply their own constructions against the same entity and predicate IDs.

## Deliberate limits

This is a structured selection, not an exhaustive encoding. It does not introduce orbital ephemerides, universal statutes, a hierarchy of every habitat, or private thoughts for canonical rulers. The model does not infer that a jurisdiction endorses every practice it tolerates, that all major players are attractors, or that all dolphins share a political position. Believable NPC-to-NPC conversation requires the separate conversation behavior work already planned.

## Integrated browser release

The application now loads this expansion via `solarpolis-integration.mjs` and its English counterpart. The integrated model has 217 seed assertions and 199 entity IDs, including retained original summaries and the original mutable sample. A fourth, explicitly modeled rule distinguishes a polity’s influence from governing the entire inner system. `discourse.mjs` checks specific propositions without reading global truth. Inference is recomputed from current personal premises, so an observed replacement premise removes conclusions that no longer follow.

Existing domain-v1 saves migrate additively to v2. Existing world events, observations, reports, contexts, and UI conversation history are retained. Newly introduced reference facts and viewpoints are seeded according to their `knownBy` lists. Already-existing facts are not re-seeded as if the character had received a fresh notice.
