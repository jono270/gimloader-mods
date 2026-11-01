/**
 * @name Hide Energy Popup
 * @description Hides the Energy (+amount) reward popup.
 * @author jonathan+codex
 * @version 1.0.0
 */

api.UI.addStyles(`
  div.medium-shadow:has(> img[src*="/map/inventory/resources/energy.png"]) {
    visibility: hidden !important;
  }
`);
