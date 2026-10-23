# Party conversations — solarpolis-dialogue 0.1.0

This release adds deterministic, incremental NPC conversations for speech bubbles. It supports 2–6 participants, generated profile voices, multiple factual topics, pursuit small talk, and subjective reactions. The host controls proximity, movement, timing and bubble display. It requests one turn at a time; the library has no timers, DOM access, network calls or language-model download.

## Install and run

Install the `solarpolis-dialogue-0.1.0.tgz` asset from the GitHub release:

```sh
npm install ./solarpolis-dialogue-0.1.0.tgz
```

```js
import {createConversationWorld} from 'solarpolis-dialogue';
import {englishModule, createEnglishResources} from 'solarpolis-dialogue/english';

const world = createConversationWorld({profiles: [
  {id:'ona', temperament:'warm', pursuits:['orchard_keeping'],
    bodyKind:'grown_human', ageGroup:'adult'},
  {id:'teo', temperament:'dry', pursuits:['hiking'],
    bodyKind:'shell', ageGroup:'elder'},
  {id:'pip', temperament:'curious', pursuits:['music'],
    bodyKind:'drone_person', ageGroup:'young'}
]});
const session = world.createSession({
  participants:['ona','teo','pip'], languageModule:englishModule,
  resources:createEnglishResources({entities:{ona:'Ona', teo:'Teo', pip:'Pip'}})
});
const conversation = session.conversation({seed:'court-7', day:12, maxTurns:32});
const turn = conversation.next();
// Host: display turn.pieces in order over turn.speaker.
conversation.pause();       // next() now returns null, without advancing anything
conversation.resume();
conversation.stop('walking-on'); // final; no farewell or remaining queue is emitted
```

`day` is an alias for `occasion`. If both are supplied, `occasion` wins. Seeds and occasions accept strings or finite numbers. The ordered participant IDs, seed, occasion, host changes, call order and inputs determine the transcript. No wall clock or global random generator participates. Time advances only through `session.core.advance(minutes)`.

`next()` returns `{index, speaker, to?, kind, act, plan, pieces, text, time, exchanges}`, or null while paused/stopped/completed. `act` contains the factual query where applicable and is null for profile-based moves; their `kind` belongs to the bubble language contract, not to the core's inbound act list. `pieces` is the rendering contract: each string is at most 90 Unicode code points, normally one or two sentences. Long host-supplied names or fact templates wrap into additional pieces without dropping words, polarity or uncertainty; exceptionally long sentences may cross piece boundaries. `text` joins pieces for logs and is **not** limited to 90 characters. Display only the pieces in bubbles.

Default budget: 36 turns; allowed: 1–1000. Budget completion sets `status:'complete'` and `stopReason:'turn-budget'`. Host stop uses `status:'stopped'` and its supplied reason. Pause/resume does not consume a turn or a random draw. The core does not decide how long a bubble stays visible.

## Profiles and voices

The host supplies stable semantic IDs, not per-resident dialogue. `temperament` accepts `warm`, `reserved`, `curious`, `dry`, or `lively`. `pursuits` is an array of IDs. `bodyKind`, `ageGroup` and `home` are optional IDs; `home` must name a registered entity. English includes `orchard_keeping`, `hiking`, `music`; `grown_human`, `shell`, `drone_person`; and `young`, `adult`, `elder`. Unknown body/age IDs use ordinary reflections. An unknown pursuit uses generic project wording until its language resources are supplied:

```js
createEnglishResources({
  entities: {ona:'Ona', teo:'Teo'},
  pursuits: {stargazing:{name:'stargazing', reasons:[
    'I like having something distant to wonder about.'
  ]}}
});
```

These resources are per pursuit/language, not per NPC. Names are host-generated display data. Generated wellbeing is conversational color, not an inferred medical condition or authoritative game-state update. Profiles do not assert employment, external events, friendships or factual expertise. Opinions in this policy are subjective reactions to pursuits and reflections, not newly invented political beliefs. Existing evidence-backed opinion acts remain available in the semantic core.

