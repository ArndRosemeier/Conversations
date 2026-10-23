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

## Boundaries

| Module | Responsibility |
| --- | --- |
| `dist/core.mjs` | Typed predicates, temporal world changes, per-character evidence, testimony policies, semantic dialogue acts, context, delayed observations, response plans |
| `dist/solarpolis.mjs` | Selected world-bible facts, domain schema, original characters, personality policies, scenario events |
| `dist/english.mjs` | Bounded English interpretation and realization through an injected language resource package |
| `dist/solarpolis-en.mjs` | Solarpolis names, aliases, English fact realizations, and character voices |
| `dist/storage.mjs` | Interchangeable in-memory and IndexedDB snapshot adapters |
| `dist/app.mjs` | Browser UI and sample host integration, including explicit director controls |

The core imports no domain or browser modules. A test runs it unchanged against an unrelated domain. Dialogue choices bypass parsing and send the same semantic acts as free text. Another language implementation can replace the English module and resources without rewriting agent state.

An observation has an event/about time, a learning time, a source, and confidence status. Player statements become attributed evidence; they never change authoritative world truth. Confirmed does not mean currently true: an NPC's confirmed source may be outdated. The inspector labels that difference from the director's perspective only.

## Scope and provenance

This is an architectural slice, not an open-domain conversational system. English grammar is deliberately bounded and returns clarification on unsupported or ambiguous input. Reasoning currently covers evidence selection, source attribution, temporal updates, testimony policy, conversational reference, and authored attitudes. General rule inference, planning, nested beliefs, negotiation, and automatic knowledge extraction are future work. Most factual clauses are authored and composed; this is not unrestricted text generation.

Setting facts are attributed to sections of **SOLARPOLIS — WORLD BIBLE**, supplied by the user. The Arrival Commons, all named sample visitors, local rooms, exchange, ship, and changing events are additions. The 12-minute remote link is an illustrative scenario parameter, not a canonical orbital position or physical ephemeris. No ship travels during that interval.

Session state stays in the browser's IndexedDB when available, with explicit in-memory fallback and JSON export. This is software persistence, not an in-world mind backup. The full source bible is intentionally excluded from Git and deployment.

Work is committed directly to `main` at the user's request.

## Next design requirement

The user also wants believable simulated conversations between NPCs. This is the next phase, after the current sample: agents will need reasons to initiate and end exchanges, explicit speaker/addressee routing, their own knowledge boundaries, conversational goals, and personality-sensitive turn-taking. It is not implemented in this first sample.
