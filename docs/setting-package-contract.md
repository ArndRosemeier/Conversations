# Setting package contract, version 1

This is the supported integration recipe for coding agents working in this repository. It is an internal JavaScript module contract, not a published npm SDK or a promise of unrestricted natural-language understanding. The complete runnable example is [Willowbrook](../solarpolis-dialogue/dist/settings/willowbrook/setting.mjs). All its content is invented for this portability test.

## Fast path

1. Copy `solarpolis-dialogue/dist/settings/willowbrook/` to a new setting directory. Give the package a unique `id` and its own storage namespace.
2. Author language-neutral `domain.mjs`, English vocabulary/voices in `en.mjs`, and the `setting.mjs` entry point. Do not copy the shared English parser or core.
3. Call `validateSetting(package)` or `createSettingSession(package)`. Fix authoring errors before connecting a UI.
4. Wire game events to `session.core.applyEvent(event)`, explicit observations to `observe`, and elapsed simulation minutes to `advance`. Ordinary player dialogue must never call these authority APIs.
5. Send text through `respondText(npcId, text)` and choices through `respondAct(npcId, act)`. Both return `{act, plan, text}`.
6. Add integration tests like [setting-package.test.mjs](../solarpolis-dialogue/tests/setting-package.test.mjs), especially unseen changes, unknown facts, negative claims, and typed/choice equivalence.
7. Run `npm test`, `npm run demo:willowbrook`, and `npm run build` in `solarpolis-dialogue`. Serve with `npm start`; the second sample is `/willowbrook.html`.

The repository intentionally keeps editable runtime `.mjs` modules under `dist/`. `browser.js` and `willowbrook.js` are generated bundles. Edit sources and rebuild; do not patch a bundle by hand. No build tools or source downloads are needed to play the checked-in build. Building requires `npm ci` once.

## Package boundary

```js
export const setting = {
  contractVersion: 1,
  id: 'willowbrook',             // stable lowercase slug; save identity
  title: 'Willowbrook Workshop', // host metadata
  domain,                      // language-neutral, structured-cloneable data
  languages: {en: resources},   // only English has a runtime adapter today
  demo: {choices: [             // optional host metadata, not core policy
    {label: 'Where is the lantern?', act: {
      function: 'ask',
      query: {predicate: 'kept_at', args: {
        subject: 'lantern', place: {$var: 'place'}
      }}
    }}
  ]}
};
```

`validateSetting` returns the package or throws an error prefixed `Setting package:`. It checks required structures, entity references, character voices, predicate roles and keys, positive/negative templates, facts and recipients, rule variables, bindings, and clock settings. It is an authoring check, not a security sandbox or exhaustive semantic proof. In particular, optional UI metadata, arbitrary extension functions, and all possible runtime speech acts are not statically verified. Use trusted package code and behavioral tests.

The Solarpolis application still uses direct `AgentCore`/`EnglishLanguage` wiring and its old snapshot format. Its `migrateFrom` mechanism is not the package loader's migration contract. Do not pass its saves to a new package session.

## Domain data

| Field | Required contract and meaning |
| --- | --- |
| `version` | Positive integer. Bump when persisted setting semantics change. |
| `entities` | Record of stable IDs to metadata objects. IDs carry meaning; localized names belong outside the core. Include every NPC and referenced place/object. |
| `predicates` | Record of relation IDs to `{roles, keyRoles}`. Role types are `entity`, `string`, or `number`. |
| `characters` | Nonempty array of `{id, name, voice, personality}`. `name` is a host/display label used by the current simulation helper; `voice` is an opaque language-resource key. |
| `personality` | `detail`: positive integer answer limit. `testimony`: `strict` or `provisional`. Optional `affiliation`: numeric delivery preference. Other authored traits do not gain behavior automatically. |
| `facts` | Initial assertions, described below. |
| `events` | Optional record of host-supplied event definitions. Not fired by dialogue automatically. |
| `rules` | Optional bounded inference rules with `id`, `body`, `head`, `explanationKey`, and provenance. See Willowbrook's ownership/care rule. |
| `discourse.locationPredicate` | Optional predicate used to retain the last mentioned place. Defaults to `located_at`; Willowbrook sets `kept_at`. This relation needs entity roles `subject` and `place`. |