Turn selection balances participation with seeded variation. Adjacent question/answer exchanges retain their addressee; the wider group is not a round-robin. This is a bounded procedural policy, not autonomous social planning. Long sessions can still reveal repeated sentence patterns.

## Host facts, events and runtime population

Create one `world` catalog for the population, then a small session for each active party. The catalog stores each profile/fact once, indexes facts by recipient and shares entity/predicate schemas. Each party allocates contexts and personal evidence for its participants only. Dispose of inactive sessions in the host. If residents move between parties, transfer/reconcile their saved evidence explicitly; new party sessions do not automatically carry learned gossip from another session.

```js
const world = createConversationWorld({
  entities:{dance:{type:'event'}, pavilion:{type:'place'}},
  predicates:{located_at:{roles:{subject:'entity',place:'entity'},keyRoles:['subject']}},
  profiles:[{id:'ona'},{id:'teo'},{id:'pip'}]
});
world.addFacts([{
  id:'dance-announced-day-12',
  atom:{predicate:'located_at', args:{subject:'dance',place:'pavilion'}},
  validFrom:0, validTo:null, knownBy:['ona'],
  sourceKind:'observation', origin:{kind:'host-event'}
}]);
// Include names for all world entities and templates for all predicates in resources:
const resources=createEnglishResources({
  entities:{ona:'Ona',teo:'Teo',pip:'Pip',dance:'the dance',pavilion:'the pavilion'},
  predicates:{located_at:{positive:'{subject} is at {place}',negative:'{subject} is not at {place}'}}
});
const session=world.createSession({participants:['ona','teo','pip'],languageModule:englishModule,resources});
const chat=session.conversation({seed:17,occasion:12,topics:[
  {function:'ask', query:{predicate:'located_at',args:{subject:'dance',place:{$var:'place'}}}}
]});
```

Topics use existing semantic questions, not English strings. Each supplied topic is consumed once per conversation. A speaker who already knows the answer can volunteer it; otherwise they ask another participant. An uninformed respondent says they do not know. Supply several topics to discuss several events/facts, interleaved with social exchanges.

`world.addCharacter(profile)`, `world.addEntities(record)` and `world.addFacts(array)` work after creation. Facts need unique IDs, explicit provenance, a nonnegative simulation `validFrom`, and `validTo:null`. A newer assertion with the same predicate key replaces the older assertion in an observer's current beliefs; previous evidence remains available. Use monotonically increasing simulation times for changed facts. Facts can name recipients before those residents are registered. `knownBy:[]` teaches nobody; omission teaches every participant. Explicit recipients are recommended. Never use omitted recipients for secrets.

`session.syncKnowledge()` receives eligible catalog additions; conversation `next()` calls it automatically. Future-dated facts wait until the host advances that session's simulation time. Other residents retain their old beliefs until an observation/report reaches them. `world.addFacts` does not advance any clocks. Its batch is validated before any insertion. Existing fact IDs cannot be overwritten; corrections are new assertions.

After adding entities/profiles, update localized names and call `session.refreshLanguage(resources)` on existing sessions that need them. `session.addCharacter(id, resources)` adds a registered resident to the session (maximum six). Create a new conversation to include the newcomer; an existing conversation's participant list is fixed. The host should stop it on a membership change. Predicate schemas are fixed at catalog creation.

The party catalog is a knowledge-distribution layer. Its party cores intentionally have no copied omniscient world in `core.state.world`. Use catalog assertions and the game's own world state as authority. Prefer catalog updates for shared changes; direct `core.applyEvent`/`observe` affect only that session. The older `createSettingSession` API still maintains its standalone world inspector and delayed-event queue.

Spoken answers are heard by all other participants as **reported testimony**, preserving speaker and original fact time. Speech never verifies a document or changes world truth. A source reply uses the evidence actually held: “I saw it myself,” “I read about it,” or a named speaker. “Common knowledge” requires explicit `sourceKind:'common-knowledge'`; the engine never invents “this morning” or public agreement. The policy does not automatically grant a publication-sharing capability.

