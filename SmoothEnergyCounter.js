/**
 * @name Smooth Energy Counter
 * @description Holds energy gains until R is pressed; displays energy use.
 * @author Codex
 * @version 1.2.0
 */

// Visual only; the game's actual energy does not change.
let counter = null;
let displayed = null;
let previousActual = null;

api.UI.addStyles(`
  [data-smooth-energy] { font-size: 0 !important; }
  [data-smooth-energy] > img { height: var(--smooth-energy-icon-height) !important; }
  [data-smooth-energy]::after {
    content: " " attr(data-smooth-energy);
    white-space: pre;
    font-size: var(--smooth-energy-font-size);
  }
`);

function clearCounter() {
  if (!counter) return;
  counter.removeAttribute('data-smooth-energy');
  counter.style.removeProperty('--smooth-energy-font-size');
  counter.style.removeProperty('--smooth-energy-icon-height');
  counter = null;
  displayed = null;
  previousActual = null;
}

const timer = setInterval(() => {
  const icon = document.querySelector('span > img[src*="/map/inventory/resources/energy.png"]');
  const element = icon?.parentElement;
  if (!element) { clearCounter(); return; }
  const raw = element.textContent.trim();
  if (!/^[\d,]+$/.test(raw)) { clearCounter(); return; }
  const actual = Number(raw.replace(/,/g, ''));
  if (!Number.isSafeInteger(actual)) { clearCounter(); return; }

  if (element !== counter) {
    clearCounter();
    counter = element;
    const fontSize = getComputedStyle(element).fontSize;
    const iconHeight = icon.getBoundingClientRect().height;
    counter.style.setProperty('--smooth-energy-font-size', fontSize);
    counter.style.setProperty('--smooth-energy-icon-height', `${iconHeight}px`);
    displayed = previousActual = actual;
  } else {
    if (actual < previousActual) displayed = Math.max(0, displayed - (previousActual - actual));
    previousActual = actual;
  }
  counter.setAttribute('data-smooth-energy', Math.floor(displayed).toLocaleString('en-US'));
}, 100);

function showActualEnergy(event) {
  if (event.code !== 'KeyR' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (previousActual === null || !counter) return;
  displayed = previousActual;
  counter.setAttribute('data-smooth-energy', displayed.toLocaleString('en-US'));
}

document.addEventListener('keydown', showActualEnergy);
api.onStop(() => {
  document.removeEventListener('keydown', showActualEnergy);
  clearInterval(timer);
  clearCounter();
});