Optional core features also accept `summaryOrder`, `comparisonPredicates`, `attitudes` on characters, `interests` keyed by predicate, `viewpoints`, and related ranking metadata. They are not necessary for the minimal package. The implementation and Solarpolis integration modules are examples for these advanced features; package validation does not fully validate them.

Atoms and keys:

```js
predicates: {
  kept_at: {roles: {subject: 'entity', place: 'entity'}, keyRoles: ['subject']},
  owns: {roles: {subject: 'entity', object: 'entity'}, keyRoles: ['object']}
}
// Atom:
{predicate: 'kept_at', args: {subject: 'lantern', place: 'workshop'}, polarity: true}
```

An atom has all declared roles, no extra roles, and optional Boolean `polarity` (default true). `keyRoles` identify mutually replacing claims: a new `kept_at` fact replaces the old place for that subject; `owns` here permits only one owner per object. To model multiple simultaneous owners, use both roles as the key. This is a modeling decision, not an English rule. Missing evidence means unknown, not false.

**Discourse conventions:** atom storage accepts arbitrary role names, but generic topic, comparison, pronoun, and self-reference behavior expects `subject`. Location constructions expect `subject`/`place`; time constructions expect `subject`/`minute`. Version 1 bindings rename predicates, not roles. Keep these conventions for shared grammar, or author an explicit construction and accept that additional discourse behavior may need implementation. This is an honest limit of current portability.

```js
{
  id: 'lamp-place',
  atom: {predicate: 'kept_at', args: {subject: 'lantern', place: 'workshop'}},
  validFrom: 0, validTo: null,
  knownBy: ['ada'],
  sourceLabel: 'morning workshop ledger',
  origin: {kind: 'sample', label: 'Original demonstration'}
}
```

Use initial facts valid at time zero. `knownBy` omitted gives that initial knowledge to every NPC; `[]` gives it to none. Use explicit lists for secrets. Each initial observation is confirmed personal evidence, not guaranteed eternal truth. Source/provenance labels must distinguish source canon, interpretation, and invented sample material. Do not silently present invented extensions as canon. A world bible must be converted into these structures; there is no automatic text-to-world ingestion.

Rules unify variables such as `{$var:'owner'}` across premises and the conclusion. Every head variable must be bound in the body. Inference reads only that character's confirmed/inferred evidence, never the omniscient world view. It is bounded (8 rounds, 256 derived facts), recomputed from current personal evidence, and does not perform arbitrary planning or theorem proving.

## English resources and independence

The shared implementation is `english.mjs`, `english-meaning.mjs`, `english-social.mjs`, generic defaults, `gf/`, and `lexical-index.mjs`. None imports a Solarpolis setting module. Willowbrook loads that same code with a different package. `solarpolis-meaning.mjs` contains Solarpolis-specific constructions, injected only by Solarpolis's resources.

| Resource | Purpose |
| --- | --- |
| `entities[id]` | `{name, type, aliases?}`. Cover each domain entity. Alias ambiguity can yield clarification. Types guide interpretation (`person`, `place`, `event`, etc.); they are not core truth. |
| `predicates[id]` | Required `positive` and `negative` clause templates. Placeholders match role names. Optional `firstPerson: {positive, negative}` and `evidential: true` to use the voice's source/time wrapper. |
| `voices[key]` | Factual/repair style overrides. Every NPC voice key must exist; `{}` uses generic defaults. |
| `social[key]` | Social voice overrides: wellbeing, activity, interests, identity, follow-up reasons, greeting, repair, farewell, etc. Generic missing fields have fallbacks; author important topics for distinctive people. |
| `clock.startMinute` | Minute of day at simulation time zero (0..1439; default 0). Core time stays elapsed minutes. Solarpolis sets 960, Willowbrook 480. |
| `bindings` | Map shared English predicate concepts to domain predicate IDs, e.g. `{located_at:'kept_at'}`. Targets must exist; chained mappings are rejected. |
| `constructions` | Optional ordered trusted functions `(language, raw, context) => act \| null`. Return null when unmatched; never read world truth to decide what a sentence means. |
| `values`, `explanations` | Optional value templates and rule explanations. |