The 1,000-profile test runs 20 simultaneous three-person sessions without allocating 1,000 contexts per session. This is a structural scaling check, not a 3D frame-budget benchmark. Rendering cost, large inference rule sets and the number of active parties need measurement in the actual game.

## Saves and language contracts

Save `session.snapshot()` and `conversation.snapshot()` together. Rebuild the same world catalog, including additions in the same order, restore the session with `{saved: sessionSnapshot}`, then create its conversation with the same options and `{saved: conversationSnapshot}`. A paused checkpoint stays paused. Snapshots contain pending turns, seeded choice state, learned testimony and group context. They do not include the shared world catalog or language resources. Persist those as host data. Reusing checkpoints against different catalogs is unsupported; the host should version its world saves.

The base language contract remains version 1 and backward compatible. Ambient conversations additionally require adapter `bubbleVersion:1` and `realizeBubble(move, actor):string[]`. The core validates the capability and piece bounds. A module without it fails explicitly. The English implementation remains opt-in through `solarpolis-dialogue/english`; the root entry never imports it.

Bubble kinds are `greeting`, `wellbeing`, `reciprocal`, `pursuit`, `pursuit-question`, `pursuit-answer`, `opinion`, `home`, `home-response`, `reflection`, `reflection-response`, `question`, `answer`, `source-question`, `source`, `acknowledge`, `unknown-response`. The move supplies a deterministic numeric `variant`, the detached profile, relevant pursuit/home/addressee IDs, and (where needed) the detached semantic question, selected answer plan or source evidence. Reflection pairs retain a shared `reflectionTopic` (`pace`, `company`, `possibility`, `rest`, `embodiment`, `experience`) so the response addresses the preceding thought. Another language owns all grammar, voice wording, pursuit labels, sentence splitting and length management. It must express every selected result, including polarity/conflicts/uncertainty, before those results are transmitted as testimony. It receives no omniscient catalog. Modules are trusted code, not sandboxed plugins.

Legacy `simulateNPCConversation(core, language, {initiator, partner, goal})` retains its existing behavior. `{mode:'ambient', participants, topics, seed, day, maxTurns}` drains the new policy synchronously. Use `createNPCConversation` or `session.conversation` for live pause/stop control.

## Optional content and package layout

- `solarpolis-dialogue`: neutral core, setting/session APIs, party policy, persistence adapters. Importing it is worker-safe. IndexedDB is accessed only when the host explicitly calls that adapter.
- `solarpolis-dialogue/english`: parser, realization and generated English bubble voices; no lexical data download.
- `solarpolis-dialogue/canon/solarpolis`: `solarpolisCanon` (frozen) and `createSolarpolisCanon({knownBy})` (extendable copy). This is the selected **180-assertion** world-bible slice, not the full bible. Canon provenance remains intact; sample cast/events and modeled inference rules are excluded. Default knowledge recipients are empty.
- `solarpolis-dialogue/english/solarpolis`: `solarpolisEnglish`, matching canon names/templates. Add host names/templates explicitly.
- `english-lexical-pack.mjs`: separate optional release asset, about 0.5 MB. `import lexicalPack from './english-lexical-pack.mjs'`, then pass `languageOptions:{lexicalPack}` when creating a session. It is absent from the core/English archive and their import graphs. Keep its accompanying `language-source-manifest.json` and `lexical-NOTICES.txt`.

Every exported module has TypeScript declarations. The archive has no runtime dependencies. It includes the existing GF/RGL/application-grammar notices; lexical sources have their separate notices. Release assets include SHA-256 checksums. This is a GitHub release archive, not an npm registry publication.

Repository checks: `npm test`, `npm run demo:party`, `npm run demo:willowbrook`, `npm run build`, `npm run build:release`, `npm run test:types`. Packaging uses the installed esbuild and TypeScript development tools; hosts need neither to execute the archive.
