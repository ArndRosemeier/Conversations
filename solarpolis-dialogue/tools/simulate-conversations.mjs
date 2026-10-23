import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),argument=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const dist=resolve(argument('--dist',fileURLToPath(new URL('../dist/',import.meta.url))));
const [{AgentCore},{EnglishLanguage},{domain},{resources},{simulateNPCConversation}]=await Promise.all(['core.mjs','english.mjs','solarpolis.mjs','solarpolis-en.mjs','simulation.mjs'].map(file=>import(pathToFileURL(resolve(dist,file)))));
const fixture=JSON.parse(await readFile(argument('--fixture',new URL('../tests/fixtures/conversation-scenarios.json',import.meta.url)),'utf8'));
const lexicalPack=JSON.parse(await readFile(resolve(dist,'data/lexical-pack.json'),'utf8'));
const repaired=p=>p.social?.topic==='repair'||p.function==='clarify'||p.plans?.some(repaired);
const conversations=fixture.scenarios.map(scenario=>{
  const core=new AgentCore(domain),language=new EnglishLanguage(resources,{lexicalPack}),actor=domain.characters.find(c=>c.id===scenario.npc);
  const turns=scenario.turns.map(text=>{
    const act=language.interpret(text,{...core.context(actor.id),speaker:actor.id}),plan=core.respond(actor.id,act);
    return {input:text,act,decision:plan.decision,reply:language.realize(plan,actor),repair:!!repaired(plan),trace:language.lastInterpretation};
  });
  return {...scenario,turns,metrics:{turns:turns.length,repairs:turns.filter(t=>t.repair).length,repeatedReplies:turns.length-new Set(turns.map(t=>t.reply)).size}};
});
const language=new EnglishLanguage(resources,{lexicalPack}),core=new AgentCore(domain);core.advance(1);core.applyEvent(domain.events.venue);
const npcConversation=simulateNPCConversation(core,language,{initiator:'iona',partner:'serein',goal:{function:'ask',query:{predicate:'located_at',args:{subject:'exchange',place:{$var:'place'}}}}});
const engineFiles=Object.fromEntries(await Promise.all(['english-defaults.mjs','solarpolis-meaning.mjs','core.mjs','discourse.mjs','english-meaning.mjs','reasoning.mjs','lexical-index.mjs','gf/adapter.mjs','gf/grammar.mjs','data/lexical-pack.json','solarpolis-expanded.mjs','solarpolis-expanded-en.mjs','solarpolis-integration.mjs','solarpolis-integration-en.mjs','english.mjs','social.mjs','english-social.mjs','simulation.mjs','solarpolis.mjs','solarpolis-en.mjs','solarpolis-social.mjs','solarpolis-social-en.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(resolve(dist,file))).digest('hex')])));
const report={generatedAt:new Date().toISOString(),engineFiles,scenarioAuthor:'Luna',judge:'See conversation-review.md for primary-agent qualitative review. Metrics are diagnostics, not a naturalness score.',conversations,npcConversation};
const out=resolve(argument('--output','conversation-report.json'));await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:out,conversations:conversations.length,turns:conversations.reduce((n,c)=>n+c.metrics.turns,0),repairs:conversations.reduce((n,c)=>n+c.metrics.repairs,0),npcTurns:npcConversation.turns.length}));
