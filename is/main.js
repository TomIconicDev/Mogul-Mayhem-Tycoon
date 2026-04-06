import { COMPANIES } from './config.js';
import {
  applyOfflineProgress,
  buildCompanyView,
  buyCompany,
  buyUpgrade,
  calculateIncomePerSecond,
  hardReset,
  loadState,
  runMoonshot,
  saveState,
  tap,
  tick,
  triggerRandomEvent,
  upgradeCompanyLevel,
  getVisibleUpgrades,
  formatMoney,
} from './game.js';
import { PocketEmpireScene } from './scene.js';
import { GameUI } from './ui.js';

const canvas = document.querySelector('#sceneCanvas');
const scene = new PocketEmpireScene(canvas);
const ui = new GameUI();

let state = loadState();
const offlineEarned = applyOfflineProgress(state);
if (offlineEarned > 0) {
  setTimeout(() => ui.showToast('Welcome back', `Your empire made ${formatMoney(offlineEarned)} while you were away.`), 200);
}

let companyViews = buildCompanyView(state);
let lastSummaryRenderAt = 0;
let lastPanelRenderAt = 0;
let nextAutoEventAt = Date.now() + randomRange(22000, 38000);

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function renderPanels() {
  companyViews = buildCompanyView(state);
  ui.renderCompanies(companyViews, state, actions);
  ui.renderUpgrades(getVisibleUpgrades(state), state, actions);
  ui.renderEvents(state, actions);
  ui.renderStats(state, calculateIncomePerSecond(state));
}

function renderSummary() {
  const income = calculateIncomePerSecond(state);
  ui.renderSummary(state, income);
  scene.update(state, companyViews);
}

function fullRender() {
  renderSummary();
  renderPanels();
}

function handleResult(result, successTitle, successBodyBuilder) {
  if (!result.ok) {
    ui.showToast('Nope', result.reason);
    return false;
  }
  ui.showToast(successTitle, successBodyBuilder(result));
  fullRender();
  return true;
}

function doTap() {
  tap(state);
  renderSummary();
}

const actions = {
  tap: doTap,
  save: () => {
    saveState(state);
    ui.showToast('Saved', 'Your empire is safely stored on this device.');
  },
  reset: () => {
    const confirmed = window.confirm('Hard reset your empire? This wipes local progress on this device.');
    if (!confirmed) return;
    state = hardReset();
    saveState(state);
    ui.showToast('Fresh start', 'The board has been wiped. The ego remains.');
    fullRender();
  },
  moonshot: () => {
    const result = runMoonshot(state);
    if (!result.ok) {
      ui.showToast('Not yet', result.reason);
      return;
    }
    state = result.nextState;
    saveState(state);
    ui.showToast('Moonshot launched', `Permanent prestige +${result.gained}. Your empire rebooted stronger.`);
    fullRender();
  },
  buyCompany: (companyId) => {
    const company = COMPANIES.find((item) => item.id === companyId);
    const result = buyCompany(state, companyId);
    handleResult(result, 'Company acquired', () => `${company.name} joined the empire for ${formatMoney(result.cost)}.`);
  },
  upgradeCompany: (companyId) => {
    const company = COMPANIES.find((item) => item.id === companyId);
    const result = upgradeCompanyLevel(state, companyId);
    handleResult(result, 'Level up', () => `${company.name} scaled up for ${formatMoney(result.cost)}.`);
  },
  buyUpgrade: (upgradeId) => {
    const result = buyUpgrade(state, upgradeId);
    handleResult(result, 'Upgrade bought', () => `Your empire absorbed another premium growth trick.`);
  },
  triggerEvent: () => {
    const event = triggerRandomEvent(state);
    if (!event) return;
    ui.showToast(event.name, event.impactLabel);
    fullRender();
  },
};

ui.bind(actions);
scene.onTap(actions.tap);
scene.start();
fullRender();

function gameLoop(now) {
  const result = tick(state, now);
  if (result.achievements.length) {
    result.achievements.forEach((achievement) => {
      ui.showToast('Achievement unlocked', `${achievement.name} — ${achievement.desc}`);
    });
  }

  if (Date.now() >= nextAutoEventAt) {
    const event = triggerRandomEvent(state);
    if (event) ui.showToast(event.name, event.impactLabel);
    nextAutoEventAt = Date.now() + randomRange(26000, 45000);
    renderPanels();
  }

  if (now - lastSummaryRenderAt > 180) {
    renderSummary();
    lastSummaryRenderAt = now;
  }

  if (now - lastPanelRenderAt > 1250) {
    renderPanels();
    lastPanelRenderAt = now;
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
setInterval(() => saveState(state), 12000);
window.addEventListener('beforeunload', () => saveState(state));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveState(state);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker failed:', error);
    });
  });
}
