// js/ui.js
// FULL UPGRADED VERSION for Mogul Mayhem: Pocket Empire
// Includes original tab/card rendering + massive UX upgrades:
// - Floating earnings text with animation
// - Haptic feedback on taps
// - Toast notifications
// - Smooth tab switching with neon highlights
// - Glassmorphism card styles (synced with styles.css)

import { formatMoney, buildCompanyView, getVisibleUpgrades } from './game.js';

let currentTab = 'companies';
let handlers = null; // Will be set from main.js (buy, upgrade, etc.)

export function initUI(initialState, gameHandlers) {
  handlers = gameHandlers;

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Button listeners (global)
  setupGlobalButtons();

  // Initial render
  renderAll(initialState);
}

function setupGlobalButtons() {
  // Moonshot button
  const moonshotBtn = document.getElementById('moonshotButton');
  if (moonshotBtn) {
    moonshotBtn.addEventListener('click', () => {
      if (handlers && handlers.onMoonshot) {
        handlers.onMoonshot();
      }
      if ('vibrate' in navigator) navigator.vibrate(30);
    });
  }

  // Save button
  const saveBtn = document.getElementById('saveButton');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (handlers && handlers.onSave) handlers.onSave();
      showToast('Game saved!', 'success');
    });
  }

  // Reset button
  const resetBtn = document.getElementById('resetButton');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Hard reset? All progress will be lost.')) {
        if (handlers && handlers.onReset) handlers.onReset();
      }
    });
  }

  // Tap button (big CASH IN)
  const tapBtn = document.getElementById('tapButton');
  if (tapBtn) {
    tapBtn.addEventListener('click', (e) => {
      if (handlers && handlers.onTap) {
        const amount = handlers.onTap();
        showFloatingEarnings(amount, e.clientX, e.clientY);
      }
    });
  }
}

function switchTab(tabName) {
  currentTab = tabName;

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });

  // Re-render the active tab content
  renderCurrentTab();
}

function renderCurrentTab() {
  // This will be called after state updates too
  if (!handlers || !handlers.getState) return;
  const state = handlers.getState();

  if (currentTab === 'companies') {
    renderCompanies(state);
  } else if (currentTab === 'upgrades') {
    renderUpgrades(state);
  } else if (currentTab === 'events') {
    renderEvents(state);
  } else if (currentTab === 'stats') {
    renderStats(state);
  }
}

function renderCompanies(state) {
  const container = document.getElementById('tab-companies');
  if (!container) return;
  container.innerHTML = '';

  const companyViews = buildCompanyView(state);

  const template = document.getElementById('companyCardTemplate');

  companyViews.forEach(view => {
    const clone = template.content.cloneNode(true);

    clone.querySelector('.company-kicker').textContent = view.kicker || '';
    clone.querySelector('.company-name').textContent = view.name;
    clone.querySelector('.company-desc').textContent = view.desc || '';
    clone.querySelector('.company-owned').textContent = `×${view.owned}`;

    clone.querySelector('.metric-income').textContent = formatMoney(view.income);
    clone.querySelector('.metric-level').textContent = view.level;
    clone.querySelector('.metric-boost').textContent = `×${view.multiplier.toFixed(1)}`;

    // Buy button
    const buyBtn = clone.querySelector('.buy-btn');
    buyBtn.textContent = `Buy ($${formatMoney(view.buyCost)})`;
    buyBtn.disabled = !handlers.canAfford(view.buyCost);
    buyBtn.addEventListener('click', () => {
      if (handlers.onBuyCompany) {
        handlers.onBuyCompany(view.id);
        showFloatingEarnings(0, 0, 0); // visual feedback only
      }
    });

    // Upgrade button
    const upgradeBtn = clone.querySelector('.upgrade-btn');
    upgradeBtn.textContent = `Upgrade ($${formatMoney(view.upgradeCost)})`;
    upgradeBtn.addEventListener('click', () => {
      if (handlers.onUpgradeCompany) handlers.onUpgradeCompany(view.id);
    });

    container.appendChild(clone);
  });
}

