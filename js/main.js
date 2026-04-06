import {
  COMPANIES,
  createInitialState,
  getDerivedState,
  getCompanyCost,
  getAvailableUpgradeDefinitions,
  getMoonshotPotential,
  applyMoonshotReset,
  chooseRandomEvent,
  buildEventLogEntry,
  addEventLog,
  formatMoney,
  formatCompactNumber,
  formatDuration,
  totalLevels,
  clamp,
} from "./game-data.js";
import { loadState, saveState, clearState } from "./storage.js";
import { PocketEmpireScene } from "./pocket-empire-scene.js";

const TAB_META = {
  companies: {
    title: "Companies",
    subtitle: "Grow the parody empire one absurd acquisition at a time.",
  },
  upgrades: {
    title: "Upgrades",
    subtitle: "Ridiculous power plays that turn headlines into margins.",
  },
  events: {
    title: "Events",
    subtitle: "Scandals, breakouts, hype spikes, and occasional market oopsies.",
  },
  stats: {
    title: "Ledger",
    subtitle: "All the serious-looking numbers behind your unserious empire.",
  },
};

const COMPANY_MARKS = {
  cometcat: "CC",
  voltra: "V",
  chattr: "C",
  brainforge: "BF",
  boroloop: "BL",
  starmesh: "SM",
};

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
  quickMoonshotButton: document.getElementById("quick-moonshot-button"),
  quickSaveButton: document.getElementById("quick-save-button"),
  saveButton: document.getElementById("save-button"),
  resetButton: document.getElementById("reset-button"),
  tapButton: document.getElementById("tap-button"),
  floatLayer: document.getElementById("float-layer"),
  toastContainer: document.getElementById("toast-container"),
  navButtons: Array.from(document.querySelectorAll(".nav-button")),
  sheetPanels: Array.from(document.querySelectorAll(".sheet-panel")),
  sheetTitle: document.getElementById("sheet-title"),
  sheetSubtitle: document.getElementById("sheet-subtitle"),
  panelSheet: document.getElementById("panel-sheet"),
  sheetCloseButton: document.getElementById("sheet-close-button"),
  menuButton: document.getElementById("menu-button"),
  sideDrawer: document.getElementById("side-drawer"),
  drawerCloseButton: document.getElementById("drawer-close-button"),
  overlay: document.getElementById("overlay"),
  confirmModal: document.getElementById("confirm-modal"),
  confirmTitle: document.getElementById("confirm-title"),
  confirmKicker: document.getElementById("confirm-kicker"),
  confirmMessage: document.getElementById("confirm-message"),
  confirmCancel: document.getElementById("confirm-cancel"),
  confirmAccept: document.getElementById("confirm-accept"),
  tapMult: document.getElementById("tap-mult-display"),
  incomeMult: document.getElementById("income-mult-display"),
  activeBuffsDisplay: document.getElementById("active-buffs-display"),
  saveAgeDisplay: document.getElementById("save-age-display"),
  sceneRoot: document.getElementById("scene-root"),
  drawerValuation: document.getElementById("drawer-valuation-display"),
  drawerHype: document.getElementById("drawer-hype-display"),
  drawerTap: document.getElementById("drawer-tap-display"),
  drawerIncome: document.getElementById("drawer-income-display"),
  drawerBuffs: document.getElementById("drawer-buffs-display"),
  drawerSaveAge: document.getElementById("drawer-save-age-display"),
  tabOpeners: Array.from(document.querySelectorAll("[data-open-tab]")),
};

const game = {
  state: createInitialState(),
  derived: getDerivedState(createInitialState()),
  selectedTab: "companies",
  lastFrameTime: performance.now(),
  nextEventAt: performance.now() + 18000,
  autoSaveAt: performance.now() + 15000,
  uiDirty: true,
  sheetOpen: true,
  drawerOpen: false,
  modalOpen: false,
  pendingConfirmAction: null,
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

  bindUi();
  setTab(game.selectedTab, { openSheet: true });
  updateSceneVisuals();
  renderUi(true);
  startLoop();

  if (loaded.offlineCash > 0) {
    showToast(
      `Welcome back. Offline profits: <strong>${formatMoney(loaded.offlineCash)}</strong> over ${formatDuration(loaded.offlineSeconds)}.`
    );
  } else {
    showToast("HQ is live. Tap the tower or the orb to juice the market.");
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.error("Service worker registration failed", error);
      });
    });
  }
}

