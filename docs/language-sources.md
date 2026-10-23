# Structured language sources

Inspected 23 October 2026. These are candidate upstream resources; none are installed in the first browser sample. Its English grammar and voice constructions are hand-authored. The sources below can reduce authoring, but no single dataset supplies vocabulary, parsing, grounded game semantics, character behavior, and conversational style together.

## Directly convertible data

| Source | Verified structure | Proposed use and remaining work |
| --- | --- | --- |
| [Open English WordNet](https://github.com/globalwordnet/english-wordnet) | YAML source; released JSON, WN-LMF XML, RDF and WNDB | Import lemmas, parts of speech, sense IDs, definitions, synonym sets, and lexical relations. Preserve distinct senses: a transit reservation and a nature reserve cannot be merged just because their words overlap. Domain concepts still need explicit sense mappings. |
| [UniMorph English](https://github.com/unimorph/eng) | Tab-separated lemma, inflected form, and feature bundle | Build lemma-to-form and form-to-lemma indexes. This supplies morphology rather than sentence understanding. Feature normalization and ambiguity handling remain necessary. |
| [VerbNet](https://github.com/cu-clear/verbnet) | XML verb classes, members, syntactic frames, thematic roles, and semantic predicates | Import frame inventories and candidate argument mappings. Connect roles such as Agent, Theme, Source, and Destination to our semantic expressions. This is a useful starting point for interpretation, not a ready-made game action API. |
| [Google Schema-Guided Dialogue](https://github.com/google-research-datasets/dstc8-schema-guided-dialogue) | JSON schemas and conversations with utterances, acts, slots, values, state, service calls and results | Convert selected examples into semantic-act fixtures and tests for clarification, offers, confirmation, information exchange, and state tracking. Real-world service domains require explicit mapping. It does not supply NPC motivations or a general grammar. |
| [Google Taskmaster-1](https://github.com/google-research-datasets/Taskmaster/tree/master/TM-1-2019) | JSON utterances, annotated text spans, and a separate ontology | Useful for paraphrases, corrections, and slot extraction. Its annotations emphasize API arguments and transaction status, rather than a complete dialogue-act inventory. |

[WordNet's official download page](https://en-word.net/downloads) lists the 2025 JSON archive at **9.5 MB compressed** and the XML archive at 10.8 MB compressed. Those are upstream download sizes, not measurements of a converted browser pack or its RAM use. No large corpus needs to ship with the game: import offline, preserve provenance, select a useful subset, then build runtime indexes.

## Grammar components to integrate

**[Grammatical Framework and its Resource Grammar Library](https://github.com/GrammaticalFramework/gf-rgl)** are the strongest architectural candidate to prototype next. GF separates an abstract syntax from language-specific concrete syntaxes. The [official tutorial](https://www.grammaticalframework.org/doc/tutorial/gf-tutorial.html#javascript-applications) documents compilation to JavaScript and local parsing/linearization with `gflib.js`; the [runtime source](https://raw.githubusercontent.com/GrammaticalFramework/gf-core/master/src/runtime/javascript/gflib.js) contains both operations. We still need an application grammar, vocabulary, semantic conversion, coverage tests, and actual browser performance/size measurements. This is compilation and integration, not a flat database conversion.

**[English Resource Grammar](https://delph-in.github.io/docs/erg/ErgSemantics/)** offers richer English analysis with Minimal Recursion Semantics. Its semantic graphs could be mapped into our expressions. It requires a compatible parsing/generation runtime and a substantially more involved integration assessment. Browser-only suitability has not been demonstrated here.

## Provenance and redistribution metadata

Record upstream version/commit, original entry identifiers, transformation version, and source license for every generated pack.

- WordNet identifies its data as CC BY 4.0 in its [repository](https://github.com/globalwordnet/english-wordnet).
- The [UniMorph English README](https://raw.githubusercontent.com/unimorph/eng/master/README.md) identifies CC BY-SA 3.0. Other language datasets can differ.
- The [VerbNet 3.X license](https://verbs.colorado.edu/~mpalmer/projects/verbnet/license.3.0.txt) permits modification and distribution subject to retaining its notices and conditions.
- SGD/SGD-X identify CC BY-SA 4.0 in the [data documentation](https://raw.githubusercontent.com/google-research-datasets/dstc8-schema-guided-dialogue/master/README.md).
- Taskmaster-1 identifies CC BY 4.0 in its [README](https://raw.githubusercontent.com/google-research-datasets/Taskmaster/master/TM-1-2019/README.md). Check other releases separately.
- GF has separate compiler, runtime, library, and imported-lexicon terms. The [core license](https://raw.githubusercontent.com/GrammaticalFramework/gf-core/master/LICENSE) distinguishes the GPL compiler from LGPL/BSD runtimes; the [RGL license](https://raw.githubusercontent.com/GrammaticalFramework/gf-rgl/master/LICENSE) describes its application-grammar exception and lexicon-specific terms. Do not assign one blanket license to every GF-derived artifact.

## LLM training data

Some training datasets are useful, particularly annotated task dialogue. SGD is especially close to our semantic-act and state representation. Its repository is archived, but the data and schema remain accessible.

Raw pretraining corpora have a different purpose. For example, [FineWeb](https://huggingface.co/datasets/HuggingFaceFW/fineweb) exposes text and crawl metadata in Parquet. A structured file format does not mean that each sentence has a semantic annotation. Converting it to JSON would preserve text without producing a parser, belief rules, or a dialogue policy. Learning those from raw text would be a separate training project.

Recommended sequence: assess a small GF English application grammar, import a sense-preserving WordNet subset, add morphology only where needed, then convert selected SGD cases into evaluation fixtures. Retain authored Solarpolis vocabulary, world rules, personality decisions, and voice direction. Believable NPC-to-NPC exchanges remain a subsequent agent-behavior task.
