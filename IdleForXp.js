/**
 * @name IdleForXp
 * @description Answers questions in 2D games; yields to Auto Bait in Fishtopia.
 * @author Adapted from Gimloader Official
 * @version 0.3.8
 * @gamemode 2d
 * @reloadRequired ingame
 */

let questions = [];
let answerDeviceId;
let currentQuestionId;

api.net.colyseus.on('DEVICES_STATES_CHANGES', (event) => {
  for (const change of event.changes) {
    const id = change[0];
    for (let i = 0; i < change[1].length; i++) {
      const key = event.values[change[1][i]];
      const value = change[2][i];
      if (key === 'GLOBAL_questions') {
        try { questions = JSON.parse(value); answerDeviceId = id; } catch { questions = []; }
      }
      const playerId = api.stores.phaser?.mainCharacter?.id;
      if (playerId && key === `PLAYER_${playerId}_currentQuestionId`) currentQuestionId = value;
    }
  }
});

function answerQuestion() {
  const question = questions.find(q => q._id === currentQuestionId);
  if (!question || !answerDeviceId) return;
  const answer = question.type === 'text'
    ? question.answers?.[0]?.text
    : question.answers?.find(a => a.correct)?._id;
  if (answer == null) return;
  api.net.colyseus.send('MESSAGE_FOR_DEVICE', {
    key: 'answered', deviceId: answerDeviceId, data: { answer }
  });
}

api.net.onLoad(() => {
  api.UI.notification.open({ message: 'IdleForXp is active.' });
  let lastAnswer = 0;
  const timer = setInterval(() => {
    const baitCounter = document.querySelector('span > img[src*="/map/inventory/resources/bait.png"]');
    if (api.plugins.isEnabled('Auto Bait') && (api.net.gamemode?.toLowerCase() === 'fishtopia' || baitCounter)) return;
    let interval = 8000;
    if (api.net.gamemode?.toLowerCase() === 'dontlookdown') {
      const counter = document.querySelector('span > img[src*="/map/inventory/resources/energy.png"]')?.parentElement;
      const value = counter?.textContent.trim();
      if (!value || !/^[\d,]+$/.test(value)) return;
      const energy = Number(value.replace(/,/g, ''));
      if (!Number.isSafeInteger(energy) || energy >= 5000) return;
      interval = energy < 2000 ? 6000 : energy < 3000 ? 11000 : 18000;
    }
    if (Date.now() - lastAnswer < interval) return;
    lastAnswer = Date.now();
    answerQuestion();
  }, 1000);
  api.onStop(() => clearInterval(timer));
});