function bindUi() {
  dom.tapButton.addEventListener("click", () => {
    const rect = dom.tapButton.getBoundingClientRect();
    performTap(rect.left + rect.width / 2, rect.top + rect.height / 2, 1);
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

  dom.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTab(button.dataset.tab, { openSheet: true });
      closeDrawer();
    });
  });

  dom.tabOpeners.forEach((button) => {
    button.addEventListener("click", () => {
      setTab(button.dataset.openTab, { openSheet: true });
      closeDrawer();
    });
  });

  dom.sheetCloseButton.addEventListener("click", () => {
    if (game.sheetOpen) {
      closeSheet();
    } else {
      openSheet();
    }
  });

  dom.menuButton.addEventListener("click", () => {
    toggleDrawer();
  });

  dom.drawerCloseButton.addEventListener("click", closeDrawer);
  dom.overlay.addEventListener("click", () => {
    if (game.modalOpen) {
      closeConfirmModal();
      return;
    }
    closeDrawer();
  });

  dom.quickSaveButton.addEventListener("click", () => manualSave());
  dom.saveButton.addEventListener("click", () => manualSave());
  dom.quickMoonshotButton.addEventListener("click", requestMoonshot);
  dom.moonshotButton.addEventListener("click", requestMoonshot);
  dom.resetButton.addEventListener("click", requestHardReset);

  dom.confirmCancel.addEventListener("click", closeConfirmModal);
  dom.confirmAccept.addEventListener("click", () => {
    const action = game.pendingConfirmAction;
    closeConfirmModal();
    if (typeof action === "function") {
      action();
    }
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

function setTab(tabName, { openSheet = true } = {}) {
  if (!TAB_META[tabName]) return;
  game.selectedTab = tabName;

  dom.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabName));
  dom.sheetPanels.forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${tabName}`));
  dom.sheetTitle.textContent = TAB_META[tabName].title;
  dom.sheetSubtitle.textContent = TAB_META[tabName].subtitle;

  if (openSheet) {
    openSheetPanel();
  }
}

function openSheetPanel() {
  game.sheetOpen = true;
  dom.panelSheet.classList.add("open");
  dom.sheetCloseButton.textContent = "Hide";
}

function closeSheet() {
  game.sheetOpen = false;
  dom.panelSheet.classList.remove("open");
  dom.sheetCloseButton.textContent = "Show";
}

function toggleDrawer() {
  if (game.drawerOpen) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

function openDrawer() {
  game.drawerOpen = true;
  dom.sideDrawer.classList.add("open");
  updateOverlayState();
}

function closeDrawer() {
  game.drawerOpen = false;
  dom.sideDrawer.classList.remove("open");
  updateOverlayState();
}

function openConfirmModal({ kicker = "Confirm", title, message, acceptLabel = "Confirm", action }) {
  game.pendingConfirmAction = action;
  game.modalOpen = true;
  dom.confirmKicker.textContent = kicker;
  dom.confirmTitle.textContent = title;
  dom.confirmMessage.textContent = message;
  dom.confirmAccept.textContent = acceptLabel;
  dom.confirmModal.classList.remove("hidden");
  updateOverlayState();
}

function closeConfirmModal() {
  game.pendingConfirmAction = null;
  game.modalOpen = false;
  dom.confirmModal.classList.add("hidden");
  updateOverlayState();
}

function updateOverlayState() {
  dom.overlay.classList.toggle("hidden", !game.drawerOpen && !game.modalOpen);
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
  showToast(`${company.name} upgraded to <strong>level ${game.state.companies[company.key]}</strong>.`);
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

function requestMoonshot() {
  const points = getMoonshotPotential(game.state);
  if (points <= 0) {
    showToast("No prestige points yet. Pump valuation a bit more first.");
    haptic(6);
    return;
  }

  openConfirmModal({
    kicker: "Moonshot",
    title: `Launch for +${points} PP?`,
    message: "Your empire resets, but your moonshots become a permanent prestige bonus.",
    acceptLabel: "Launch",
    action: performMoonshot,
  });
}

function performMoonshot() {
  const result = applyMoonshotReset(game.state);
  if (!result || result.points <= 0) {
    showToast("Moonshot not ready yet.");
    return;
  }

  game.state = result.newState;
  game.derived = getDerivedState(game.state);
  game.uiDirty = true;
  updateSceneVisuals();
  renderUi(true);
  showToast(`Moonshot complete. Earned <strong>${result.points} PP</strong> permanent prestige.`);
  haptic([16, 24, 32]);
  manualSave({ silent: true });
  closeDrawer();
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

function requestHardReset() {
  openConfirmModal({
    kicker: "Reset",
    title: "Start over?",
    message: "This wipes cash, companies, upgrades, and moonshots from this device.",
    acceptLabel: "Reset",
    action: hardReset,
  });
}

function hardReset() {
  clearState();
  game.state = createInitialState();
  game.derived = getDerivedState(game.state);
  game.uiDirty = true;
  updateSceneVisuals();
  renderUi(true);
  showToast("Fresh empire. Same questionable ambition.");
  haptic([18, 10]);
  closeDrawer();
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
        ? ` income x${formatMultiplier(outcome.mod.incomeMultiplier)}`
        : "";
    const tapText =
      outcome.mod?.tapMultiplier && outcome.mod.tapMultiplier !== 1 ? ` tap x${formatMultiplier(outcome.mod.tapMultiplier)}` : "";
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

  const moonshotPotential = getMoonshotPotential(game.state);
  const tapMultiplier = game.derived.buffTapMult * game.state.multipliers.tap * (1 + game.state.moonshots * 0.18);
  const incomeMultiplier = game.derived.buffIncomeMult * game.state.multipliers.income * (1 + game.state.moonshots * 0.18);

  dom.cash.textContent = formatMoney(game.state.cash);
  dom.income.textContent = formatMoney(game.derived.incomePerSecond);
  dom.moonshots.textContent = `${game.state.moonshots}`;
  dom.tapPower.textContent = `Tap for ${formatMoney(game.derived.tapPower)}`;
  dom.valuation.textContent = formatMoney(game.derived.valuation);
  dom.hype.textContent = `${formatCompactNumber(game.state.hype)} / 100`;

  dom.tapMult.textContent = `x${formatMultiplier(tapMultiplier)}`;
  dom.incomeMult.textContent = `x${formatMultiplier(incomeMultiplier)}`;
  dom.activeBuffsDisplay.textContent = `${game.state.activeBuffs.length}`;
  dom.moonshotPotential.textContent = `+${moonshotPotential} PP`;

  dom.drawerValuation.textContent = formatMoney(game.derived.valuation);
  dom.drawerHype.textContent = `${Math.round(game.state.hype)} / 100`;
  dom.drawerTap.textContent = `x${formatMultiplier(tapMultiplier)}`;
  dom.drawerIncome.textContent = `x${formatMultiplier(incomeMultiplier)}`;
  dom.drawerBuffs.textContent = game.state.activeBuffs.length
    ? `${game.state.activeBuffs.length} buff${game.state.activeBuffs.length === 1 ? "" : "s"} active right now.`
    : "No buffs active.";

  renderCompanies();
  renderUpgrades();
  renderEvents();
  renderStats();
  updateSaveAge();

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
      <article class="entity-card">
        <div class="entity-top">
          <div class="entity-main">
            <div class="entity-badge" style="background: linear-gradient(135deg, ${company.color}, rgba(20, 33, 63, 0.82));">${COMPANY_MARKS[company.key] || company.name.slice(0, 2)}</div>
            <div class="entity-copy">
              <h3 class="entity-name">${company.name}</h3>
              <div class="entity-tag">${company.description}</div>
            </div>
          </div>
          <div class="entity-level">
            <span>Level</span>
            <strong>${level}</strong>
          </div>
        </div>
        <div class="entity-metrics">
          <div class="entity-metric">
            <span>Next cost</span>
            <strong>${formatMoney(cost)}</strong>
          </div>
          <div class="entity-metric">
            <span>Income / lvl</span>
            <strong>${formatMoney(nextIncome)}</strong>
          </div>
          <div class="entity-metric">
            <span>Tap / lvl</span>
            <strong>${formatMoney(nextTap)}</strong>
          </div>
        </div>
        <div class="entity-action-row">
          <button class="entity-buy" data-company-key="${company.key}" ${affordable ? "" : "disabled"}>Buy +1 · ${company.name}</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderUpgrades() {
  const upgrades = getAvailableUpgradeDefinitions(game.state);

  if (!upgrades.length) {
    dom.upgradesList.innerHTML = `
      <article class="feed-card">
        <div class="feed-top">
          <div>
            <h3 class="feed-name">Nothing unlocked yet</h3>
            <div class="feed-tag">Push company levels higher to reveal more unreasonably profitable ideas.</div>
          </div>
        </div>
      </article>
    `;
    return;
  }

  dom.upgradesList.innerHTML = upgrades.map((upgrade) => {
    const affordable = game.state.cash >= upgrade.cost;
    return `
      <article class="entity-card">
        <div class="entity-top">
          <div class="entity-main">
            <div class="entity-badge" style="background: linear-gradient(135deg, rgba(119, 163, 255, 0.95), rgba(86, 200, 200, 0.9));">UP</div>
            <div class="entity-copy">
              <h3 class="entity-name">${upgrade.name}</h3>
              <div class="entity-tag">${upgrade.description}</div>
            </div>
          </div>
          <div class="entity-level">
            <span>Cost</span>
            <strong>${formatMoney(upgrade.cost)}</strong>
          </div>
        </div>
        <div class="entity-metrics">
          <div class="entity-metric" style="grid-column: 1 / -1;">
            <span>Effect</span>
            <strong>${upgrade.tagline}</strong>
          </div>
        </div>
        <div class="entity-action-row">
          <button class="entity-buy secondary" data-upgrade-id="${upgrade.id}" ${affordable ? "" : "disabled"}>Acquire upgrade</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderEvents() {
  if (!game.state.activeBuffs.length) {
    dom.activeEvents.innerHTML = `
      <article class="buff-card">
        <div class="feed-top">
          <div>
            <h3 class="feed-name">Market is calm</h3>
            <div class="feed-tag">No temporary boosts or disasters are active right now.</div>
          </div>
        </div>
      </article>
    `;
  } else {
    dom.activeEvents.innerHTML = game.state.activeBuffs.map((buff) => {
      const remaining = Math.max(0, Math.ceil((buff.expiresAt - Date.now()) / 1000));
      const lines = [];
      if (buff.mod?.incomeMultiplier && buff.mod.incomeMultiplier !== 1) {
        lines.push(`Income x${formatMultiplier(buff.mod.incomeMultiplier)}`);
      }
      if (buff.mod?.tapMultiplier && buff.mod.tapMultiplier !== 1) {
        lines.push(`Tap x${formatMultiplier(buff.mod.tapMultiplier)}`);
      }

      return `
        <article class="buff-card">
          <div class="feed-top">
            <div>
              <h3 class="feed-name">${buff.name}</h3>
              <div class="feed-tag">${buff.detail}</div>
            </div>
            <div class="feed-impact">
              <span>Ends in</span>
              <strong>${remaining}s</strong>
            </div>
          </div>
          <div class="entity-metrics" style="margin-top: 10px;">
            <div class="feed-chip" style="grid-column: 1 / -1;">
              <span>Effect</span>
              <strong>${lines.join(" · ") || "Temporary market effect"}</strong>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  if (!game.state.eventLog.length) {
    dom.eventLog.innerHTML = `
      <article class="feed-card">
        <div class="feed-top">
          <div>
            <h3 class="feed-name">No headlines yet</h3>
            <div class="feed-tag">Your empire has not caused enough noise to generate a feed.</div>
          </div>
        </div>
      </article>
    `;
    return;
  }

  dom.eventLog.innerHTML = game.state.eventLog.map((entry) => `
    <article class="feed-card">
      <div class="feed-top">
        <div>
          <h3 class="feed-name">${entry.name}</h3>
          <div class="feed-tag">${entry.detail}</div>
        </div>
        <div class="feed-impact">
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
    ["Best income / sec", formatMoney(game.state.stats.bestIncomePerSecond)],
    ["Best tap power", formatMoney(game.state.stats.bestTapPower)],
    ["Total taps", formatCompactNumber(game.state.stats.totalTaps)],
    ["Company purchases", formatCompactNumber(game.state.stats.companyPurchases)],
    ["Upgrades purchased", formatCompactNumber(game.state.stats.upgradesPurchased)],
    ["Moonshots launched", formatCompactNumber(game.state.stats.moonshotsPerformed)],
    ["Random events seen", formatCompactNumber(game.state.stats.randomEventsSeen)],
    ["Total company levels", formatCompactNumber(totalLevels(game.state))],
    ["Hype level", `${Math.round(game.state.hype)} / 100`],
    ["Play time", formatDuration(game.state.stats.playSeconds)],
    ["Moonshot bonus", `x${formatMultiplier(1 + game.state.moonshots * 0.18)}`],
  ];

  dom.statsGrid.innerHTML = stats.map(([label, value]) => `
    <article class="stat-tile">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function spawnFloatingCash(x, y, amount) {
  const element = document.createElement("div");
  element.className = "floating-cash";
  element.textContent = `+${formatMoney(amount)}`;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  dom.floatLayer.appendChild(element);
  window.setTimeout(() => element.remove(), 960);
}

function showToast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.innerHTML = message;
  dom.toastContainer.appendChild(element);
  window.setTimeout(() => element.remove(), 3000);
}

function updateSaveAge() {
  const seconds = Math.max(0, Math.floor((Date.now() - (game.state.lastSave || Date.now())) / 1000));
  const saveText = seconds < 4 ? "just now" : formatDuration(seconds);
  dom.saveAgeDisplay.textContent = saveText;
  dom.drawerSaveAge.textContent = saveText;
}

function formatMultiplier(value) {
  return value > 1 ? value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") : "1";
}

function haptic(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

bootstrap();
