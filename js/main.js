import {
  COMPANIES,
  createInitialState,
  getCompanyCost,
  getDerivedState,
  getAvailableUpgradeDefinitions,
  getMoonshotPotential,
  applyMoonshotReset,
  chooseRandomEvent,
  buildEventLogEntry,
  addEventLog,
  formatMoney,
  formatCompactNumber,
  formatDuration,
  clamp,
  totalLevels,
} from "./game-data.js";
import { loadState, saveState, clearState } from "./storage.js";
import { PocketEmpireScene } from "./pocket-empire-scene.js";

const dom = {
  cash: document.getElementById("cash-display"),
  income: document.getElementById("income-display"),
  moonshots: document.getElementById("moonshot-display"),
  tapPower: document.getElementById("tap-power-display"),
  valuation: document.getElementById("valuation-display"),
  hype: document.getElementById("hype-display"),
  companiesList: document.getElementById("companies-list"),
  upgradesList: document.getElementById("upgrades-list"),
  eventLog: document.getElementById("event-log"),
  activeEvents: document.getElementById("active-events"),
  statsGrid: document.getElementById("stats-grid"),
  moonshotPotential: document.getElementById("moonshot-potential"),
  moonshotButton: document.getElementById("moonshot-button"),
  saveButton: document.getElementById("save-button"),
  resetButton: document.getElementById("reset-button"),
  tapButton: document.getElementById("tap-button"),
  floatLayer: document.getElementById("float-layer"),
  toastContainer: document.getElementById("toast-container"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
  tapMult: document.getElementById("tap-mult-display"),
  incomeMult: document.getElementById("income-mult-display"),
  activeBuffsDisplay: document.getElementById("active-buffs-display"),
  saveAgeDisplay: document.getElementById("save-age-display"),
  sceneRoot: document.getElementById("scene-root"),
};

const game = {
  state: createInitialState(),
  derived: getDerivedState(createInitialState()),
  selectedTab: "companies",
  nextEventAt: performance.now() + 16000,
  autoSaveAt: performance.now() + 15000,
  uiDirty: true,
  lastFrameTime: performance.now(),
};

const scene = new PocketEmpireScene({
  mount: dom.sceneRoot,
  onHqTap: ({ x, y }) => {
    performTap(x, y, 1.12);
  },
});

function bootstrap() {
  const loaded = loadState();
  game.state = loaded.state;
  game.derived = getDerivedState(game.state);

  if (loaded.offlineCash > 0) {
    showToast(
      `Welcome back. Offline profits: <strong>${formatMoney(loaded.offlineCash)}</strong> over ${formatDuration(loaded.offlineSeconds)}.`
    );
  }

  if (!loaded.offlineCash && game.state.lastSave && Date.now() - game.state.lastSave < 5000) {
    showToast("Pocket Empire ready. Tap the HQ to stir the market.");
  }

  bindUi();
  updateSceneVisuals();
  renderUi(true);
  startLoop();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.error("Service worker registration failed", error);
      });
    });
  }
}

function bindUi() {
  dom.tapButton.addEventListener("click", (event) => {
    const rect = dom.tapButton.getBoundingClientRect();
    performTap(rect.left + rect.width / 2, rect.top + rect.height / 2, 1);
    dom.tapButton.animate(
      [
        { transform: "translateX(-50%) scale(1)" },
        { transform: "translateX(-50%) scale(0.965)" },
        { transform: "translateX(-50%) scale(1)" },
      ],
      { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  });

  dom.companiesList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-company-key]");
    if (!button) return;
    buyCompany(button.dataset.companyKey);
  });

  dom.upgradesList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-upgrade-id]");
    if (!button) return;
    buyUpgrade(button.dataset.upgradeId);
  });

  dom.moonshotButton.addEventListener("click", performMoonshot);
  dom.saveButton.addEventListener("click", manualSave);
  dom.resetButton.addEventListener("click", hardReset);

  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      manualSave({ silent: true });
    } else {
      game.state.lastUpdate = Date.now();
      game.uiDirty = true;
    }
  });

  window.addEventListener("beforeunload", () => {
    manualSave({ silent: true });
  });
}

