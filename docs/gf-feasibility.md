# Genuine GF browser grammar: implemented research spike

The sample now contains a small **actual Grammatical Framework grammar**, compiled
with the official GF 3.12 compiler to browser JavaScript. It is an authored
controlled-English application grammar that reuses selected English Resource
Grammar Library (RGL) syntax and morphology. The complete library is a build
dependency; the browser receives only the compiled application grammar/runtime.

## What was sourced

- Official Windows GF 3.12 release compiler, 8,716,418-byte archive, kept only in
  ignored local tooling. The game does not download or run the compiler.
- The JavaScript `gflib.js` runtime from the pinned `release-3.12` source tag.
- The official precompiled RGL release `20260403` (27,761,595-byte archive), kept
  in ignored tooling. `SyntaxEng`, `ParadigmsEng`, and `ExtraEng` construct noun
  phrases, pronouns, location questions, positive/negative copular clauses, and
  perfect-tense movement clauses. RGL supplies person/number agreement and
  contracted/uncontracted negation.
- GF's original license notice, containing GPL for compiler and dual LGPL/BSD
  for runtime. This distribution selects the runtime's BSD option and retains
  the complete notice. The authored application files have a separate MIT notice.
- RGL's original LGPL/BSD license notice, including its explicit permission to
  choose any license for application grammars derived through its API. The BSD
  option is selected and its full original notice is distributed.

