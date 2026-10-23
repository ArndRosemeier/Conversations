# Conversations

A portable procedural conversation agent, explored through **Solarpolis: The Arrival Commons**. No language model, framework, dependency installation, or remote AI service is required.

The first browser sample follows three original characters aboard Threnody: Serein, an AI who helps arriving minds by choice; Iona Venn, a lunar transit-history enthusiast; and Rill, an uplifted dolphin exploring acoustic spaces.

## Run

Requires Node.js 22 or newer.

```sh
cd solarpolis-dialogue
npm start
```

Open the printed local URL. Run the behavior checks with `npm test` from the same directory.

## Try the model

1. Ask each character where the acoustic exchange is.
2. Amend the venue. Only Serein receives the new notice.
3. Compare replies and inspect each character's personal evidence.
4. Tell Iona `The exchange is in Current Court.` She records unverified testimony while retaining her confirmed notice. Rill provisionally follows newer testimony, with attribution.
5. Show the amended notice to a character, then ask again and ask `How do you know?`.
6. Send the lunar bulletin. The remote reservation changes immediately, but none of the characters learn until the 12-minute simulated signal delay has elapsed.
7. Move Rill independently of the event venue. The event does not teleport its participants.

Other supported subjects include Threnody, Selenipolis, Krillix, Aurelipolis, the Halvorn, Enceladus, mind-states, laser arrays, the Long Song, the neural interface, the Liberators, the arkships, and the sample visitors. Try `What do you think of Aurelipolis?`, `When is the exchange?`, `Tell me about yourself`, or a contextual follow-up such as `Where are they now?`.

Ordinary social openings also work: try `How are you today?`, answer `I'm tired`, ask `What interests you?`, and follow with `Why?`. Social self-reports and pending social questions are remembered per conversation, separately from factual evidence. Each NPC has authored interests and a different voice. Unrecognized input gets an in-character repair rather than instructions to operate the interface.

Use **NPC conversations → Listen in** to hear two NPCs exchange information from their current beliefs. In a fresh sample, amend the venue before running Iona → Serein to see an official source shared and Iona's evidence updated. NPC pair context is separate from the player's chat. The dialogue policy and host-supplied goals are bounded; this is not autonomous social planning.

`npm run simulate` replays 10 Luna-authored conversations against the actual engine. Six additional conversations were authored before the new parser was evaluated; their first result and subsequent development rerun are retained separately. Read the [primary-agent qualitative review](docs/conversation-review.md) and [raw transcripts](docs/conversation-report.json): the engine still fails open-ended natural conversation despite passing its deterministic checks.

## Boundaries

| Module | Responsibility |
| --- | --- |
| `dist/core.mjs` | Typed predicates, temporal world changes, per-character evidence, testimony policies, semantic dialogue acts, context, delayed observations, response plans |
| `dist/solarpolis.mjs` | Selected world-bible facts, domain schema, original characters, personality policies, scenario events |
| `dist/english.mjs` | Bounded English interpretation and realization through an injected language resource package |
| `dist/solarpolis-en.mjs` | Solarpolis names, aliases, English fact realizations, and character voices |
| `dist/discourse.mjs` | Ordered speech acts, proposition verification, report qualifications, and explicit references |
| `dist/reasoning.mjs` | Bounded inference from personal evidence, including premise provenance |
| `dist/english-meaning.mjs` | Relation and scope constructions, compound turns, contextual references |
| `dist/gf/` and `dist/lexical-index.mjs` | Actual compiled GF grammar and selected WordNet/VerbNet lexical candidates |
| `dist/solarpolis-expanded*.mjs` and `dist/solarpolis-integration*.mjs` | Extended world model, language resources, and additive v1 save migration |
| `dist/storage.mjs` | Interchangeable in-memory and IndexedDB snapshot adapters |
| `dist/social.mjs` | Language-independent social acts, reciprocity, self-report memory, boundaries, and closure |
| `dist/english-social.mjs` | Bounded social constructions and English social realization |
| `dist/solarpolis-social*.mjs` | Authored sample dispositions, interests, and character-specific social language |
| `dist/simulation.mjs` | Bounded NPC exchanges, separate peer contexts, attributed testimony, and publication sharing |
| `dist/app.mjs` | Browser UI and sample host integration, including explicit director controls |