function setTab(tabName) {
  game.selectedTab = tabName;
  dom.tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabName));
  dom.tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${tabName}`));
}

function performTap(screenX, screenY, intensity = 1) {
  const amount = game.derived.tapPower * intensity;
  game.state.cash += amount;
  game.state.stats.totalEarned += amount;
  game.state.stats.tapEarned += amount;
  game.state.stats.totalTaps += 1;
  bumpHype(0.22);
  scene.spawnEarningsBurst(intensity);
  spawnFloatingCash(screenX, screenY, amount);
  haptic(10);
  game.uiDirty = true;
}

function buyCompany(companyKey) {
  const company = COMPANIES.find((entry) => entry.key === companyKey);
  if (!company) return;
  const currentLevel = game.state.companies[company.key];
  const cost = getCompanyCost(company, currentLevel);
  if (game.state.cash < cost) {
    showToast(`Need ${formatMoney(cost)} for ${company.name}.`);
    haptic(6);
    return;
  }

  game.state.cash -= cost;
  game.state.companies[company.key] += 1;
  game.state.stats.totalSpent += cost;
  game.state.stats.companyPurchases += 1;
  bumpHype(0.9);
  haptic(16);
  showToast(`${company.name} upgraded to level <strong>${game.state.companies[company.key]}</strong>.`);
  game.uiDirty = true;
}

function buyUpgrade(upgradeId) {
  const upgrade = getAvailableUpgradeDefinitions(game.state).find((entry) => entry.id === upgradeId);
  if (!upgrade) return;
  if (game.state.cash < upgrade.cost) {
    showToast(`Need ${formatMoney(upgrade.cost)} for ${upgrade.name}.`);
    haptic(6);
    return;
  }

  game.state.cash -= upgrade.cost;
  game.state.stats.totalSpent += upgrade.cost;
  game.state.unlockedUpgradeIds.push(upgrade.id);
  upgrade.apply(game.state);
  game.state.stats.upgradesPurchased += 1;
  bumpHype(2.5);
  haptic(18);
  showToast(`${upgrade.name} acquired.`);
  game.uiDirty = true;
}

function performMoonshot() {
  const result = applyMoonshotReset(game.state);
  if (!result || result.points <= 0) {
    showToast("No prestige points yet. Grow the valuation a bit more.");
    haptic(6);
    return;
  }

  game.state = result.newState;
  game.derived = getDerivedState(game.state);
  updateSceneVisuals();
  renderUi(true);
  showToast(`Moonshot complete. Earned <strong>${result.points} PP</strong> permanent prestige.`);
  haptic([16, 24, 32]);
  manualSave({ silent: true });
}

function manualSave({ silent = false } = {}) {
  const result = saveState(game.state);
  if (!silent) {
    if (result.ok) {
      showToast("Saved to this device.");
    } else {
      showToast("Save failed. Local storage may be blocked.");
    }
  }
  game.uiDirty = true;
}

function hardReset() {
  const approved = window.confirm("Reset Pocket Empire completely? Moonshots and progress will be erased.");
  if (!approved) return;

  clearState();
  game.state = createInitialState();
  game.derived = getDerivedState(game.state);
  updateSceneVisuals();
  renderUi(true);
  showToast("Fresh empire. Same questionable ambition.");
  haptic([18, 10]);
}

function startLoop() {
  const tick = (now) => {
    const delta = Math.min(0.12, (now - game.lastFrameTime) / 1000 || 0.016);
    game.lastFrameTime = now;

    advanceSimulation(delta, now);
    scene.update(delta);

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function advanceSimulation(delta, now) {
  pruneExpiredBuffs();
  game.derived = getDerivedState(game.state);

  const passiveGain = game.derived.incomePerSecond * delta;
  if (passiveGain > 0) {
    game.state.cash += passiveGain;
    game.state.stats.totalEarned += passiveGain;
    game.state.stats.passiveEarned += passiveGain;
  }

  game.state.stats.playSeconds += delta;
  game.state.hype = clamp(game.state.hype - delta * 0.065 + totalLevels(game.state) * delta * 0.0007, 0, 100);

  game.state.stats.bestValuation = Math.max(game.state.stats.bestValuation, game.derived.valuation);
  game.state.stats.bestIncomePerSecond = Math.max(game.state.stats.bestIncomePerSecond, game.derived.incomePerSecond);
  game.state.stats.bestTapPower = Math.max(game.state.stats.bestTapPower, game.derived.tapPower);

  if (now >= game.nextEventAt) {
    triggerRandomEvent();
    game.nextEventAt = now + 18000 + Math.random() * 14000;
  }

  if (now >= game.autoSaveAt) {
    manualSave({ silent: true });
    game.autoSaveAt = now + 15000;
  }

  updateSceneVisuals();
  renderUi();
}

function triggerRandomEvent() {
  const event = chooseRandomEvent();
  const outcome = event.apply(game.state, game.derived);
  game.state.stats.randomEventsSeen += 1;

  if (typeof outcome.hype === "number") {
    game.state.hype = clamp(game.state.hype + outcome.hype, 0, 100);
  }

  if (outcome.type === "instant") {
    game.state.cash = Math.max(0, game.state.cash + outcome.cash);
    if (outcome.cash > 0) {
      game.state.stats.totalEarned += outcome.cash;
      game.state.stats.passiveEarned += Math.max(0, outcome.cash);
    }
    if (outcome.cash < 0) {
      game.state.stats.totalSpent += Math.abs(outcome.cash);
    }
    addEventLog(
      game.state,
      buildEventLogEntry(event.name, event.detail, `${outcome.cash >= 0 ? "+" : "-"}${formatMoney(Math.abs(outcome.cash))}`)
    );
  } else if (outcome.type === "buff") {
    game.state.activeBuffs.push({
      id: `buff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: event.name,
      detail: event.detail,
      expiresAt: Date.now() + outcome.duration * 1000,
      mod: {
        incomeMultiplier: outcome.mod?.incomeMultiplier ?? 1,
        tapMultiplier: outcome.mod?.tapMultiplier ?? 1,
      },
    });

    const incomeText =
      outcome.mod?.incomeMultiplier && outcome.mod.incomeMultiplier !== 1
        ? ` income x${outcome.mod.incomeMultiplier.toFixed(2).replace(/\.00$/, "")}`
        : "";
    const tapText =
      outcome.mod?.tapMultiplier && outcome.mod.tapMultiplier !== 1
        ? ` tap x${outcome.mod.tapMultiplier.toFixed(2).replace(/\.00$/, "")}`
        : "";
    addEventLog(game.state, buildEventLogEntry(event.name, event.detail, `${outcome.duration}s${incomeText}${tapText}`));
  }

  if (outcome.toast) {
    showToast(outcome.toast);
  }

  haptic(12);
  game.uiDirty = true;
}

