/**
 * @name Synced Summit Routes
 * @description Records your fastest Don't Look Down climbs and replays normal movement inputs.
 * @author Codex
 * @version 0.3.1
 * @gamemode dontLookDown
 */
const targets = [211, 275, 449, 574, 705, 1000];
// Segment routes use a separate key so older whole-game recordings are preserved.
let saved = api.storage.getValue('segmentRoutesV3', {});
let summitStart = api.storage.getValue('summitOneStartV3', null);
let wasAway = false;
if (!saved || typeof saved !== 'object') saved={};
let cachedHeight=null;
let manager, original, wrapped, panel, timer, mode='waiting', selected=0, run=null, replay=null, replayIndex=0, initialized=false, hide=false, lastPos=null, indicator=null, alignTarget=null, alignStarted=0, driftTicks=0, hiddenAt=0, previousInputPosition=null, previousInputTime=0;
const encode=x=>JSON.parse(JSON.stringify(x,(_k,v)=>typeof v==='number'&&!Number.isFinite(v)?{__ssr_number:String(v)}:v));
const decode=x=>JSON.parse(JSON.stringify(x),(_k,v)=>v && typeof v==='object' && Object.keys(v).length===1 && '__ssr_number' in v ? Number(v.__ssr_number) : v);
function position(){try{let p=api.stores.phaser.mainCharacter.physics.getBody().rigidBody.translation();return {x:p.x,y:p.y};}catch{return null;}}
function height(){for(const e of document.querySelectorAll('span')){const m=/^Height:\s*([\d,]+)m$/i.exec(e.textContent.trim());if(m)return Number(m[1].replace(/,/g,''));}return null;}
function moving(x){return x && (x.isHoldingLeft || x.isHoldingRight || x.jump || x._jumpKeyPressed || Number.isFinite(x.angle));}
function status(s){if(panel)panel.querySelector('.ssr-status').textContent=s;}
function refresh(){if(!panel)return;let r=saved[selected];panel.querySelector('.ssr-summary').textContent=r ? `Best: ${(r.ms/1000).toFixed(1)}s · ${r.frames.length} inputs`:'No recorded route yet';panel.querySelector('.ssr-select').disabled=mode==='playing';}
function stop(reason){mode='idle';replay=null;run=null;status(reason || 'Stopped.');refresh();}
function beginRecording(h, reason){
 if(document.hidden){stop('Return to the game before recording.');return false;}
 if(api.plugins.isEnabled('Desynchronize') || api.plugins.isEnabled('InputRecorder')){stop('Turn off Desynchronize and InputRecorder to record.');return false;}
 const pos=position(); if(!pos || h===null)return false;
 previousInputTime=performance.now();
 run={start:pos,startHeight:h,started:null,frames:[],positions:[],done:Object.fromEntries(targets.map((target,i)=>[i,target<=h]))};
 mode='recording';replay=null;status(reason||'Recording started.');refresh();return true;
}
function onInput(...args){
 const now=performance.now(), currentPosition=position();
 if((mode==='recording'||mode==='playing'||mode==='aligning') && previousInputTime && now-previousInputTime>1000){
   stop('Stopped after a long lag spike. Return to the start and try again.');
 }
 if(currentPosition && summitStart && Number.isFinite(summitStart.x) && Number.isFinite(summitStart.y)){
   const distance=Math.hypot(currentPosition.x-summitStart.x,currentPosition.y-summitStart.y);
   if(distance>3)wasAway=true;
   if(!document.hidden && distance<=0.5 && (mode==='waiting'||(mode==='recording'&&wasAway))){
     const h=height();if(h!==null && beginRecording(h,'Recording from the Summit 1 start.'))wasAway=false;
   }
 }
 previousInputPosition=currentPosition;previousInputTime=now;
 const value=original.apply(this,args);
 if(mode==='aligning'){
   const p=position();
   if(!p || !alignTarget || performance.now()-alignStarted>20000 || Math.abs(p.y-alignTarget.y)>1.5){stop('Could not align. Return to the starting platform.');return value;}
   const dx=alignTarget.x-p.x;
   if(Math.abs(dx)<=0.35){stop('Aligned with the recorded start. Click Play best.');return {...value,angle:null,isHoldingLeft:false,isHoldingRight:false,jump:false,_jumpKeyPressed:false};}
   const right=dx>0;return {...value,angle:right?0:Math.PI,isHoldingLeft:!right,isHoldingRight:right,jump:false,_jumpKeyPressed:false};
 }
 if(mode==='playing'){
   if(replayIndex>=replay.frames.length){stop('Playback finished. Check that you reached the summit.');return {...value,angle:null,isHoldingLeft:false,isHoldingRight:false,jump:false,_jumpKeyPressed:false};}
   const expected=replay.positions?.[replayIndex], actual=position();
   if(expected && actual){
     const distance=Math.hypot(expected.x-actual.x,expected.y-actual.y);
     driftTicks=distance>4?driftTicks+1:0;
     if(driftTicks>=8){stop('Playback stopped: character drifted from the recorded path.');return {...value,angle:null,isHoldingLeft:false,isHoldingRight:false,jump:false,_jumpKeyPressed:false};}
   }
   try{return decode(replay.frames[replayIndex++]);}catch{stop('Playback stopped: invalid saved input.');return value;}
 }
 if(mode==='recording') {try {if(run.started===null){run.started=performance.now();run.start=position()||run.start;}run.frames.push(encode(value));run.positions.push(position());} catch {stop('Could not record the movement input.');} if(run && run.frames.length>60000)stop('Recording limit reached.');}
 return value;
}
function updateIndicator(){
 if(!indicator)return;
 if(mode==='recording' && run){const sec=run.started===null?0:Math.floor((performance.now()-run.started)/1000);indicator.textContent=`● RECORDING ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;indicator.style.background='#a52727';}
 else if(mode==='aligning'){indicator.textContent='↔ ALIGNING START';indicator.style.background='#6d5a19';}
 else if(mode==='playing' && replay){indicator.textContent=`▶ PLAYING ${Math.min(100,Math.floor(replayIndex/replay.frames.length*100))}%`;indicator.style.background='#17658b';}
 else {indicator.textContent='○ NOT RECORDING';indicator.style.background='#444c5a';}
}
function check(){
 if(!panel)return;
 updateIndicator();
 if((mode==='recording'||mode==='playing'||mode==='aligning')&&(api.plugins.isEnabled('Desynchronize')||api.plugins.isEnabled('InputRecorder'))){stop('Stopped: turn off Desynchronize and InputRecorder.');return;}
 const h=height();cachedHeight=h;
 const p=position();lastPos=p;
 if(mode!=='recording'||!run||h===null)return;
 const now=performance.now();
 for(let i=0;i<targets.length;i++){
  if(h>=targets[i]&&!run.done[i] && run.frames.length){run.done[i]=true;const ms=now-run.started;const old=saved[i];if(!old || !old.start || Math.hypot(old.start.x-run.start.x,old.start.y-run.start.y)>0.5 || ms<old.ms){const candidate={ms,start:run.start,frames:run.frames.slice(),positions:run.positions.slice(),format:2};const previous=saved[i];saved[i]=candidate;try{api.storage.setValue('segmentRoutesV3',saved);status(`New best saved for Summit ${i+1}: ${(ms/1000).toFixed(1)}s.`);}catch{if(previous===undefined)delete saved[i];else saved[i]=previous;status('Could not save route; storage may be full.');} refresh();}else{status(`Summit ${i+1}: ${(ms/1000).toFixed(1)}s. Best remains ${(old.ms/1000).toFixed(1)}s.`);}}
 }
 if(h>=1000){mode='idle';run=null;}
}
function button(name,fn){const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=fn;return b;}
function mount(){if(panel)return;panel=document.createElement('div');panel.className='ssr';const title=document.createElement('strong');title.textContent='Summit Routes (experimental)';const row=document.createElement('div');row.className='ssr-row';const menu=document.createElement('div');menu.className='ssr-menu';menu.hidden=true;const recovery=document.createElement('div');recovery.className='ssr-recovery';recovery.hidden=true;const select=document.createElement('select');select.className='ssr-select';select.setAttribute('aria-label','Summit route');targets.forEach((h,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`Summit ${i+1} (${h}m)`;select.append(o);});select.onchange=()=>{selected=Number(select.value);refresh();};
 function playRoute(force){if(mode==='playing')return;if(api.plugins.isEnabled('Desynchronize')||api.plugins.isEnabled('InputRecorder'))return status('Turn off Desynchronize and InputRecorder first.');const r=saved[selected],p=position();if(!r||!Array.isArray(r.frames)||!r.frames.length)return status('No saved route for this summit.');if(!r.start||!Number.isFinite(r.start.x)||!Number.isFinite(r.start.y))return status('Saved route has an invalid start position.');if(document.hidden)return status('Return to the game before playing.');if(!p)return status('Player position unavailable.');const dx=r.start.x-p.x,dy=r.start.y-p.y;if(!force && Math.hypot(dx,dy)>0.5){const dir=dx>0?'right':'left';recovery.hidden=false;return status(`Start is ${Math.abs(dx).toFixed(1)} units ${dir} and ${Math.abs(dy).toFixed(1)} vertically away.`);}recovery.hidden=true;mode='playing';run=null;replay=r;replayIndex=0;driftTicks=0;previousInputTime=performance.now();status(r.positions?'Playing. Press a movement key or Stop to take control.':'Playing an older route without drift detection. Record again for safer playback.');refresh();}
 const mark=button('Set Summit 1 start',()=>{const p=position();if(!p)return status('Player position unavailable.');try{api.storage.setValue('summitOneStartV3',p);summitStart=p;wasAway=false;menu.hidden=true;beginRecording(height(),'Summit 1 start saved. Recording now.');}catch{status('Could not save the start position.');}});
 const record=button('Record a run',()=>{menu.hidden=true;recovery.hidden=true;const p=position();if(!summitStart||!p||Math.hypot(p.x-summitStart.x,p.y-summitStart.y)>0.5)return status('Stand at the marked Summit 1 start first.');wasAway=false;beginRecording(height(),'Recording a new run now.');});
 const align=button('Align start',()=>{const r=saved[selected],p=position(),h=height();if(!r||!p)return status('No saved route or player position.');if(h===null||h>2)return status('Return to the starting platform to align.');if(Math.abs(p.y-r.start.y)>1.5)return status('Saved run started at a different height. Move to the same height or choose Play anyway.');if(Math.abs(p.x-r.start.x)>60)return status('Saved start is too far away to align automatically. Move closer to it first.');if(api.plugins.isEnabled('Desynchronize')||api.plugins.isEnabled('InputRecorder'))return status('Turn off Desynchronize and InputRecorder first.');run=null;replay=null;alignTarget=r.start;alignStarted=performance.now();previousInputTime=alignStarted;mode='aligning';recovery.hidden=true;status('Walking to the recorded start. Press Stop to cancel.');refresh();});
 const play=button('Play saved run',()=>{menu.hidden=true;playRoute(false);});const forcePlay=button('Play anyway',()=>playRoute(true));const start=button('Start ▾',()=>{menu.hidden=!menu.hidden;});
 const stopButton=button('Stop',()=>{menu.hidden=true;recovery.hidden=true;stop('Stopped.');});const show=button('Hide',()=>{panel.style.display='none';hide=true;});const summary=document.createElement('div');summary.className='ssr-summary';const state=document.createElement('div');state.className='ssr-status';state.setAttribute('aria-live','polite');menu.append(mark,record,play);recovery.append(align,forcePlay);row.append(select,start,stopButton,show);panel.append(title,row,menu,recovery,summary,state);indicator=document.createElement('div');indicator.className='ssr-indicator';indicator.setAttribute('role','status');indicator.textContent='○ NOT RECORDING';document.body.append(panel,indicator);status(summitStart?'Waiting to reach the Summit 1 start…':'At Summit 1, open Start and choose Set Summit 1 start.');refresh();updateIndicator();}
function visibility(){if(document.hidden){hiddenAt=performance.now();if(mode==='playing'||mode==='aligning')stop('Playback stopped because the game was hidden.');else if(mode==='recording')stop('Recording stopped because the game was hidden.');}else hiddenAt=0, previousInputPosition=null, previousInputTime=0;}
function manual(e){if(e.isTrusted && (mode==='playing'||mode==='aligning') && ['ArrowLeft','ArrowRight','ArrowUp','KeyA','KeyD','KeyW','Space'].includes(e.code))stop('Playback stopped: manual control.');}
api.UI.addStyles('.ssr{position:fixed;left:12px;bottom:12px;z-index:9999;max-width:430px;background:#192a46;color:white;border-radius:8px;padding:10px;font:13px sans-serif;box-shadow:0 3px 10px #0008}.ssr-row{display:flex;gap:5px;flex-wrap:wrap;margin:6px 0}.ssr-menu,.ssr-recovery{margin:4px 0}.ssr-menu button,.ssr-recovery button{margin-right:5px}.ssr button,.ssr select{background:white;color:#182342;border:0;border-radius:4px;padding:5px}.ssr-status{margin-top:4px}.ssr-indicator{position:fixed;top:70px;left:12px;z-index:9999;color:#fff;background:#444c5a;border-radius:5px;padding:6px 9px;font:bold 12px sans-serif;pointer-events:none}');
api.net.onLoad(()=>{ clearInterval(timer);document.removeEventListener('keydown',manual,true);document.removeEventListener('visibilitychange',visibility);if(manager && manager.getPhysicsInput===wrapped)manager.getPhysicsInput=original;mode='waiting';run=null;replay=null;lastPos=null;previousInputPosition=null;previousInputTime=0;manager=api.stores.phaser?.scene?.inputManager;if(!manager?.getPhysicsInput)return;original=manager.getPhysicsInput;wrapped=onInput;manager.getPhysicsInput=wrapped;initialized=true;mount();timer=setInterval(check,50);document.addEventListener('keydown',manual,true);document.addEventListener('visibilitychange',visibility);});
api.hotkeys.addConfigurableHotkey({category:'Summit Routes',title:'Show or hide Summit Routes',default:{key:'KeyM',alt:true}},()=>{if(!panel)return;hide=!hide;panel.style.display=hide?'none':'block';});
api.onStop(()=>{clearInterval(timer);document.removeEventListener('keydown',manual,true);document.removeEventListener('visibilitychange',visibility);if(manager && manager.getPhysicsInput===wrapped)manager.getPhysicsInput=original;panel?.remove();indicator?.remove();});