The core imports no domain or browser modules. A test runs it unchanged against an unrelated domain. Dialogue choices bypass parsing and send the same semantic acts as free text. Another language implementation can replace the English module and resources without rewriting agent state.

An observation has an event/about time, a learning time, a source, and confidence status. Player statements become attributed evidence; they never change authoritative world truth. Confirmed does not mean currently true: an NPC's confirmed source may be outdated. The inspector labels that difference from the director's perspective only.

## Scope and provenance

This is an architectural slice, not an open-domain conversational system. English grammar is deliberately bounded and returns clarification on unsupported or ambiguous input. Reasoning currently covers evidence selection, source attribution, temporal updates, testimony policy, conversational reference, and authored attitudes. Bounded forward rules now derive conclusions from each NPC’s own confirmed evidence, with inspectable premises. Planning, nested beliefs, negotiation, and automatic knowledge extraction remain future work. Most factual clauses are authored and composed; this is not unrestricted text generation.

Setting facts are attributed to sections of **SOLARPOLIS — WORLD BIBLE**, supplied by the user. The Arrival Commons, all named sample visitors, local rooms, exchange, ship, and changing events are additions. The 12-minute remote link is an illustrative scenario parameter, not a canonical orbital position or physical ephemeris. No ship travels during that interval.

Session state stays in the browser's IndexedDB when available, with explicit in-memory fallback and JSON export. This is software persistence, not an in-world mind backup. The full source bible is intentionally excluded from Git and deployment.

Work is committed directly to `main` at the user's request.

The [structured language-source assessment](docs/language-sources.md) compares reusable lexicons, morphology, grammars, and annotated dialogue datasets. None have been integrated into the first sample yet.

## Next design requirement

The sample now has a first bounded NPC exchange policy. Believable autonomous conversations still need goal selection, relationships, interruption, initiative, and richer turn-taking. The immediate quality bottleneck is compositional meaning and relevance across turns; see the conversation review for observed failures and the evaluation plan.

## Language and knowledge expansion

The runtime now includes 217 seed assertions, 199 entity IDs, four bounded inference rules, and attributed viewpoints. Some assertions retain the original compact representation alongside the newer relations; the count is not a measure of distinct knowledge.

The browser loads a selected 497,255-byte lexical pack: 71 WordNet synsets, 176 lexical entries, and 156 VerbNet frames. A compiled GF grammar supplies another bounded parsing path. These are actual source-derived resources, with pinned input hashes and shipped licenses. Most conversation constructions and all personality lines are still authored; imported lexical data does not automatically create conversational understanding.

Read [lexical conversion](docs/lexical-import.md), [GF build and limitations](docs/gf-feasibility.md), and [world model coverage](docs/solarpolis-model-expansion.md). To verify source conversion against a populated cache, run `node solarpolis-dialogue/tools/import-language-sources.mjs --check`; add `--download` to obtain the pinned public sources. `LANGUAGE_SOURCE_CACHE` optionally selects a cache directory. Playback makes no remote AI or lexical-source calls.

Useful new examples: “Why can an array operator affect a ship’s trip?”, “Who are the main players?”, “Why can Pritt rule Aurelipolis?”, and “Who helps arrivals find their bearings?”. A mixed turn such as “I’m fine. I heard that copying a mind without consent is ordinary practice in most habitats.” records both the mood and the attributed report. Follow with “Can you check that against what you know?”.

### Rebuilding the browser asset

The published page loads `dist/browser.js`, a single bundled script containing the engine and selected language resource. Source modules and the inspectable JSON pack remain in the repository. Serving the checked-in build still needs no package installation. After editing runtime sources, run `npm ci` once and `npm run build` in `solarpolis-dialogue`; esbuild is a pinned development dependency, not a game runtime dependency. The language importer emits equivalent JSON and ES-module resources, verified by its `--check` mode.
