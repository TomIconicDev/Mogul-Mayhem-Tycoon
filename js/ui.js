import { formatMoney, getAchievementData, prestigeGainFor } from './game.js';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

function timeAgo(timestamp) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export class GameUI {
  constructor() {
    this.cashValue = qs('#cashValue');
    this.incomeValue = qs('#incomeValue');
    this.prestigeValue = qs('#prestigeValue');
    this.tapPowerValue = qs('#tapPowerValue');
    this.hypeValue = qs('#hypeValue');
    this.valuationValue = qs('#valuationValue');
    this.companyPanel = qs('#tab-companies');
    this.upgradePanel = qs('#tab-upgrades');
    this.eventPanel = qs('#tab-events');
    this.statsPanel = qs('#tab-stats');
    this.toastStack = qs('#toastStack');
    this.companyTemplate = qs('#companyCardTemplate');
    this.upgradeTemplate = qs('#upgradeCardTemplate');
    this.eventTemplate = qs('#eventCardTemplate');
  }

  bind(actions) {
    qs('#tapButton').addEventListener('click', actions.tap);
    qs('#saveButton').addEventListener('click', actions.save);
    qs('#resetButton').addEventListener('click', actions.reset);
    qs('#moonshotButton').addEventListener('click', actions.moonshot);

    qsa('.tab').forEach((tab) => {
      tab.addEventListener('click', () => this.setTab(tab.dataset.tab));
    });
  }

  setTab(tabName) {
    qsa('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
    qsa('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
  }

  showToast(title, body) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${title}</strong><div>${body}</div>`;
    this.toastStack.prepend(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  renderSummary(state, income) {
    this.cashValue.textContent = formatMoney(state.cash);
    this.incomeValue.textContent = formatMoney(income);
    this.prestigeValue.textContent = `${state.prestige}`;
    this.tapPowerValue.textContent = formatMoney(state.tapPower * state.clickMultiplier * (1 + state.prestige * 0.15));
    this.hypeValue.textContent = `${state.hypeLevel}`;
    this.valuationValue.textContent = formatMoney(state.valuation);
  }

  renderCompanies(companyViews, state, actions) {
    this.companyPanel.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'section-head';
    section.innerHTML = `
      <div>
        <p class="eyebrow">Empire lines</p>
        <h2>Businesses</h2>
      </div>
      <span class="pill">Tap + idle</span>
    `;
    this.companyPanel.append(section);

    companyViews.forEach((company) => {
      const fragment = this.companyTemplate.content.cloneNode(true);
      const root = fragment.querySelector('.company-card');
      root.querySelector('.company-kicker').textContent = company.kicker;
      root.querySelector('.company-name').textContent = company.name;
      root.querySelector('.company-desc').textContent = company.desc;
      root.querySelector('.company-owned').textContent = `${company.owned} owned`;
      root.querySelector('.company-owned').classList.add(company.accent || 'warning');
      root.querySelector('.metric-income').textContent = `${formatMoney(company.income)}/s`;
      root.querySelector('.metric-level').textContent = `${company.level}`;
      root.querySelector('.metric-boost').textContent = `${company.multiplier.toFixed(2)}x`;

      const buyBtn = root.querySelector('.buy-btn');
      buyBtn.textContent = `Buy ${formatMoney(company.buyCost)}`;
      buyBtn.disabled = state.cash < company.buyCost;
      buyBtn.addEventListener('click', () => actions.buyCompany(company.id));

      const upgradeBtn = root.querySelector('.upgrade-btn');
      upgradeBtn.textContent = `Level ${formatMoney(company.upgradeCost)}`;
      upgradeBtn.disabled = company.owned <= 0 || state.cash < company.upgradeCost;
      upgradeBtn.addEventListener('click', () => actions.upgradeCompany(company.id));

      this.companyPanel.append(root);
    });
  }

  renderUpgrades(upgrades, state, actions) {
    this.upgradePanel.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">Stack the nonsense</p>
          <h2>Upgrades</h2>
        </div>
        <span class="pill">${state.ownedUpgrades.length} owned</span>
      </div>
    `;

    if (!upgrades.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>No upgrades waiting.</strong><p class="muted">Buy more companies and your ridiculous empire will unlock more boosts.</p>';
      this.upgradePanel.append(empty);
      return;
    }

    upgrades.forEach((upgrade) => {
      const fragment = this.upgradeTemplate.content.cloneNode(true);
      const root = fragment.querySelector('.upgrade-card');
      root.querySelector('.upgrade-kicker').textContent = upgrade.kicker;
      root.querySelector('.upgrade-name').textContent = upgrade.name;
      root.querySelector('.upgrade-desc').textContent = upgrade.desc;
      root.querySelector('.upgrade-tag').textContent = formatMoney(upgrade.cost);
      const button = root.querySelector('.upgrade-buy');
      button.textContent = 'Buy boost';
      button.disabled = state.cash < upgrade.cost;
      button.addEventListener('click', () => actions.buyUpgrade(upgrade.id));
      this.upgradePanel.append(root);
    });
  }

  renderEvents(state, actions) {
    this.eventPanel.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">Chaos engine</p>
          <h2>Events</h2>
        </div>
        <button class="secondary-btn small" id="manualEventButton">Roll event</button>
      </div>
    `;

    this.eventPanel.querySelector('#manualEventButton').addEventListener('click', actions.triggerEvent);

    const activeBuffs = state.eventQueue.length
      ? state.eventQueue.map((buff) => `
          <div class="stats-card">
            <div class="list-row"><strong>${buff.label}</strong><span>${buff.remaining.toFixed(1)}s left</span></div>
            <div class="muted">Temporary income boost is active.</div>
          </div>
        `).join('')
      : '<div class="empty-state"><strong>No active temporary buffs.</strong><p class="muted">Something ridiculous will happen soon enough.</p></div>';

    const recent = document.createElement('div');
    recent.innerHTML = `<div style="margin:12px 0">${activeBuffs}</div>`;
    this.eventPanel.append(recent);

    const historyHead = document.createElement('div');
    historyHead.style.margin = '12px 0 8px';
    historyHead.innerHTML = '<p class="eyebrow">Recent event history</p>';
    this.eventPanel.append(historyHead);

    if (!state.eventHistory.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>No event history yet.</strong><p class="muted">Your empire has not embarrassed itself on a public stage just yet.</p>';
      this.eventPanel.append(empty);
      return;
    }

    state.eventHistory.forEach((event) => {
      const fragment = this.eventTemplate.content.cloneNode(true);
      const root = fragment.querySelector('.event-card');
      root.querySelector('.event-kicker').textContent = `${event.kicker} • ${timeAgo(event.at)}`;
      root.querySelector('.event-name').textContent = event.name;
      root.querySelector('.event-desc').textContent = event.desc;
      root.querySelector('.event-impact').textContent = event.impactLabel;
      const button = root.querySelector('.event-action');
      button.textContent = 'Nice';
      button.disabled = true;
      this.eventPanel.append(root);
    });
  }

  renderStats(state, income) {
    const achievementData = getAchievementData(state);
    const moonshotGain = prestigeGainFor(state);
    this.statsPanel.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">Empire dashboard</p>
          <h2>Stats</h2>
        </div>
        <span class="pill ${moonshotGain > 0 ? 'success' : ''}">Moonshot +${moonshotGain}</span>
      </div>
    `;

    const statCards = document.createElement('div');
    statCards.className = 'stats-grid';
    statCards.innerHTML = `
      <div class="stats-card">
        <div class="stat-row"><span>Total earned</span><strong>${formatMoney(state.totalEarned)}</strong></div>
        <div class="stat-row"><span>Manual cash</span><strong>${formatMoney(state.stats.manualCash)}</strong></div>
        <div class="stat-row"><span>Passive cash</span><strong>${formatMoney(state.stats.passiveCash)}</strong></div>
        <div class="stat-row"><span>Current income</span><strong>${formatMoney(income)}/s</strong></div>
      </div>
      <div class="stats-card">
        <div class="stat-row"><span>Total taps</span><strong>${state.totalTaps}</strong></div>
        <div class="stat-row"><span>Biggest tap</span><strong>${formatMoney(state.stats.biggestTap)}</strong></div>
        <div class="stat-row"><span>Companies purchased</span><strong>${state.stats.companiesPurchased}</strong></div>
        <div class="stat-row"><span>Upgrades purchased</span><strong>${state.stats.upgradesPurchased}</strong></div>
      </div>
      <div class="stats-card">
        <div class="stat-row"><span>Moonshots launched</span><strong>${state.stats.moonshotsLaunched}</strong></div>
        <div class="stat-row"><span>Session time</span><strong>${Math.floor(state.stats.sessionSeconds)}s</strong></div>
        <div class="stat-row"><span>Prestige owned</span><strong>${state.prestige}</strong></div>
        <div class="stat-row"><span>Valuation</span><strong>${formatMoney(state.valuation)}</strong></div>
      </div>
    `;
    this.statsPanel.append(statCards);

    const achievementCard = document.createElement('div');
    achievementCard.className = 'stats-card';
    achievementCard.innerHTML = `
      <p class="eyebrow">Achievements</p>
      <h3>Progress</h3>
      <div class="progress-shell"><div class="progress-bar" style="width:${(achievementData.filter((a) => a.unlocked).length / achievementData.length) * 100}%"></div></div>
    `;

    achievementData.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <div class="muted">${item.desc}</div>
        </div>
        <span class="pill ${item.unlocked ? 'success' : ''}">${item.unlocked ? 'Unlocked' : 'Locked'}</span>
      `;
      achievementCard.append(row);
    });

    this.statsPanel.append(achievementCard);
  }
}