URLs, SHA-256 hashes, and the compiler's reported build commit are recorded in
[`sources.json`](../solarpolis-dialogue/gf/sources.json). Official references:
[download instructions](https://www.grammaticalframework.org/download/index.html)
and [JavaScript compilation/runtime documentation](https://www.grammaticalframework.org/doc/tutorial/gf-tutorial.html#javascript-applications).

## Separation of concerns

`Conversation.gf` defines semantic constructors such as `AskLocation`,
`AskCompare`, `AskRule`, and `AssertLocation`. It knows no English or game IDs.
`ConversationEng.gf` defines the first language's concrete sentence patterns.
Another concrete syntax could express the same abstract trees in another
language. English references carry actual RGL noun phrases, so “where are you,”
“they aren't at the mill,” and “you have moved to the mill” use library agreement
instead of hand-authored conjugation. Most other questions remain deliberately
bounded application patterns; RGL reuse does not imply arbitrary English coverage.

Opaque runtime entity strings cannot go through RGL's one-argument `mkPN`
paradigm: it attempts compile-time possessive suffix gluing on a runtime value.
The integration uses RGL's explicit four-form noun paradigm and noun-to-name
conversion instead, passing the same opaque identifier in every form. Names are
rendered by the injected lexical adapter. Possessive-name morphology is outside
this subset; no incorrect genitive forms are exposed as a supported feature.

The adapter accepts arbitrary entity IDs and names at runtime. It replaces exact
known aliases with opaque one-token references before calling GF. **Only entity
recognition is lexical.** The compiled GF grammar determines sentence structure,
negation, dialogue-act constructors, and argument order. It rejects unknown
references; the GF String literal category is not treated as a license to invent
entities. Ambiguous aliases produce multiple acts. Pronouns require supplied
context and can remain ambiguous.

`resources.intentQueries` maps selected abstract questions onto a game's
predicates. Example:

```js
const parser = createGFParser({
  entities: {
    lunar: {name: 'Selenipolis', aliases: ['the Moon']},
    mercury: {name: 'Aurelipolis'},
    ruler: {name: 'Alexander Pritt', aliases: ['Pritt']}
  },
  intentQueries: {
    AskPower: {predicate: 'power_basis'},
    AskRule: {predicate: 'recognized_because'},
    AskPlayers: {
      predicate: 'political_tier',
      args: {subject: {$var: 'subject'}, object: 'major_player'}
    }
  }
});
parser.parse('Why does the Moon have power?');
// status: parsed
// act: {function:'ask_reason', query:{predicate:'power_basis',
//                                  args:{subject:'lunar'}}}
// tree: AskPower (Named "gfentity0")
```

The browser import is `dist/gf/adapter.mjs`; use
`createGFParser(resources).parse(text, context)` (or its alias `parseWithGF`).
Results contain `status`, `acts`, abstract `trees`, and an inspectable trace with
`engine:'GF'`, lexical bindings, and canonical GF-generated wording. Status is
`parsed`, `ambiguous`, `needs-context`, or `unsupported`. Callers must not execute
ambiguous alternatives as if a unique interpretation had been obtained.

## Demonstrated coverage

| Input | GF constructor |
|---|---|
| Who are the main players? | `AskPlayers` |
| Why does the Moon have power? | `AskPower (Named ...)` |
| Why can Pritt rule Aurelipolis? | `AskRule (Named ...) (Named ...)` |
| How does Aurelipolis differ from Threnody? | `AskCompare (Named ...) (Named ...)` |
| Does everyone agree with that? | `AskAgreement` |
| Where is Mara? | `AskLocation (Named ...)` |
| Mara is in the mill. | `AssertLocation (Named ...) (Named ...)` |
| Mara isn't at the mill. | `DenyLocation (Named ...) (Named ...)` |
| How do you know? | `AskEvidence` |

Additional constructions cover descriptions, opinions, times, rights, origin,
agreement, disagreement, greetings, and thanks. This grammar does not interpret
arbitrary conversational English. It also permits semantically odd but
syntactically valid questions such as “What time is Mara?”; domain validation
and clarification belong above parsing.

GF's legacy JS String literal linearization includes quote marks. The adapter
replaces quoted opaque entity tokens with the injected display names. Tests
exercise **GF parsing → abstract tree → GF linearization → entity display-name
rendering → GF parsing**, verifying preservation of the semantic act.

## Reproduce

Runtime use requires only the committed `dist/gf` files. To rebuild:

1. Install GF 3.12 from the official release (the compiler is a build tool).
2. Set `GF_BIN` to the executable path. On this Windows checkout the ignored
   fallback is `solarpolis-dialogue/gf/.tooling/gf-3.12/gf.exe`.
3. Unpack the pinned RGL release and set `GF_RGL_PATH` to its root containing
   `alltenses` and `prelude`. This checkout's ignored fallback is
   `solarpolis-dialogue/gf/.tooling/gf-rgl-20260403/gf-rgl-20260403`.
4. From the repository root, run:

```sh
node solarpolis-dialogue/gf/build.mjs
node --test solarpolis-dialogue/gf/grammar.test.mjs
```

`build.mjs` invokes `gf -make -path=<application;RGL alltenses;RGL prelude>
--output-format=js ConversationEng.gf` (using platform path separators), combines
generated output with the pinned runtime, and copies the lexical adapter and
licenses into `dist/gf`. No network is used by the build. GF `.gfo`, `.pgf`, and
intermediate generated JavaScript are ignored; `.gf` sources and final browser
modules are committed.

The original vendored runtime remains unchanged. The build applies two explicit
ES module compatibility edits: remove a no-op `delete` of a local binding, and
replace `arguments.callee` with a named function reference. These are recorded in
the source manifest. The legacy runtime also adds String prototype tag helpers;
the adapter exposes only parsing and linearization, not completion.

## Validation and limits

29 tests passed on 2026-10-23: 20 constructor round trips, injected query mapping,
negative assertions, question/assertion separation, contextual pronouns,
unknown/unsupported input, reserved-token rejection, ambiguous aliases, and an
unrelated game's arbitrary IDs without recompilation, aliases overlapping grammar
keywords, configurable rule-reason arguments, and RGL pronoun agreement across
positive, negative, interrogative, and perfect-tense location expressions. These are grammar
correctness checks, not evidence of natural conversation quality. The planned
conversation-quality evaluation must assess the integrated agent separately.

The next useful GF expansion is broader compositional questions and explicit
event/claim arguments, then a second concrete language. The accepted Pritt/AI
personhood question normalizes to the `AskRule` constructor; it is not a general
conditional-premise representation. Character voice realization remains a
separate authored layer; these grammar tests do not establish its naturalness.
