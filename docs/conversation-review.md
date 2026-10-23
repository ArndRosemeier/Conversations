# Conversation improvement review

Reviewed 2026-10-23. **The prototype is materially better on the tested conversations, but remains a bounded conversational system.** It is not yet convincing for unrestricted play. The main improvement is interpreting and retaining relations, reports, and several acts in one turn, rather than answering whichever topic name happens to match.

## Method and honest comparison

Luna authored the original 10 conversations (58 player turns). Those were already development examples. In this iteration, a Luna agent wrote six additional conversations (24 turns) without reading the parser or the original fixtures. The primary agent did not read these new prompts until the first implementation pass was complete. The actual procedural engine generated every NPC answer; the primary agent read and judged the transcripts. No language model runs in the browser or supplies the NPC dialogue.

| Run | Turns | Turns containing a repair | Interpretation |
| --- | ---: | ---: | --- |
| Previous release, original development examples | 58 | 15 | Also contained wrong-topic answers that did not count as repairs |
| Current release, original development examples | 58 | 1 | Remaining repair asks about an unresolved “it”; fewer repairs alone is not a quality score |
| Fresh examples, first unseen run | 24 | 17 | Strong evidence that the first pass still generalized poorly |
| Same fresh examples after fixes | 24 | 3 | Now development examples; this is **not** a held-out score |

The first unseen result is preserved unchanged in [conversation-holdout-report.json](conversation-holdout-report.json). Final results are [conversation-report.json](conversation-report.json) and [conversation-followup-report.json](conversation-followup-report.json). Each report includes inputs, parsed acts, replies, traces, and hashes of the evaluated modules. Compound turns count as repairs if any child plan repairs. Repeated exact replies are another diagnostic, not a naturalness judgment.

Run `npm run simulate` in `solarpolis-dialogue` for the original examples. For the additional examples:

```sh
node tools/simulate-conversations.mjs --fixture tests/fixtures/conversation-holdout.json --output ../docs/conversation-followup-report.json
```

The first unseen artifact must not be overwritten by this rerun.

## Primary-agent assessment

| Dimension | Current assessment | Transcript evidence |
| --- | --- | --- |
| Social attention and personality | Improved within authored coverage | Serein answers why welcoming arrivals matters; Rill explains listening to acoustic spaces and accepts an invitation to keep talking; Iona accepts a clarified friendly greeting. |
| Mixed turns | Improved, still bounded | “I’m fine. I heard…” retains both the mood and a separately attributed report. A wellbeing question joined to a question about Threnody answers both. |
| Travel relevance | Improved, incomplete paraphrase coverage | A direct question about array operators now discusses acceleration, braking, and launch windows. It no longer returns the ship reservation. The indirect “I’ve heard the laser arrays can influence travel…” still repairs. |
| Identity and reference | Improved | Serein distinguishes themself from the governing Mind. A “who” answer establishes the person reference. “There” follows the last known location while keeping Rill separate from the exchange. |
| Testimony and negation | Improved | The unconsented-copying claim remains the player’s unverified report and is checked against the taboo norm. “I haven’t seen any notice” qualifies the source without falsely denying the event. |
| Knowledge boundaries | Sound in the tested cases | Population estimates remain unknown. Rill does not gain detailed arkship knowledge merely because another NPC has it. A reservation remains pending until Iona receives the delayed bulletin. |
| Explanation and voice | Mixed | Causal answers contain relevant premises, but some read like several database clauses joined together. The Selenipolis explanation is too long and repetitive. Source and verification answers are less characterful than the social replies. |
| Closure and reopening | Improved | Indirect leaving cues close naturally, and reopening with a location question works. An unsupported recollection prefix still adds an unnecessary repair before a correct venue answer. |
| NPC exchanges | Working within a narrow policy | A changed venue produces attributed testimony, an actual publication is shared, and Iona updates her belief. Pair context remains separate from player context. |

Representative corrected replies:

- Array travel: “Laser-pushed sail travel relies on external arrays for acceleration and braking.” The answer goes on to identify braking control and launch windows.
- Regional government: “The inner system is not governed by Selenipolis.” This is a modeled inference with inspectable premises, not a lookup of global truth.
- Distinct identities: “I am a separate individual from Threnody’s governing Mind.”
- Verification: “That differs from what I know. Copying a mind without consent is taboo in most habitats.” The original report remains stored and attributable.

## What still fails

Two turns in the travel follow-up scenario remain unsupported: an indirect report about arrays enabling travel, and the distinction the visitor draws between general travel influence and a specific booking. The engine answers the later direct booking and verification-policy questions correctly, but the interrupted exchange is not a natural success.

The reopening scenario still cannot interpret “I remember you said they were near the exchange.” It repairs that clause, then correctly answers whether the exchange is in Rill’s known location. Preserving an honest gap is preferable to inventing the recollection, but the interruption remains a conversational failure.

Other limitations: source and assertion responses can be verbose; some back-to-back acknowledgments feel assembled; repeated factual questions repeat answers; known concepts do not imply unrestricted sentence comprehension. Broad social constructions and topic summaries need adversarial tests for questions that contain exceptions, comparisons, or several competing referents. The finite English grammar does not yet support arbitrary reported speech, quantifier scope, hypothetical planning, or reliable open-ended repair.

## Verification and implementation scope

70 automated checks pass: the original 26 invariants/social/simulation checks, 29 GF grammar checks, and 15 new meaning/state checks. These verify source-derived grammar execution, a real WordNet/VerbNet departure frame, scoped and negated reports, reference tracking, no world mutation from testimony, bounded inference invalidation, duplicate-source temporal history, and additive v1 save migration. Source conversion reproduces the checked-in lexical pack and license copies from the cached pinned inputs.

Browser verification covered an existing saved world at 16:01, ordinary wellbeing, mixed social/testimony input, checking the retained report, interpretation traces, the corrected belief inspector, and an NPC exchange using the existing amended venue. Existing player conversations and world changes were retained.

The runtime now integrates selected WordNet/VerbNet data and an actual compiled GF grammar. These expand the available language resources; they do not generate personality or infer unlimited meanings. Social characterization remains authored sample material. The integrated world has 217 seed assertions and 199 entity IDs, including overlapping original summaries and finer relations; those totals are not distinct-fact or fluency scores.

## NPC simulation boundary and next work

NPC conversations still use a bounded greeting → host-supplied goal → answer → source → acknowledgment → closing policy. The transcript is produced from current personal knowledge, not stored dialogue. The fresh venue scenario contains nine utterances; repeated encounters can be shorter because social state is retained. This is not yet a simulation of autonomous motives, interruptions, negotiations, or evolving relationships.

Next, improve semantic treatment of reported causal statements, metaconversation about what was said, and sentence planning that combines evidence into concise in-character explanations. Evaluate those changes with newly authored or adaptive player conversations; neither current fixture should again be called held out.

## Published browser verification

The first hosted module build stalled before saved-session loading, despite matching the locally tested asset bytes. Replacing the module request chain with one bundled browser script resolved the observed startup failure; the exact client-side cause of the module stall was not established. The static build includes a visible startup error boundary. The final hosted build was verified through the actual UI, not only through an HTTP success response.

After the user clarified that all sessions are disposable test data, the published sample was reset. Iona answered the check-in, retained the mood in a mixed turn about transit history, and followed “What do you enjoy about it?” with a relevant personal explanation. The bundle is generated with a pinned development-only esbuild dependency. The game requires no model, package installation, or remote language service at runtime.
