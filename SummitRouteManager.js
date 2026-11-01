/**
 * @name Summit Route Manager
 * @description Organize and replay InputRecorder routes by summit in Don't Look Down.
 * @author Codex
 * @version 1.0.0
 * @gamemode dontLookDown
 * @needsPlugin InputRecorder | https://raw.githubusercontent.com/Gimloader/builds/main/plugins/InputRecorder.js
 */

let routes = api.storage.getValue('summitRoutes', {});
if (!routes || typeof routes !== 'object' || Array.isArray(routes)) routes = {};
let root, current = '1', starting = false, ownedRecording = false, ownedPlayback = false;
const notify = (message, type = 'info') => api.UI.notification.open({ message, type });
const recorder = () => api.plugins.get('InputRecorder')?.getRecorder?.();
function valid(data) {
  if (!data || typeof data !== 'object' || !data.startPos || !Number.isFinite(data.startPos.x) || !Number.isFinite(data.startPos.y) || typeof data.startState !== 'string' || !Array.isArray(data.frames) || !data.frames.length || data.frames.length > 200000) return false;
  try { return !!JSON.parse(data.startState) && data.frames.every(f => f && typeof f === 'object' && !Array.isArray(f)); } catch { return false; }
}
function save(data) { routes[current] = data; api.storage.setValue('summitRoutes', routes); update(); }
function update(message) {
  if (!root) return;
  const r = recorder();
  root.querySelector('.srm-status').textContent = message || (!r ? 'InputRecorder is not ready. Restart the game after installing it.' : r.recording ? `Recording summit ${current}…` : r.playing ? 'Playing route. Press Stop to cancel.' : routes[current] ? `Summit ${current}: route saved (${routes[current].frames.length} frames).` : `Summit ${current}: no route saved.`);
  root.querySelector('.srm-select').disabled = !!(r?.recording || r?.playing || starting);
  root.querySelector('.srm-record').textContent = r?.recording ? 'Finish recording' : 'Record route';
}
function button(text, handler) { const b=document.createElement('button'); b.type='button'; b.textContent=text; b.addEventListener('click',handler); return b; }
function mount() {
  if (root) return;
  root=document.createElement('div'); root.className='srm-panel';
  const heading=document.createElement('strong'); heading.textContent='Summit Route Manager';
  const select=document.createElement('select'); select.className='srm-select'; select.setAttribute('aria-label','Choose summit');
  for(let n=1;n<=6;n++){const o=document.createElement('option');o.value=String(n);o.textContent=`Summit ${n}`;select.append(o);}
  select.onchange=()=>{current=select.value;update();};
  const status=document.createElement('div'); status.className='srm-status'; status.setAttribute('aria-live','polite');
  const record=button('Record route', async()=>{
    const r=recorder(); if(!r || starting || r.playing) return notify('Recorder is not ready or is playing.', 'error');
    if(r.recording){ if(!ownedRecording) return update('Recording was started in InputRecorder; stop it there.'); await r.stopRecording(false); ownedRecording=false; const data={startPos:{x:r.startPos.x,y:r.startPos.y},startState:r.startState,frames:r.frames}; if(!valid(data)) return update('Recording was empty or invalid; previous route kept.'); save(data); update('Route saved for summit '+current+'.'); }
    else { r.startRecording(); ownedRecording=true; update(); }
  }); record.className='srm-record';
  const play=button('Play route',async()=>{
    const r=recorder(), data=routes[current];
    if(!r || r.recording || r.playing || starting) return notify('Recorder is busy or not ready.','error');
    if(!valid(data)) return update('No valid route saved for this summit.');
    starting=true; update('Starting playback…');
    try { api.hotkeys.releaseAll(); await r.playback(data); ownedPlayback=true; update(); } catch(e) { notify('Could not start playback.','error'); update('Playback failed.'); } finally { starting=false; update(); }
  });
  const stop=button('Stop',()=>{ const r=recorder(); if(starting) return update('Playback is starting; try Stop again in a moment.'); if(r?.playing && ownedPlayback){r.stopPlayback();ownedPlayback=false;update('Playback stopped.');} else if(r?.recording && ownedRecording){r.stopRecording(false);ownedRecording=false;update('Recording canceled.');} });
  const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json'; input.style.display='none';
  input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;if(file.size>10000000) throw Error('File too large'); const data=JSON.parse(await file.text()); if(!valid(data)) throw Error('Invalid recording'); save(data); update('Imported route for summit '+current+'.');}catch(e){update('Could not import this recording.');}finally{input.value='';}};
  const load=button('Import recording',()=>{const r=recorder();if(r?.recording||r?.playing||starting)return;input.click();});
  const hide=button('Hide',()=>{root.style.display='none';});
  const row=document.createElement('div'); row.className='srm-row';row.append(select,record,play,stop,load,hide);root.append(heading,row,status,input);document.body.append(root); update();
}
api.UI.addStyles(`.srm-panel{position:fixed;z-index:9999;left:12px;bottom:12px;background:#172340;color:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 12px #0008;font:13px sans-serif;max-width:420px}.srm-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.srm-row button,.srm-row select{padding:5px;border:0;border-radius:4px;color:#172340;background:#fff;cursor:pointer}.srm-status{margin-top:6px}`);
api.net.onLoad(()=>{mount();update();});
api.hotkeys.addConfigurableHotkey({category:'Summit Route Manager',title:'Show or hide route manager',default:{key:'KeyM',alt:true}},()=>{if(!root)mount();root.style.display=root.style.display==='none'?'block':'none';update();});
api.onStop(()=>{const r=recorder();if(!starting && ownedPlayback && r?.playing)r.stopPlayback();if(ownedRecording && r?.recording)r.stopRecording(false);root?.remove();root=null;});
