import {AgentCore,matches} from './core.mjs';
import {domain} from './solarpolis.mjs';
import {englishModule} from './languages/en/index.mjs';
import {createLanguage} from './language-contract.mjs';
import {resources,scenario} from './languages/en/solarpolis-en.mjs';
import {IndexedDBStorage,MemoryStorage} from './storage.mjs';
import {simulateNPCConversation} from './simulation.mjs';
import lexicalPack from './languages/en/data/lexical-pack.mjs';
const language=createLanguage(englishModule,{resources,domain,options:{lexicalPack}});
const characters=domain.characters.map(c=>({...c,...resources.characters[c.id]}));
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage=new IndexedDBStorage(),persistent=true,session=null,core,view,busy=Promise.resolve(),toastTimer;
$('save-status').textContent='Restoring saved conversation…';
try {session=await storage.load();} catch {storage=new MemoryStorage();persistent=false;}
try {core=new AgentCore(domain,session?.core);} catch {core=new AgentCore(domain);session=null;}
const freshView=()=>({selected:'serein',mode:'choices',tab:'beliefs',expanded:false,simulations:[],messages:Object.fromEntries(characters.map(c=>[c.id,[{kind:'npc',text:c.introduction,time:0}]])),last:{}});
view=session?.view??freshView();
// Update only the initial introduction; retain the player's conversation and save.
for(const npc of characters){const first=view.messages[npc.id]?.[0];if(first?.kind==='npc'&&first.time===0)first.text=npc.introduction;}
view.simulations??=[];
const actor=()=>characters.find(c=>c.id===view.selected);
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
async function persist(){
  const data={version:1,core:core.snapshot(),view:structuredClone(view)};
  try {await storage.save(data);} catch {persistent=false;storage=new MemoryStorage();await storage.save(data);toast('Browser storage is unavailable. This session is in memory; export it to keep a copy.');}
  $('save-status').textContent=persistent?'Saved in this browser':'Memory only · export to keep';
}
function run(fn){busy=busy.then(async()=>{try{await fn();render();await persist();}catch(error){console.error(error);toast(`Could not complete that action: ${error.message}`);}});return busy;}
function addMessage(kind,text){view.messages[view.selected].push({kind,text,time:core.state.time});}
function talk(act,text,trace=null){
  const turnId=`input:${core.state.sequence+1}`;
  const input={...act,id:turnId};
  const plan=core.respond(view.selected,input);
  addMessage('user',text??language.label(input));
  addMessage('npc',language.realize(plan,actor(),{expanded:view.expanded}));
  view.last[view.selected]={act:input,plan,trace:trace?structuredClone(trace):null};
  view.tab='beliefs';
}
function originTag(origin){return origin?.kind==='canon'?'<span class="tag">WORLD BIBLE</span>':origin?.kind==='modeled-rule'?'<span class="tag">MODELED RULE</span>':origin?.kind==='testimony'?'<span class="tag reported">NPC TESTIMONY</span>':origin?.kind==='player'?'<span class="tag reported">PLAYER TESTIMONY</span>':'<span class="tag addition">SAMPLE ADDITION</span>';}
function renderRoster(){
  $('roster').innerHTML=characters.map(c=>`<button class="character-card ${c.id===view.selected?'active':''}" data-character="${c.id}" aria-pressed="${c.id===view.selected}"><span class="avatar ${c.color}" aria-hidden="true">${c.initials}</span><span><strong>${c.name}</strong><small>${c.kind}</small></span>${c.id===view.selected?'<span class="selection">›</span>':''}</button>`).join('');
  const c=actor();
  $('character-heading').innerHTML=`<span class="avatar ${c.color}" aria-hidden="true">${c.initials}</span><div><h2>${c.name}</h2><p>${c.kind} <span aria-hidden="true">·</span> ${esc(c.id==='rill'?language.name(core.world({predicate:'located_at',args:{subject:'rill'}})[0]?.atom.args.place):c.location)}</p></div><span class="role">${c.role}</span>`;
  $('translation-label').hidden=c.id!=='rill';$('expanded').checked=view.expanded;
  $('channel-label').textContent=c.id==='rill'?'NEURAL INTERFACE · LOCAL TEXT':'LOCAL TEXT CONNECTION';
}
function renderMessages(){
  const list=$('messages');list.replaceChildren();
  for(const message of view.messages[view.selected]){
    const element=document.createElement('article');element.className=`message ${message.kind}`;
    if(message.kind==='notice')element.textContent=message.text;
    else{
      const label=document.createElement('div');label.className='message-label';
      label.append(document.createTextNode(message.kind==='user'?'YOU':actor().name.toUpperCase()));
      const time=document.createElement('time');time.textContent=language.clock(message.time);label.append(time);
      const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=message.text;
      element.append(label,bubble);
    }
    list.append(element);
  }
  list.scrollTop=list.scrollHeight;
}
function renderComposer(){
  $('suggestions').hidden=view.mode!=='choices';$('text-form').hidden=view.mode!=='text';
  for(const mode of ['choices','text']){$(`mode-${mode}`).classList.toggle('active',view.mode===mode);$(`mode-${mode}`).setAttribute('aria-pressed',view.mode===mode);}
  $('suggestions').innerHTML=scenario.starterQueries.map((q,i)=>`<button data-question="${i}">${esc(q.label)}<span aria-hidden="true">↗</span></button>`).join('');
  const pending=core.context(view.selected).social?.pending;
  if(pending==='wellbeing')$('suggestions').insertAdjacentHTML('afterbegin','<button data-social="positive">I’m doing well, thanks.</button><button data-social="tired">I’m a little tired.</button>');
  if(pending==='company')$('suggestions').insertAdjacentHTML('afterbegin','<button data-social="company">Yes, some company would be nice.</button><button data-social="boundary">I’d rather leave it alone.</button>');
  $('share-notice').disabled=!core.state.applied.includes(domain.events.venue.id);
  $('source-question').disabled=!core.context(view.selected).lastQuery||!!view.last[view.selected]?.plan.social;
}
function beliefCard(group){
  const e=group.primary;
  const current=core.world().some(f=>matches(f.atom,{...e.atom,polarity:e.atom.polarity??true}));
  const status=e.certainty==='inferred'?'<span class="tag">INFERRED FROM EVIDENCE</span>':e.certainty==='reported'?'<span class="tag reported">PROVISIONAL</span>':!current?'<span class="tag stale">OUTDATED · DIRECTOR VIEW</span>':'<span class="tag">CONFIRMED SOURCE</span>';
  return `<article class="belief-card"><div class="meta">${originTag(e.origin)}${status}</div><h4>${esc(language.sentence(language.clause(e)))}</h4><div class="source">${esc(language.sourceName(e.source))}<br>About ${language.clock(e.aboutTime)} · learned ${language.clock(e.learnedAt)}</div>${group.conflict?'<p>A competing report is retained separately.</p>':''}<details><summary>${group.history.length} evidence record${group.history.length===1?'':'s'} · inspect</summary>${group.history.map(h=>`<div class="evidence-line">${esc(language.clause(h))}<br>${esc(h.certainty)} · ${esc(language.sourceName(h.source))}<br>Learned ${language.clock(h.learnedAt)}</div>`).join('')}</details></article>`;
}
function renderInspector(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===view.tab));
  const element=$('inspector'),last=view.last[view.selected];
  if(view.tab==='beliefs'){
    if(last?.plan.social){
      const social=core.context(view.selected).social;
      element.innerHTML=`<div class="inspector-subtitle">SOCIAL CONVERSATION / ${esc(actor().name.toUpperCase())}</div><h3>A person, not a query.</h3><p>${esc(actor().description)}</p><article class="belief-card"><h4>${esc(last.plan.social.topic.replaceAll('_',' '))}</h4><p>${esc(language.describeDecision(last.plan.decision))}</p><div class="source">${social.userState?`You described yourself as ${esc(social.userState.value)}. This is remembered as your self-report.`:'No wellbeing self-report from you yet.'}</div></article><p>Social dispositions and interests are authored sample characterization. Your mood stays in this conversation; it does not become an authoritative world fact.</p>`;
      return;
    }
    const query=last?.plan.query??[...(last?.plan.plans??[])].reverse().find(p=>p.query)?.query;
    let groups=query?core.beliefs(view.selected,query):core.beliefs(view.selected,{predicate:'located_at'});
    if(!groups.length&&!query)groups=core.beliefs(view.selected).slice(0,4);
    element.innerHTML=`<div class="inspector-subtitle">${esc(actor().name.toUpperCase())} / PERSONAL EVIDENCE</div><h3>What this mind knows.</h3><p>${esc(actor().description)}</p><p>Source confidence describes this character’s evidence. “Outdated” is visible to you as director; the character cannot see that comparison.</p>${groups.length?groups.map(beliefCard).join(''):'<div class="belief-card"><h4>No matching personal evidence.</h4><p>A missing fact stays unknown. The NPC cannot read the World tab.</p></div>'}<div class="stat-row"><span>Testimony policy</span><strong>${actor().personality.testimony}</strong></div><div class="stat-row"><span>Current focus</span><strong>${esc(language.name(core.context(view.selected).focus??'—'))}</strong></div><div class="stat-row"><span>Personal evidence records</span><strong>${core.state.evidence.filter(e=>e.holder===view.selected).length}</strong></div>`;
  } else if(view.tab==='meaning'){
    element.innerHTML=`<div class="inspector-subtitle">LANGUAGE → MEANING → RESPONSE</div><h3>The thought before the words.</h3><p>Dialogue choices and English input send the same kinds of semantic acts to the independent core.</p>${last?`<div class="decision"><p>${esc(language.describeDecision(last.plan.decision))}</p></div><div class="panel-label">INPUT ACT</div><pre>${esc(JSON.stringify(last.act,null,2))}</pre><div class="panel-label">INTERPRETATION TRACE</div><pre>${esc(JSON.stringify(last.trace??{engine:'Direct semantic choice'},null,2))}</pre><div class="panel-label">RESPONSE PLAN</div><pre>${esc(JSON.stringify({function:last.plan.function,outcome:last.plan.outcome,parts:last.plan.plans?.map(p=>({function:p.function,topic:p.social?.topic,outcome:p.outcome})),query:last.plan.query,stance:last.plan.stance,evidence:last.plan.results.map(g=>({id:g.primary.id,certainty:g.primary.certainty,source:g.primary.source})),reason:last.plan.reason},null,2))}</pre>`:'<div class="belief-card"><p>Ask a question to inspect its meaning and the core’s decision.</p></div>'}`;
  } else if(view.tab==='world'){
    const dynamic=core.world().filter(f=>['located_at','starts_at','reservation'].includes(f.atom.predicate));
    element.innerHTML=`<div class="inspector-subtitle">AUTHORITATIVE STATE / DIRECTOR VIEW</div><h3>What actually changed.</h3><p>World truth is supplied by the host adapter. It is kept separate from what each NPC has observed.</p>${dynamic.map(f=>`<article class="belief-card">${originTag(f.origin)}<h4>${esc(language.sentence(language.clause(f)))}</h4><div class="source">Valid from ${language.clock(f.validFrom)}</div></article>`).join('')}<p>${esc(scenario.delayNote)}</p><div class="panel-label">EVENT LOG</div>${core.state.events.slice(-12).reverse().map(e=>`<div class="evidence-line small">${language.clock(e.time)} · ${esc(e.label??(language.name(e.holder)+' received evidence'))}</div>`).join('')||'<p>No scenario changes yet.</p>'}`;
  } else {
    element.innerHTML=`<div class="inspector-subtitle">SOURCE & ADDITIONS</div><h3>A world with a paper trail.</h3><p>${esc(scenario.addition)}</p><label class="sr-only" for="canon-search">Search knowledge</label><input id="canon-search" class="canon-search" type="search" placeholder="Search the modeled knowledge…"><div id="canon-items"></div><p>The prototype combines authored English constructions, a compiled GF grammar, and a selected WordNet / VerbNet language pack. These supply vocabulary and syntax, not world truth. <a href="./languages/en/data/source-manifest.json" target="_blank">Source manifest</a> · <a href="./languages/en/vendor-notices/README.md" target="_blank">Notices</a>. English coverage remains bounded.</p>`;
    const update=()=>{
      const text=$('canon-search').value.toLowerCase();
      $('canon-items').innerHTML=domain.facts.filter(f=>language.clause(f).toLowerCase().includes(text)).map(f=>`<article class="canon-item">${originTag(f.origin)}<p>${esc(language.sentence(language.clause(f)))}</p><small>${esc(f.origin.section??f.origin.source)}</small></article>`).join('')||'<p>No matching modeled facts.</p>';
    };$('canon-search').addEventListener('input',update);update();
  }
}
function renderControls(){
  for(const [id,key] of [['move-venue','venue'],['move-rill','rill'],['send-signal','signal']])$(id).disabled=core.state.applied.includes(domain.events[key].id);
  $('clock').textContent=language.clock(core.state.time);
  $('signal-status').textContent=core.state.pending.length?`Bulletin in transit · ${Math.max(0,core.state.pending[0].due-core.state.time)} minutes remaining.`:core.state.applied.includes(domain.events.signal.id)?'Lunar bulletin received. No signals in transit.':'No signals in transit.';
}
function render(){renderRoster();renderMessages();renderComposer();renderInspector();renderControls();requestAnimationFrame(()=>{$('messages').scrollTop=$('messages').scrollHeight;});}
$('roster').addEventListener('click',event=>{const button=event.target.closest('[data-character]');if(button)run(()=>{view.selected=button.dataset.character;});});
$('suggestions').addEventListener('click',event=>{const button=event.target.closest('[data-question]');if(button)run(()=>{const q=scenario.starterQueries[Number(button.dataset.question)];talk(structuredClone(q.act),q.label);});});
$('suggestions').addEventListener('click',event=>{const button=event.target.closest('[data-social]');if(!button)return;run(()=>{const key=button.dataset.social;talk(key==='boundary'?{function:'social_boundary'}:key==='company'?{function:'accept'}:{function:'disclose',state:key},button.textContent);});});
for(const mode of ['choices','text'])$(`mode-${mode}`).addEventListener('click',()=>run(()=>{view.mode=mode;if(mode==='text')setTimeout(()=>$('input').focus(),0);}));
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>run(()=>{view.tab=button.dataset.tab;})));
$('expanded').addEventListener('change',()=>run(()=>{view.expanded=$('expanded').checked;toast(view.expanded?'Expanded translation applies to Rill’s next replies.':'Standard propositional translation restored.');}));
$('text-form').addEventListener('submit',event=>{event.preventDefault();const text=$('input').value.trim();if(!text)return;run(()=>{const act=language.interpret(text,{...core.context(view.selected),speaker:view.selected});talk(act,text,language.lastInterpretation);$('input').value='';});});
$('input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('text-form').requestSubmit();}});
$('source-question').addEventListener('click',()=>run(()=>talk({function:'ask_evidence'},'How do you know?')));
$('share-notice').addEventListener('click',()=>run(()=>{
  const fact=core.world({predicate:'located_at',args:{subject:'exchange'}})[0];
  core.observe(view.selected,fact,{kind:'publication',label:'amended local notice shown by you'});
  addMessage('notice',`You show ${actor().name} the amended local programme notice.`);
  talk(scenario.starterQueries[0].act,'Where is the exchange now?');
}));
function trigger(key,message){return run(()=>{core.advance(1);const applied=core.applyEvent(domain.events[key]);if(applied){addMessage('notice',message);toast(message);}view.tab='world';});}
$('move-venue').addEventListener('click',()=>trigger('venue','The exchange moves to Current Court. Serein reads the amendment; the other visitors have not.'));
$('move-rill').addEventListener('click',()=>trigger('rill','Rill moves through the aquatic connection to Current Court. Serein receives the presence update; Iona does not.'));
$('send-signal').addEventListener('click',()=>trigger('signal','The lunar slot is confirmed remotely. A signed bulletin begins its 12-minute journey to Threnody.'));
$('advance').addEventListener('click',()=>run(()=>{const before=core.state.pending.length;core.advance(12);if(before&&!core.state.pending.length){addMessage('notice','The lunar bulletin has arrived. All three visitors receive the signed update.');toast('Bulletin received. Ask about the ship’s slot again.');}else toast('Habitat time advanced by 12 minutes.');}));
$('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({format:'solarpolis-conversation-session',version:1,domain,core:core.snapshot(),view},null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='solarpolis-session.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
$('reset').addEventListener('click',()=>run(async()=>{await storage.clear();core=new AgentCore(domain);view=freshView();toast('The sample is back at 16:00.');}));
$('guide-open').addEventListener('click',()=>$('guide').showModal());$('guide-close').addEventListener('click',()=>$('guide').close());
const npcScenes=[
  {initiator:'iona',partner:'serein',goal:scenario.starterQueries[0].act},
  {initiator:'rill',partner:'serein',goal:{function:'ask',query:{args:{subject:'long_song'}}}},
  {initiator:'serein',partner:'iona',goal:{function:'ask',query:{predicate:'reservation',args:{subject:'patient_margin'}}}}
];
$('simulate-npcs').addEventListener('click',()=>run(()=>{
  const scene=npcScenes[Number($('npc-scene').value)];
  const result=simulateNPCConversation(core,language,scene);
  view.simulations.push({...result,scene:Number($('npc-scene').value),time:core.state.time});
  $('npc-transcript').innerHTML=result.turns.map(turn=>`<article class="belief-card"><div class="message-label">${esc(characters.find(c=>c.id===turn.speaker).name)}</div><p>${esc(turn.text)}</p></article>`).join('');
  $('npc-outcome').textContent=result.exchanges.some(e=>e.verified.length)?'A publication was shared and read. The listener’s personal evidence has been updated.':result.exchanges.some(e=>e.reports.length)?'The listener retains attributed testimony. A spoken claim alone does not become verified knowledge.':'The question remained open.';
  $('npc-dialog').showModal();
}));
$('npc-close').addEventListener('click',()=>$('npc-dialog').close());
render();await persist();
