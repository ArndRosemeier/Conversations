# Selected English lexical source import

This sample converts real records from Open English WordNet and University of
Colorado VerbNet. No language model, learned weights, embedding search, or raw
pretraining corpus is involved. The browser consumes the resulting JSON; it does
not download the original datasets. English resources remain outside the agent
core.

## Sources and reproducibility

- **Open English WordNet 2025**, official `2025-edition` JSON archive:
  <https://github.com/globalwordnet/english-wordnet/releases/tag/2025-edition>.
  The importer pins the archive SHA-256. It selects 40 explicitly reviewed
  senses/concepts and their immediate hypernyms. Metadata/license text is pinned
  separately to repository commit
  `45fdb60396dc804526b85f21a23c59983c2c396a`.
- **VerbNet 3.4**, selected original XML class files at commit
  `ae8e9cfdc2c0d3414b748763612f1a0a34194cc1`:
  <https://github.com/cu-clear/verbnet/tree/ae8e9cfdc2c0d3414b748763612f1a0a34194cc1/verbnet3.4>.
  Subclasses, member attributes, thematic roles/restrictions, syntactic frames,
  and semantic predicate trees are retained. Parent classes are explicit.
- **Authored integration mappings** select which source meanings correspond to
  portable application concepts such as `knowledge.know`, `motion.leave`, and
  `communication.request`. The source authors did not supply these mappings.

Run from the repository root with Node 20 or newer:

```powershell
node solarpolis-dialogue/tools/import-language-sources.mjs --download
node solarpolis-dialogue/tools/import-language-sources.mjs --check
```

The first command fetches missing public inputs into the operating system's
temporary `solarpolis-language-sources` directory. The second runs offline when
the cache is present and checks that generated files are byte-for-byte identical.
Set `LANGUAGE_SOURCE_CACHE` to reuse a different cache location. On this Windows
installation, sandboxed and unsandboxed processes can have different temporary
directories; point both at the same absolute cache when needed. No repository
cache or `.gitignore` addition is required.

`dist/languages/en/data/source-manifest.json` records every input URL, byte count, and SHA-256,
plus the output hash and record counts. Subsequent imports reject changed input
bytes. The WordNet release archive is additionally hash-pinned in the importer.
Changing the selected records or updating a source requires reviewing the
importer, manifest, licenses, and regenerated output together.

The importer uses only Node built-ins. Its bounded ZIP reader never extracts
archive paths, and its XML reader never resolves external DTDs or entities. No
upstream executable code is run.

## Runtime contract

`dist/languages/en/data/lexical-pack.json` contains:

| Field | Contents |
| --- | --- |
| `schemaVersion`, `language` | Versioned data contract; first implementation is `en` |
| `wordnet.synsets` | Original synset IDs, ILI IDs, parts of speech, definitions, members, and selected relation targets |
| `wordnet.entries` | Lemmas, parts of speech, listed irregular forms, original sense IDs, synset references, and available subcategorization codes |
| `verbnet.classes` | Original class IDs, parent IDs, source file, members, role trees, and full selected frame trees |
| `conceptMappings` | Authored concept-to-sense/class links and explicitly approved recognition lemmas |

The generated subset has **71 synsets, 176 lexical entries, 191 senses, 51 verb
classes, 439 class memberships, 156 frames, and 40 concept mappings**. Memberships
are not unique word counts. The compact runtime resource is about **0.5 MB**
uncompressed; its exact bytes and hash are in the manifest.

WordNet synset and sense IDs and VerbNet class IDs are retained verbatim within
their source namespace. `source` identifies the release. Generated frame IDs of
the form `give-13.1/frame/1` are deterministic local locators, not upstream global
frame identifiers.

WordNet relation targets can deliberately refer to synsets outside the selected
subset. They remain external references; they must not be assumed loaded.
Morphological forms are the source's untagged forms, not a complete conjugation
engine. English grammar still needs explicit morphology and syntax rules.

VerbNet frame nodes have `{tag, attributes, children}`. Preserve nested trees:
negative predicates and selectional-restriction logic carry meaning. A subclass
can inherit parent frames and roles; its own empty frame list does not mean it
has no usable frames. Applications must resolve the parent chain and apply
subclass refinements rather than blindly concatenating contradictory role rules.

## How to use the data safely

The pack supplies lexical evidence and argument patterns. It does not itself
parse unrestricted English or justify game-world facts.

1. Recognize a lemma in an English grammatical construction.
2. Retain candidate senses rather than merging every synonym into one alias.
3. Check argument types, tense, polarity, and conversation context.
4. Use an authored concept mapping to construct a semantic request or claim.
5. Ask for clarification when multiple supported interpretations remain.

For example, **ask** remains distinct as requesting information versus asking
someone to act. **Hear** remains distinct as auditory perception versus learning
information. Knowing a fact and being acquainted with a person are separate
meanings. Ownership and temporary possession still need game-specific rules.

`approvedLemmas` are authored recognition candidates, not automatically approved
word substitutions for generation. Some intentionally extend beyond the exact
members of the selected synset (for example, `request` beside `ask`). These are
explicit application vocabulary decisions. Neither WordNet synonymy nor VerbNet
class membership guarantees that every expression is interchangeable or that a
particular domain action is permitted.

An English module can select a candidate concept from this pack, then use
separate authored grammar and domain mappings to create the common semantic
conversation API. A different language implementation can link its own lexical
resources to the same concepts without changing NPC beliefs or the agent core.

## Attribution and redistribution

- Open English WordNet is derived from Princeton WordNet and further developed
  under CC BY 4.0. Attribute **both Princeton WordNet and the Open English WordNet
  team**, retain both notices, and identify selection/conversion and authored
  links as modifications. See `solarpolis-dialogue/vendor-notices/`.
- VerbNet uses the **VerbNet 3.X license**, not CC BY. Retain the full University
  of Colorado notice and disclaimer with redistributed database copies, including
  modified copies. The official notice is obtained from
  <https://verbs.colorado.edu/~mpalmer/projects/verbnet/license.3.0.txt>.
- Cite: Karin Kipper, Anna Korhonen, Neville Ryant, Martha Palmer. *A Large-scale
  Classification of English Verbs.* Language Resources and Evaluation 42(1),
  21–40, 2008.

Browser publication must ship the notices together with the generated resource,
not only leave them in the development repository. The manifest names each
required notice. Nothing in the source import changes Solarpolis canon or adds
linguistic source examples to NPC memories.

## Validation

The importer checks source hashes, selected synset existence, unique sense and
class IDs, local sense references, mapped class existence, subclass parent
presence, frame syntax presence, and retention of the `ask` and `hear`
ambiguities. `--check` additionally verifies reproducible output and license
copies. These are structural/import checks; conversational naturalness and
interpretation accuracy require separate sample conversations and evaluation.