Other optional English features include `intentQueries` (GF constructor-to-query overrides), `queryFacets`, and `reasonPredicates`. Prefer the simple bindings and explicit construction route for a new minimal setting.

General English is **already in the repository**. Adding a setting means authoring its vocabulary, relation meanings, and voices, not providing an English corpus. The selected WordNet/VerbNet pack is optional: pass `lexicalPack` to enable its approved vocabulary/frame paths. Solarpolis bundles it; the tiny Willowbrook page deliberately does not. Both use the same compiled GF grammar. There is no runtime LLM, English training step, or lexical download.

Supported grammar is bounded. New facts do not teach new syntax. “Who owns the lantern?” is supplied by Willowbrook's small ownership construction; it does not require modifying the shared parser. Inspect `en.mjs` for full noun-phrase matching and explicit ambiguity handling. Unsupported relations in package sessions become clarification instead of crashing on unknown predicates or being stored as evidence. This does not prove that every sentence is correctly interpreted; broad legacy patterns and unseen paraphrases remain limitations.

Interpretation order is social constructions, bounded sentence splitting, injected setting constructions, shared meaning constructions, compiled GF plus selected lexical paraphrases, and bounded fallback patterns. Predicate binding and schema checks run before the act is handed to the core. A compound turn with an unsupported relation is rejected as a whole at this boundary. Voice realization chooses wording after evidence selection; it must not invent factual content. Static social lines are authored characterization and must be updated by the host if their activities cease to apply.

An additional natural language needs a new interpreter/realizer and setting resources using the same semantic IDs. The factory currently accepts only `locale: 'en'` and rejects others explicitly. Translating labels alone is insufficient. No English strings are needed to store or query world atoms, though diagnostic/provenance display labels currently use English defaults.

## Host API and semantic acts

```js
import {createSettingSession} from './setting-package.mjs';
import {setting} from './settings/willowbrook/setting.mjs';

const session = createSettingSession(setting);
const reply = session.respondText('ada', 'Where is the lantern?');
console.log(reply.act, reply.plan, reply.text);

// Exactly the same response path, with interpretation bypassed:
const chosen = session.respondAct('ada', setting.demo.choices[1].act);
```

`respondText` supplies that NPC's conversation context and the addressee ID to the English parser. In the low-level parser API, `context.speaker` unfortunately means the NPC addressed as “you”; `act.speaker` means the person making the statement and defaults to `player`. Prefer the wrapper to avoid confusing these names.

Common acts (all `function` values are semantic IDs, not localized strings):

| Act | Data and effect |
| --- | --- |
| `ask`, `ask_reason`, `opinion` | `query: {predicate?, args?, polarity?, anyOf?, allOf?}`. Read personal evidence. Reasons may include inference premises. |
| `ask_evidence` | Optional query; otherwise use the previous factual query. Report provenance without promoting testimony. |
| `assert` | `content: atom`, optional `speaker`, `aboutTime`. Record attributed testimony only. |
| `verify` | `content: atom`. Return supported/opposed/conflicted/unknown from personal evidence. |
| `check_report`, `remember_report` | Check or recall the last stored report. |
| `set_topic` | `subject: entityId`. Explicitly set conversational focus. |
| `greet`, `thank`, `farewell` | Social opening, acknowledgment, closure. |
| `social` | `topic`, e.g. wellbeing/activity/interest/identity; optional `reciprocate:false`. |
| `disclose` | `state`: positive/negative/tired/worried/neutral. Conversational memory, not world truth. |
| `social_boundary`, `accept`, `reject`, `elaborate` | Respond to social questions or pending elaboration offers. |
| `sequence` | `acts`: at most six non-nested acts, processed in order. |
| `clarify` | `reason`, optional entity `candidates`. Honest repair for unhandled/ambiguous input. |

Queries can omit roles, and a `{$var:'name'}` query value acts as a wildcard. Unlike inference variables, query wildcards do not implement joins or equality constraints across roles. Explicit negation uses `polarity:false`. Topic/summary queries use `{args:{subject:id}}`.