function pruneExpiredBuffs() {
  const now = Date.now();
  const before = game.state.activeBuffs.length;
  game.state.activeBuffs = game.state.activeBuffs.filter((buff) => buff.expiresAt > now);
  if (game.state.activeBuffs.length !== before) {
    game.uiDirty = true;
  }
}

function bumpHype(amount) {
  game.state.hype = clamp(game.state.hype + amount, 0, 100);
}

function updateSceneVisuals() {
  scene.setVisualState({
    valuation: game.derived.valuation,
    companyLevels: game.state.companies,
  });
}

function renderUi(force = false) {
  if (!force && !game.uiDirty) {
    updateSaveAge();
    return;
  }

  game.derived = getDerivedState(game.state);
  dom.cash.textContent = formatMoney(game.state.cash);
  dom.income.textContent = `${formatMoney(game.derived.incomePerSecond)}`;
  dom.moonshots.textContent = `${game.state.moonshots}`;
  dom.tapPower.textContent = `Tap for ${formatMoney(game.derived.tapPower)}`;
  dom.valuation.textContent = formatMoney(game.derived.valuation);
  dom.hype.textContent = `${formatCompactNumber(game.state.hype)} / 100`;
  dom.tapMult.textContent = `x${game.derived.buffTapMult * game.state.multipliers.tap * (1 + game.state.moonshots * 0.18) > 1 ? (game.derived.buffTapMult * game.state.multipliers.tap * (1 + game.state.moonshots * 0.18)).toFixed(2).replace(/\.00$/, "") : "1"}`;
  dom.incomeMult.textContent = `x${game.derived.buffIncomeMult * game.state.multipliers.income * (1 + game.state.moonshots * 0.18) > 1 ? (game.derived.buffIncomeMult * game.state.multipliers.income * (1 + game.state.moonshots * 0.18)).toFixed(2).replace(/\.00$/, "") : "1"}`;

  const moonshotPotential = getMoonshotPotential(game.state);
  dom.moonshotPotential.textContent = `+${moonshotPotential} PP`;
  dom.activeBuffsDisplay.textContent = `${game.state.activeBuffs.length}`;
  updateSaveAge();

  renderCompanies();
  renderUpgrades();
  renderEvents();
  renderStats();

  game.uiDirty = false;
}

