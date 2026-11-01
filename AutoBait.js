/**
 * @name Auto Bait
 * @description Earns bait automatically: fast below 10, slow below 30, then stops.
 * @author Adapted from Gimloader Official IdleForXp
 * @version 1.1.0
 * @gamemode fishtopia
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
  api.UI.notification.open({ message: 'Auto Bait is active. Open the question station in Fishtopia.' });
  let lastAnswer = 0;
  const timer = setInterval(() => {
    const counter = document.querySelector('span > img[src*="/map/inventory/resources/bait.png"]')?.parentElement;
    const value = counter?.textContent.trim();
    if (!value || !/^[\d,]+$/.test(value)) return;
    const bait = Number(value.replace(/,/g, ''));
    if (!Number.isSafeInteger(bait) || bait >= 30) return;
    const interval = bait < 10 ? 5000 : 10000;
    if (Date.now() - lastAnswer < interval) return;
    lastAnswer = Date.now();
    answerQuestion();
  }, 1000);
  api.onStop(() => clearInterval(timer));
});
