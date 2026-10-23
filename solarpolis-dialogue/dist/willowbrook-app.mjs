import {setting} from './settings/willowbrook/setting.mjs';
import {createSettingSession} from './setting-package.mjs';
import {IndexedDBStorage,MemoryStorage} from './storage.mjs';
import {simulateNPCConversation} from './simulation.mjs';
const $=id=>document.getElementById(id);
async function main(){
  let storage=new IndexedDBStorage('conversations-willowbrook-v1'),saved,temporary=false;
  try{saved=await storage.load();}catch{storage=new MemoryStorage();temporary=true;}
  let session,messages,selected='ada',lastAct=null;
  try{session=createSettingSession(setting,{saved});messages=saved?.messages??{};}
  catch{session=createSettingSession(setting);messages={};$('status').textContent='This notebook belongs to an older setting. A fresh morning has begun.';}
  const actor=()=>setting.domain.characters.find(c=>c.id===selected);
  const rows=(target,items)=>{
    target.replaceChildren();
    for(const item of items){
      const div=document.createElement('div');div.className='utterance'+(item.speaker==='You'?' you':'');
      const name=document.createElement('strong');name.textContent=item.speaker;
      const p=document.createElement('p');p.textContent=item.text;div.append(name,p);target.append(div);
    }
    target.scrollTop=target.scrollHeight;
  };
  async function persist(){
    try{await storage.save({...session.snapshot(),messages});$('status').textContent=temporary?'Temporary notebook · browser storage unavailable':'Saved in this browser · Willowbrook has its own notebook';}
    catch{$('status').textContent='The conversation is still here, but the notebook could not be saved.';}
  }
  function render(){
    if(!messages[selected]?.length){const greeting=session.respondAct(selected,{function:'greet'});messages[selected]=[{speaker:actor().name,text:greeting.text}];}
    $('talking-to').textContent=actor().name;
    $('character-note').textContent=selected==='ada'?'A repairer with a dry wit and a habit of checking her notes.':'A gardener, easily delighted, who gives a new report the benefit of the doubt.';
    for(const b of $('characters').children)b.setAttribute('aria-pressed',String(b.dataset.id===selected));
    rows($('messages'),messages[selected]);
    $('clock').textContent=session.language.clock(session.core.state.time);
    $('move').disabled=session.core.state.applied.includes(setting.domain.events.move.id);
    $('delivery').textContent=session.core.state.pending.length?'Moss’s delivery note is on its way.':$('move').disabled?'The delivery note has reached Moss.':'The lantern is still on the workshop bench.';
    $('world').textContent=JSON.stringify(session.core.world().map(f=>f.atom),null,2);
    $('beliefs').textContent=JSON.stringify(session.core.beliefs(selected).map(g=>({atom:g.primary.atom,certainty:g.primary.certainty,source:g.primary.source,aboutTime:g.primary.aboutTime})),null,2);
    $('meaning').textContent=JSON.stringify(lastAct,null,2);
  }
  function say(text,act){
    const reply=act?session.respondAct(selected,act):session.respondText(selected,text);
    messages[selected].push({speaker:'You',text},{speaker:actor().name,text:reply.text});lastAct=reply.act;render();
  }
  // Serialize UI mutations and storage writes, so a reset cannot race an older save.
  let queue=Promise.resolve();
  const run=fn=>{queue=queue.then(async()=>{await fn();await persist();}).catch(error=>{$('status').textContent=`Could not finish that action: ${error.message}`;});};
  for(const c of setting.domain.characters){const b=document.createElement('button');b.dataset.id=c.id;b.textContent=c.name;b.onclick=()=>run(()=>{selected=c.id;render();});$('characters').append(b);}
  for(const choice of setting.demo.choices){const b=document.createElement('button');b.textContent=choice.label;b.onclick=()=>run(()=>say(choice.label,choice.act));$('choices').append(b);}
  $('form').onsubmit=e=>{e.preventDefault();const text=$('message').value.trim();if(text){$('message').value='';run(()=>say(text));}};
  $('move').onclick=()=>run(()=>{if(!session.core.state.applied.includes(setting.domain.events.move.id)){session.core.advance(1);session.core.applyEvent(setting.domain.events.move);}render();});
  $('advance').onclick=()=>run(()=>{session.core.advance(5);render();});
  $('listen').onclick=()=>run(()=>{
    const result=simulateNPCConversation(session.core,session.language,{initiator:'moss',partner:'ada',goal:setting.demo.choices[1].act});
    rows($('npc-messages'),result.turns.map(t=>({speaker:setting.domain.characters.find(c=>c.id===t.speaker).name,text:t.text})));
    render();$('overheard').showModal();
  });
  $('close-listen').onclick=()=>$('overheard').close();
  $('reset').onclick=()=>run(async()=>{await storage.clear();session=createSettingSession(setting);messages={};lastAct=null;render();});
  render();await persist();
}
main().catch(error=>{document.getElementById('status').textContent=`The workshop could not open: ${error.message}`;});
