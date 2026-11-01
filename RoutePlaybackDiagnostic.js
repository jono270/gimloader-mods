/**
 * @name Route Playback Diagnostic
 * @description Temporary short input replay comparison.
 * @author jonathan+codex
 * @version 0.1.0
 * @gamemode dontLookDown
 */
let m,orig,wrap,box,display,mode='idle',frames=[],index=0,start=null,end=null,count=0,timer;
function pos(){try{return api.stores.phaser.mainCharacter.physics.getBody().rigidBody.translation();}catch{return null;}}
function clone(x){return JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='number'&&!Number.isFinite(v)?{n:String(v)}:v));}
function back(x){return JSON.parse(JSON.stringify(x),(_,v)=>v&&typeof v==='object'&&Object.keys(v).length===1&&'n'in v?Number(v.n):v);}
function draw(){if(!display)return;let p=pos();display.textContent=JSON.stringify({mode,start,end,position:p,frames:frames.length,index,sent:count});}
api.net.colyseus.on('send:INPUT',()=>{count++;});
api.net.onLoad(()=>{m=api.stores.phaser.scene.inputManager;orig=m.getPhysicsInput;wrap=function(...a){let v=orig.apply(this,a);if(mode==='record')frames.push(clone(v));if(mode==='play'){if(index>=frames.length){mode='idle';end={...pos()};}else return back(frames[index++]);}return v;};m.getPhysicsInput=wrap;box=document.createElement('div');box.style.cssText='position:fixed;z-index:10000;bottom:100px;left:12px;background:#17213a;color:white;padding:8px;font:12px sans-serif';function b(t,cb){let q=document.createElement('button');q.textContent=t;q.onclick=cb;box.append(q);}b('Begin test',()=>{start={...pos()};frames=[];index=0;mode='record';});b('End test',()=>{mode='idle';end={...pos()};draw();});b('Replay test',()=>{mode='play';index=0;});b('Stop test',()=>{mode='idle';});display=document.createElement('div');box.append(display);document.body.append(box);timer=setInterval(draw,200);});
api.onStop(()=>{clearInterval(timer);box?.remove();if(m?.getPhysicsInput===wrap)m.getPhysicsInput=orig;});