function renderUpgrades(state) {
  const container = document.getElementById('tab-upgrades');
  if (!container) return;
  container.innerHTML = '';

  const upgrades = getVisibleUpgrades(state);
  const template = document.getElementById('upgradeCardTemplate');

  upgrades.forEach(upgrade => {
    const clone = template.content.cloneNode(true);

    clone.querySelector('.upgrade-kicker').textContent = upgrade.kicker || '';
    clone.querySelector('.upgrade-name').textContent = upgrade.name;
    clone.querySelector('.upgrade-desc').textContent = upgrade.desc || '';
    clone.querySelector('.upgrade-tag').textContent = 'Permanent';

    const buyBtn = clone.querySelector('.upgrade-buy');
    buyBtn.textContent = `Buy ($${formatMoney(upgrade.cost)})`;
    buyBtn.addEventListener('click', () => {
      if (handlers.onBuyUpgrade) handlers.onBuyUpgrade(upgrade.id);
    });

    container.appendChild(clone);
  });

  if (upgrades.length === 0) {
    container.innerHTML = '<p style="opacity:0.6; text-align:center;">All upgrades purchased!</p>';
  }
}

function renderEvents(state) {
  const container = document.getElementById('tab-events');
  if (!container) return;
  container.innerHTML = '<p style="opacity:0.6; text-align:center;">Random events appear here when triggered.</p>';
  // Expand with your event rendering logic if you have active events
}

function renderStats(state) {
  const container = document.getElementById('tab-stats');
  if (!container) return;
  container.innerHTML = `
    <div class="glass" style="padding:16px;">
      <h3>Statistics</h3>
      <p>Total Earned: ${formatMoney(state.totalEarned || 0)}</p>
      <p>Total Taps: ${state.totalTaps || 0}</p>
      <p>Moonshots Launched: ${state.stats?.moonshotsLaunched || 0}</p>
      <p>Biggest Tap: ${formatMoney(state.stats?.biggestTap || 1)}</p>
      <p>Session Time: ${Math.floor((state.stats?.sessionSeconds || 0) / 60)} min</p>
    </div>
  `;
}

export function updateUI(state) {
  // Main stats at top
  document.getElementById('cashValue').textContent = formatMoney(state.cash || 0);
  document.getElementById('incomeValue').textContent = formatMoney(handlers ? handlers.getIncomePerSecond() : 0);
  document.getElementById('prestigeValue').textContent = state.prestige || 0;
  document.getElementById('tapPowerValue').textContent = formatMoney(state.tapPower || 1);
  document.getElementById('hypeValue').textContent = Math.floor(state.hypeLevel || 1);
  document.getElementById('valuationValue').textContent = formatMoney(state.valuation || 0);

  // Re-render active tab
  renderCurrentTab();
}

// === FLOATING EARNINGS (the juicy upgrade) ===
export function showFloatingEarnings(amount, screenX, screenY) {
  const overlay = document.getElementById('floatingOverlay');
  if (!overlay) return;

  const el = document.createElement('div');
  el.className = 'floating-text';

  if (amount > 0) {
    el.textContent = `+${formatMoney(amount)}`;
  } else {
    el.textContent = '💰';
    el.style.fontSize = '32px';
  }

  // Position near tap (with slight randomness for delight)
  const offsetX = (Math.random() - 0.5) * 60;
  const offsetY = (Math.random() - 0.5) * 30;
  el.style.left = `${screenX + offsetX}px`;
  el.style.top = `${screenY + offsetY - 40}px`;

  overlay.appendChild(el);

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(12);
  }

  // Auto remove after animation
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1600);
}

// === TOAST NOTIFICATIONS ===
export function showToast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 12px 20px;
    border-radius: 9999px;
    margin-bottom: 8px;
    box-shadow: 0 10px 30px rgba(0,247,255,0.2);
    font-weight: 500;
    animation: slideInToast 0.3s ease forwards;
  `;
  toast.textContent = message;

  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// Simple toast animation (add to styles.css if not present)
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInToast {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Export everything needed by main.js
export {
  initUI,
  updateUI,
  showFloatingEarnings,
  showToast
};