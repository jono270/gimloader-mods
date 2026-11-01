/**
 * @name DLD Input Probe
 * @description Temporary diagnostic for normal movement input in Don't Look Down.
 * @author Codex
 * @version 0.2.0
 * @gamemode dontLookDown
 */
let panel, manager, original, wrapper, timer, latest = null, sent = 0, lastPacket = null, testFrames = 0;
api.net.colyseus.on('send:INPUT', data => { sent++; lastPacket = data; });
api.net.onLoad(() => {
  manager = api.stores.phaser?.scene?.inputManager;
  if (!manager?.getPhysicsInput) return;
  original=manager.getPhysicsInput;
  wrapper=function(...args){ const result=original.apply(this,args); try { latest=JSON.parse(JSON.stringify(result)); } catch {} if(testFrames>0){testFrames--; return {...result,angle:0,isHoldingRight:true,isHoldingLeft:false,jump:false,_jumpKeyPressed:false};} return result; };
  manager.getPhysicsInput=wrapper;
  panel=document.createElement('div'); panel.style.cssText='position:fixed;bottom:10px;left:10px;z-index:99999;background:#132344;color:white;padding:8px;font:12px monospace;max-width:450px'; const display=document.createElement('span'); const test=document.createElement('button'); test.textContent='Test short replay'; test.onclick=()=>{testFrames=35;}; panel.append(test,display); document.body.append(panel);
  timer=setInterval(()=>{let pos;try {pos=api.stores.phaser.mainCharacter.physics.getBody().rigidBody.translation();} catch{} display.textContent='DLD probe: '+JSON.stringify({input:latest,position:pos,sent,lastPacket});},500);
});
api.onStop(()=>{clearInterval(timer);panel?.remove();if(manager?.getPhysicsInput===wrapper)manager.getPhysicsInput=original;});
