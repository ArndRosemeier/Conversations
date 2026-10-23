# Language module contract — API version 1

The 0.1.0 release adds an optional `bubbleVersion:1` / `realizeBubble(move, actor)` capability for incremental profile/group conversations. See [the party contract](party-conversations.md#saves-and-language-contracts) for move kinds, evidence fidelity and the 90-code-point output bound. The base adapter remains compatible; no English implementation is imported by the new policy.

English is an explicitly installed module at [`dist/languages/en/index.mjs`](../solarpolis-dialogue/dist/languages/en/index.mjs). The session factory, semantic core, evidence/reasoning code, and NPC policy import no concrete language. They use [`language-contract.mjs`](../solarpolis-dialogue/dist/language-contract.mjs).

## Install English in a host

```js
import {createSettingSession} from './setting-package.mjs';
import {englishModule} from './languages/en/index.mjs';
import {setting} from './settings/willowbrook/setting.mjs';

const session = createSettingSession(setting, {
  languageModule: englishModule
  // locale defaults to the supplied module's locale, not to English.
});
const reply = session.respondText('ada', 'Where is the lantern?');
```

There is no implicit English fallback. Missing modules, incompatible API versions, mismatched locales, absent setting resources, and missing adapter methods throw at startup. Another module does not require changing the core or adding a language switch statement to the loader. Import the chosen implementation in the host and inject it.

English's optional lexical pack can be installed explicitly:

```js
import lexicalPack from './languages/en/data/lexical-pack.mjs';
const session = createSettingSession(setting, {
  languageModule: englishModule,
  languageOptions: {lexicalPack}
});
```

No download, training, or remote service is involved during play. The shipped English module includes coded grammar rules as well as data; modularity does not imply that arbitrary languages can be supplied as vocabulary files alone.

## Module descriptor

```js
export const myLanguageModule = {
  apiVersion: 1,
  locale: 'xx',
  validateResources(resources, schema) { /* throw for invalid resources */ },
  create({resources, schema, options}) { /* return an adapter */ }
};
```

`schema` is a detached copy of `{entities, predicates, characters, discourse}`. It excludes world facts, personal evidence, pending events, and the live core. The resource format belongs to the language implementation: the loader does not require English's `entities`, `voices`, templates, tokenization rules, or grammatical categories. Setting resources are selected by `setting.languages[locale]`.

Modules and setting constructions are trusted application code, not sandboxed plugins. Keeping world data out of their API is an architectural boundary, not protection against hostile imported JavaScript. Resources should supply names, grammatical features, verbalizations and voice styles, not an alternate authoritative knowledge store.

## Required adapter methods

| Method | Contract |
| --- | --- |
| `locale` | String equal to the descriptor's locale. |
| `interpret(text, context)` | Synchronously return a supported semantic act. Unsupported/ambiguous text returns `{function:'clarify', reason:...}`. Do not return translated function/predicate IDs. |
| `realize(plan, actor)` | Synchronously return a string expressing the selected plan. Preserve polarity, attribution, uncertainty and unknowns. Do not add claims from omniscient setting data. |
| `name(entityId)` | Return the localized display name used by the host and NPC conversation openings. |
| `label(act)` | Return a localized question/choice label for the semantic act. |
| `npcLine(key, actor, args)` | Return localized connective speech for bounded NPC conversations. Keys: `opening`, `question`, `source`, `verified`, `conflict`, `reported`, `unknown`. `args` can contain the already localized `partner` or `question`. |

The factory checks descriptor/adapter shape and validates basic semantic output before calling the core. It rejects unknown act functions, invalid nested sequences, invalid assertions/verifications, unknown query predicates, and unsupported social/disclosure states. This is not a complete proof of semantic correctness: interpreter accuracy and realization fidelity require behavioral tests.

`ACT_FUNCTIONS` in `language-contract.mjs` lists the supported act IDs. The [setting contract](setting-package-contract.md#host-api-and-semantic-acts) describes their fields. For example, every language expresses the same location query:

```js
{function: 'ask', query: {
  predicate: 'kept_at',
  args: {subject: 'lantern', place: {$var: 'place'}}
}}
```

English “Where is the lantern?” and German “Wo ist die Laterne?” differ only before and after the semantic core. Dialogue options bypass `interpret` and submit this same object.

## Context, plans, and neutrality

The interpreter receives a copied conversation context with `addressee`, `focus`, neutral `referents.topic`, `lastPlace`, prior query/proposition, pending offers, and social memory. English decides what “she”, “they”, “it”, or “there” means using this information; the core does not store English grammatical pronoun keys. The English adapter retains a legacy `context.speaker` alias for older direct callers, but new modules use `addressee`. In contrast, `act.speaker` identifies the source of a report.

Semantic IDs such as `subject`, `ask`, `wellbeing`, `reported`, or `decision.select-evidence` are protocol identifiers, not English text to match against user input. Do not translate those identifiers. A language can use gender, agreement, inflection, word order or discourse rules of its own within its interpreter/realizer. General core discourse still has the role conventions described in the setting contract; this change does not implement arbitrary role remapping.

The core returns response plans containing selected personal evidence and decision IDs. The session wrapper gives the realizer detached copies of the plan and actor, so realization cannot mutate stored evidence/history through those arguments. Rendering does not automatically advance time, reveal secrets, verify testimony, or modify world state.

Evidence source defaults are keys (`source.initial`, `source.testimony`), with `speaker` retained as an entity ID. Hosts may give facts `sourceKey`, or events `sourceKey`, for language-dependent titles. These keys survive immediate/delayed observations and source sharing. Actual documentary titles and citations can also remain opaque `sourceLabel`/`label` metadata; core code never interprets their language. For a translated game, prefer keys and localized title resources over storing English descriptive prose in facts.

English additionally exposes `sourceName(source)`, `describeDecision(id)`, `clock(minute)`, `clause(evidence, speaker)`, and `sentence(text)` for its sample inspectors. These are English-host presentation helpers, not required by the shared conversation contract. A multilingual UI must use its own presentation port or provide equivalent localized helpers. The demo page chrome remains an English host UI; it is not part of the reusable core. Developer-facing exceptions/comments are likewise not NPC dialogue.

## English module contents

- `index.mjs`: public descriptor and exports.
- `english*.mjs`: interpretation, meaning constructions, social wording, defaults and realization.
- `validate.mjs`: English-specific resource validation.
- `messages.mjs`: English explanations of neutral decision IDs.
- `gf/`: compiled English grammar, adapter and license notices.
- `lexical-index.mjs`, `data/`, `vendor-notices/`: selected English lexical resources, morphology/frame lookup, provenance and licenses.
- `solarpolis-*.mjs`, `settings/willowbrook.mjs`: explicitly loaded setting vocabulary, personality wording and setting-specific English constructions. The reusable module entry does not import these.

GF source/build tooling remains in `solarpolis-dialogue/gf/`, and lexical conversion tooling in `tools/`; both now emit into the English module directory. They are authoring tools, not dependencies of the neutral runtime. Rebuild both browser entries with `npm run build` after runtime edits.

## Saves and adding another language

Semantic snapshots contain no selected locale. A host can restore the same setting/version snapshot using a different module and its matching setting resources. Stored evidence, event timing and semantic focus remain the same. Old UI transcript strings are display history: they do not automatically translate when a language is changed. Re-render saved plans or maintain per-locale transcripts if the product needs that behavior.

To add a language:

1. Create a module descriptor and implementation in `dist/languages/<locale>/`.
2. Define and validate its setting-resource shape; add matching resources under the setting's locale key.
3. Implement the required adapter methods using the shared semantic act IDs.
4. Inject the descriptor from the host. Do not edit `core.mjs` or add locale branches to `setting-package.mjs`.
5. Test equivalent acts across text languages and choices, unknown/negative facts, private evidence, source attribution, pronouns, saved-context switching, and NPC source sharing.

The [language contract tests](../solarpolis-dialogue/tests/language-contract.test.mjs) demonstrate this with a narrow [German probe](../solarpolis-dialogue/tests/fixtures/german-probe.mjs). It imports no English implementation, uses a different resource structure, runs without an `en` resource entry, and produces identical core plans/snapshots for equivalent questions. It also tests language changes across a saved delayed event, localized NPC exchanges, dependency isolation, malformed interpreter output, and realizer mutation protection. The probe is a test fixture, not a complete German product implementation.

Verification on 2026-10-23: 91 tests passed (the prior 90-test suite plus the focused localized-source-key check), both demos built and loaded in the browser, and the lexical importer reproduced its pinned resources. Solarpolis regressions retained 1 repair in 58 development turns and 3 in 24 follow-up turns.
