# First conversation simulation review

Reviewed on 2026-10-23. **The engine still fails as an open-ended conversationalist.** This release fixes the reported ordinary greeting failure and adds social state and executable simulations. It does not establish general conversational competence.

## Method

Luna authored 10 player conversation scenarios, with 58 player turns and explicit qualitative criteria. The actual procedural engine generated every NPC reply. The primary agent read the resulting conversations and judged relevance, continuity, voice, knowledge discipline, and closure. No language model runs inside the browser or supplies NPC answers.

The fixture is fixed and reproducible, not an adaptive model adversary. It was used during this iteration, so it is a development set, not a held-out benchmark. `conversation-report.json` contains the exact inputs, semantic interpretations, replies, diagnostic counts, and SHA-256 hashes of the evaluated engine modules. A repair is counted from the response plan. Absence of a repair does **not** establish that an answer was relevant or correct.

Run from `solarpolis-dialogue` with `npm run simulate`. Run invariant and regression checks with `npm test`.

## Human assessment

| Dimension | Assessment | Evidence |
| --- | --- | --- |
| Ordinary social openings | Improved | All three NPCs answer a check-in, disclose different interests, and can reciprocate. Mood self-reports stay separate from factual evidence. |
| Distinct voices | Promising but limited | Iona discusses calendars directly, Serein attends to personal choice and company, Rill discusses acoustic experience. These are authored dispositions and realizations, not a full emotion simulation. |
| Multi-turn naturalness | Fail | Repeated replies and abrupt repairs still interrupt the exchange. More complex personal questions and invitations are often missed. |
| Meaning and relevance | Fail | A question about why an array operator affects travel receives the ship's reservation status. A question about governing the whole inner system receives a Selenipolis summary. Both are non-answers, even though they contain modeled facts. |
| Knowledge boundaries | Mixed | Unknown dolphin counts stay unknown. Unconsented-copying testimony in a longer utterance is not understood or retained; asking about its provenance later cannot succeed. Rejecting fabrication is necessary but insufficient. |
| Ambiguity and closure | Partial | Basic missing-reference repair, goodbye, and reopening work. Some longer closing turns still fail. |
| Bounded NPC exchange | Pass within narrow scope | Current beliefs determine the venue answer. A shared official amendment updates the listener; an unsupported spoken report does not become verified evidence. |

**Observed diagnostics:** 10 conversations, 58 player turns, 15 repairs. The other 43 turns are not a pass count. The NPC venue scenario produces nine utterances. All 26 invariant/regression tests pass independently of this qualitative failure.

Selected observations:

- Iona's reply to “How are you today?” now starts “Quite well. Pleasantly absorbed in transit calendars…” and asks “How about you?”
- Rill acknowledges “Not very well. I had a rough conversation earlier.” and offers company.
- Social reasons such as “What do you enjoy about them?” work after a modeled activity, but broader causal and implied-meaning follow-ups remain brittle.
- Serein still fails questions that require distinguishing the local welcoming individual from the governing Mind when the reference is indirect.
- No evaluation score is inferred from code coverage, parsing success, or the number of fluent-looking sentences.

## NPC simulations

The browser's **NPC conversations → Listen in** offers three host-supplied goals: the exchange venue, the Long Song, and the ship's reservation. These goals use a bounded social-opening → question → answer → source → acknowledgment → closing policy. The words and factual answers come from the current language implementation and personal evidence, rather than a prewritten transcript.

For the knowledge-change demonstration, start a fresh sample, amend the venue, then choose Iona → Serein. Only Serein initially knows the amendment. Iona receives attributed testimony, asks for its source, reads the shareable publication, and updates her evidence. Old saves retain their original source capabilities; an observation from an older version is not retroactively declared shareable.

Each participant pair has separate conversational context. NPC exchanges share personal evidence with the rest of the game but preserve the player's chat context. They have a turn budget and an explicit stop reason. They do not yet choose their own goals, interruptions, social relationships, or long-term motives. Autonomous believable NPC society remains future work.

## Next evaluation priorities

The next implementation priority is a compositional meaning layer: distinguish the requested relation, scope, question type, and assertions from nearby vocabulary. Topic detection alone must not select a superficially related answer. Extend conversational initiative and repair after that foundation, rather than accumulating isolated greeting variants.

Keep these scenarios as regressions. Add a held-out set and adaptive Luna player runs with new phrasing. The primary judge should independently assess relevance, coherence, personality, knowledge provenance, and natural closure, with transcript evidence and explicit failure reasons. Keep this qualitative review separate from deterministic state/invariant tests.
