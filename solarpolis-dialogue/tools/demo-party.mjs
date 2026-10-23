import {makeParty,conversationOptions} from '../examples/party.mjs';
const {session}=makeParty(),conversation=session.conversation(conversationOptions);
let turn;while((turn=conversation.next()))console.log(`${session.language.name(turn.speaker)}: ${turn.pieces.join(' / ')}`);