The returned `plan` contains `function`, `holder`, `time`, `results`, and decision metadata; particular functions add fields such as `social`, `report`, `outcome`, or `plans`. Each result group has `primary` evidence plus confirmed/report/history information. Use `text` for display, and inspect plans for debugging. Do not send player-controlled arbitrary semantic actions straight to the host's world-change API. `respondAct` is a trusted application port; text interpretation receives schema checks, but this is not a network security boundary.

## Changing the world and learning about it

```js
session.core.advance(1);
session.core.applyEvent({
  id: 'carry-lantern', label: 'Ada’s signed delivery note',
  changes: [{atom: {predicate:'kept_at', args:{subject:'lantern',place:'greenhouse'}}}],
  observers: ['ada'],
  recipients: ['moss'], deliverAfter: 5,
  source: {kind:'publication', shareable:true},
  origin: {kind:'sample'}
});
// World changes now; Ada learns now; Moss still answers “workshop”.
session.core.advance(5); // Moss receives the delayed note.
```

Events are atomic and idempotent by `id`; use a new ID for each distinct occurrence. Matching old world facts are closed at the current time according to predicate keys. No observer list means nobody automatically learns. A delay schedules observations; it does not delay world truth. `advance` uses finite non-negative minutes, not wall-clock time. Positions change only through declared facts, never implicitly because an event's venue moves.

For an explicit host-authorized observation, call `core.observe(npcId, fact, source)` with a known fact's `id`, `atom`, `validFrom`, and provenance. For player claims use `assert`, never `observe`. `core.world(query)` is a director/debug view; `core.beliefs(npcId, query)` is personal evidence. Do not let an NPC answer by reading `world()`.

`simulateNPCConversation(core, language, {initiator, partner, goal, maxTurns})` accepts an `ask` goal and a turn budget of 2..20. It uses separate peer contexts, attributed reports, and only held sources marked shareable. It is bounded information exchange, not autonomous social planning. See the second-setting test for a live amendment learned through conversation before the delayed delivery arrives.

## Storage and save boundaries

```js
import {IndexedDBStorage} from './storage.mjs';
const storage = new IndexedDBStorage('my-game-my-setting-v1');
const session = createSettingSession(setting, {saved: await storage.load()});
// After an interaction/event; serialize asynchronous writes in the host:
await storage.save(session.snapshot());
```

The adapter port is `async load()`, `async save(value)`, `async clear()`. `MemoryStorage` supports tests/non-browser hosts; IndexedDB is a browser implementation. A native game can provide another adapter or call the JS module through its scripting bridge. The engine itself is JavaScript, not a native library in every game-engine language.

The snapshot envelope contains `contractVersion`, `settingId`, `domainVersion`, and `core`. Cross-setting or version-incompatible saves throw; the host chooses whether to migrate explicitly or reset. Willowbrook resets incompatible disposable sample data and has a separate IndexedDB name from Solarpolis. Extensions/functions are not saved; re-load the package's code on startup. Persistence currently stores the in-memory simulation as a snapshot, not as an indexed knowledge graph queried directly from the database.

## Verification and limits

The ten package tests cover transitive import isolation, typed/choice equivalence, actual GF parsing, a non-Solarpolis predicate and clock, unseen changes, delayed observations, pronouns/“there”, negative testimony, private ownership and inferred responsibility, distinct social voices, compound turns, unsupported relations, tagged save restoration/rejection, and bounded NPC source sharing. Other suites protect Solarpolis behavior. The browser page additionally exercises IndexedDB persistence and its own UI.

This proves reuse for the covered constructions and APIs. It does not establish general English understanding, automatic extraction from setting books, arbitrary role remapping, linguistic fluency, or autonomous NPC goals. Keep these distinctions in agent reports and game-facing descriptions.

Verification on 2026-10-23: all 80 automated checks passed; both browser bundles built. Solarpolis conversation reruns retained 1 repair in 58 development turns and 3 in 24 follow-up turns. Local browser checks verified choices, typed pronoun follow-up, unequal knowledge before delayed delivery, updated knowledge afterward, IndexedDB reload, and NPC conversation. These are behavioral checks, not a naturalness score.