function renderCompanies() {
  dom.companiesList.innerHTML = COMPANIES.map((company) => {
    const level = game.state.companies[company.key];
    const cost = getCompanyCost(company, level);
    const nextIncome = company.baseIncome * game.state.companyIncomeMult[company.key] * game.state.multipliers.income;
    const nextTap = company.tapBonus * game.state.multipliers.tap;
    const affordable = game.state.cash >= cost;

    return `
      <article class="card">
        <div class="company-card-top">
          <div class="company-meta">
            <h3 class="company-name">${company.name}</h3>
            <div class="company-tag">${company.tagline}</div>
          </div>
          <div class="level-badge">
            <span>Level</span>
            <strong>${level}</strong>
          </div>
        </div>
        <div class="company-stats">
          <div class="mini-stat">
            <span>Next Cost</span>
            <strong>${formatMoney(cost)}</strong>
          </div>
          <div class="mini-stat">
            <span>Income/lvl</span>
            <strong>${formatMoney(nextIncome)}</strong>
          </div>
          <div class="mini-stat">
            <span>Tap/lvl</span>
            <strong>${formatMoney(nextTap)}</strong>
          </div>
        </div>
        <div class="card-action-row">
          <button class="buy-button" data-company-key="${company.key}" ${affordable ? "" : "disabled"}>
            Buy ${company.name}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderUpgrades() {
  const upgrades = getAvailableUpgradeDefinitions(game.state);

  if (!upgrades.length) {
    dom.upgradesList.innerHTML = `
      <article class="card">
        <div class="upgrade-card-top">
          <div class="upgrade-meta">
            <h3 class="upgrade-name">Nothing new yet</h3>
            <div class="upgrade-tag">Grow company levels to unlock absurdly profitable ideas.</div>
          </div>
        </div>
      </article>
    `;
    return;
  }

  dom.upgradesList.innerHTML = upgrades.map((upgrade) => {
    const affordable = game.state.cash >= upgrade.cost;
    return `
      <article class="card">
        <div class="upgrade-card-top">
          <div class="upgrade-meta">
            <h3 class="upgrade-name">${upgrade.name}</h3>
            <div class="upgrade-tag">${upgrade.tagline}</div>
          </div>
          <div class="level-badge">
            <span>Cost</span>
            <strong>${formatMoney(upgrade.cost)}</strong>
          </div>
        </div>
        <div class="card-action-row">
          <div class="muted">${upgrade.description}</div>
        </div>
        <div class="card-action-row">
          <button class="buy-button secondary" data-upgrade-id="${upgrade.id}" ${affordable ? "" : "disabled"}>
            Acquire upgrade
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderEvents() {
  if (!game.state.activeBuffs.length) {
    dom.activeEvents.innerHTML = `
      <div class="buff-banner">
        <strong>Market is calm</strong>
        <span>No temporary boosts or disasters at the moment.</span>
      </div>
    `;
  } else {
    dom.activeEvents.innerHTML = game.state.activeBuffs.map((buff) => {
      const remaining = Math.max(0, Math.ceil((buff.expiresAt - Date.now()) / 1000));
      const lines = [];
      if (buff.mod?.incomeMultiplier && buff.mod.incomeMultiplier !== 1) {
        lines.push(`Income x${buff.mod.incomeMultiplier.toFixed(2).replace(/\.00$/, "")}`);
      }
      if (buff.mod?.tapMultiplier && buff.mod.tapMultiplier !== 1) {
        lines.push(`Tap x${buff.mod.tapMultiplier.toFixed(2).replace(/\.00$/, "")}`);
      }
      return `
        <div class="buff-banner">
          <strong>${buff.name}</strong>
          <span>${lines.join(" · ") || "Temporary market effect"} · ${remaining}s left</span>
        </div>
      `;
    }).join("");
  }

  if (!game.state.eventLog.length) {
    dom.eventLog.innerHTML = `
      <article class="card">
        <div class="event-card-top">
          <div class="event-meta">
            <h3 class="event-name">No headlines yet</h3>
            <div class="event-tag">The empire has not annoyed the internet enough to generate events.</div>
          </div>
        </div>
      </article>
    `;
    return;
  }

  dom.eventLog.innerHTML = game.state.eventLog.map((entry) => `
    <article class="card">
      <div class="event-card-top">
        <div class="event-meta">
          <h3 class="event-name">${entry.name}</h3>
          <div class="event-tag">${entry.detail}</div>
        </div>
        <div class="level-badge">
          <span>Impact</span>
          <strong>${entry.deltaText || "—"}</strong>
        </div>
      </div>
    </article>
  `).join("");
}

function renderStats() {
  const stats = [
    ["Lifetime earnings", formatMoney(game.state.stats.totalEarned)],
    ["Passive earned", formatMoney(game.state.stats.passiveEarned)],
    ["Tap earned", formatMoney(game.state.stats.tapEarned)],
    ["Total spent", formatMoney(game.state.stats.totalSpent)],
    ["Valuation peak", formatMoney(game.state.stats.bestValuation)],
    ["Best income/sec", formatMoney(game.state.stats.bestIncomePerSecond)],
    ["Best tap power", formatMoney(game.state.stats.bestTapPower)],
    ["Total taps", formatCompactNumber(game.state.stats.totalTaps)],
    ["Company purchases", formatCompactNumber(game.state.stats.companyPurchases)],
    ["Upgrades purchased", formatCompactNumber(game.state.stats.upgradesPurchased)],
    ["Moonshots launched", formatCompactNumber(game.state.stats.moonshotsPerformed)],
    ["Random events seen", formatCompactNumber(game.state.stats.randomEventsSeen)],
    ["Total company levels", formatCompactNumber(totalLevels(game.state))],
    ["Hype level", `${Math.round(game.state.hype)} / 100`],
    ["Play time", formatDuration(game.state.stats.playSeconds)],
    ["Moonshot bonus", `x${(1 + game.state.moonshots * 0.18).toFixed(2).replace(/\.00$/, "")}`],
  ];

  dom.statsGrid.innerHTML = stats
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function spawnFloatingCash(x, y, amount) {
  const element = document.createElement("div");
  element.className = "floating-cash";
  element.textContent = `+${formatMoney(amount)}`;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  dom.floatLayer.appendChild(element);
  window.setTimeout(() => {
    element.remove();
  }, 950);
}

function showToast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.innerHTML = message;
  dom.toastContainer.appendChild(element);
  window.setTimeout(() => {
    element.remove();
  }, 3000);
}

function updateSaveAge() {
  const seconds = Math.max(0, Math.floor((Date.now() - (game.state.lastSave || Date.now())) / 1000));
  dom.saveAgeDisplay.textContent = seconds < 4 ? "just now" : formatDuration(seconds);
}

function haptic(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

bootstrap();
