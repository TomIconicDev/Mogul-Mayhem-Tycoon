// js/game.js
// FULL UPGRADED VERSION for Mogul Mayhem: Pocket Empire
// Core game logic – completely preserved from original repo with minor cleanups for integration with upgraded UI/scene.
// Includes all calculations, state management, saving, prestige, events, etc.

import {
  COMPANIES,
  UPGRADES,
  EVENT_POOL,
  PRESTIGE,
  SAVE_KEY,
  STARTING_STATE,
} from './config.js';

// Deep clone helper
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Format money with K/M/B notation
export function formatMoney(value) {
  if (value < 1000) return Math.floor(value).toLocaleString();
  if (value < 1000000) return (value / 1000).toFixed(1) + 'K';
  if (value < 1000000000) return (value / 1000000).toFixed(1) + 'M';
  return (value / 1000000000).toFixed(2) + 'B';
}

export function createInitialState() {
  const state = clone(STARTING_STATE);
  COMPANIES.forEach(company => {
    state.companies[company.id] = {
      owned: 0,
      level: 0,
      multiplier: 1,
      tempPenalty: null
    };
  });
  return state;
}

// Company cost calculation
export function calculateCompanyCost(company, owned) {
  return Math.floor(company.baseCost * Math.pow(company.costGrowth, owned));
}

// Single company income
export function calculateCompanyIncome(company, companyState, state) {
  let income = company.baseIncome * (companyState.owned || 0) * (companyState.multiplier || 1);
  if (companyState.tempPenalty) {
    income *= companyState.tempPenalty.multiplier || 1;
  }
  income *= state.incomeMultiplier || 1;
  income *= state.globalBoost || 1;
  return Math.floor(income);
}

// Total passive income per second
export function calculateIncomePerSecond(state) {
  let total = 0;
  COMPANIES.forEach(company => {
    const cs = state.companies[company.id];
    if (cs) total += calculateCompanyIncome(company, cs, state);
  });
  return Math.floor(total);
}

// Tap value
export function calculateTapValue(state) {
  let tap = state.tapPower || 1;
  tap *= state.clickMultiplier || 1;
  tap *= state.globalBoost || 1;
  return Math.floor(tap);
}

// Valuation (rough empire value)
export function calculateValuation(state) {
  let val = state.cash || 0;
  COMPANIES.forEach(company => {
    const cs = state.companies[company.id];
    if (cs && cs.owned > 0) {
      val += calculateCompanyCost(company, cs.owned) * cs.owned * 0.6;
    }
  });
  val += (state.totalEarned || 0) * 0.1;
  return Math.floor(val);
}

// Prestige gain calculation
export function prestigeGainFor(state) {
  const val = calculateValuation(state);
  if (val < PRESTIGE.baseThreshold) return 0;
  return Math.floor((val - PRESTIGE.baseThreshold) / PRESTIGE.divisor) + 1;
}

export function canAfford(state, amount) {
  return (state.cash || 0) >= amount;
}

// Save to localStorage
export function saveState(state) {
  try {
    const saveData = {
      ...state,
      lastSaved: Date.now(),
      version: '1.0.0'
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('Save failed', e);
    return false;
  }
}

// Load from localStorage
export function loadState() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return createInitialState();

    const loaded = JSON.parse(saved);
    const state = { ...createInitialState(), ...loaded };

    // Ensure all companies exist
    COMPANIES.forEach(company => {
      if (!state.companies[company.id]) {
        state.companies[company.id] = { owned: 0, level: 0, multiplier: 1, tempPenalty: null };
      }
    });

    return state;
  } catch (e) {
    console.error('Load failed', e);
    return createInitialState();
  }
}

export function hardReset() {
  localStorage.removeItem(SAVE_KEY);
  return createInitialState();
}

// Main tap action
export function tap(state) {
  const amount = calculateTapValue(state);
  state.cash = (state.cash || 0) + amount;
  state.totalEarned = (state.totalEarned || 0) + amount;
  state.totalTaps = (state.totalTaps || 0) + 1;

  if (amount > (state.stats?.biggestTap || 1)) {
    state.stats.biggestTap = amount;
  }

  // Small hype boost on taps
  state.hypeLevel = Math.min(20, (state.hypeLevel || 1) + 0.02);

  return amount;
}

// Buy company
export function buyCompany(state, companyId) {
  const company = COMPANIES.find(c => c.id === companyId);
  if (!company) return false;

  const cs = state.companies[companyId];
  if (!cs) return false;

  const cost = calculateCompanyCost(company, cs.owned);
  if (!canAfford(state, cost)) return false;

  state.cash -= cost;
  cs.owned += 1;
  state.stats.companiesPurchased = (state.stats.companiesPurchased || 0) + 1;

  // Slight hype increase
  state.hypeLevel = Math.min(20, (state.hypeLevel || 1) + 0.15);

  return true;
}

// Upgrade company level
export function upgradeCompanyLevel(state, companyId) {
  const company = COMPANIES.find(c => c.id === companyId);
  if (!company) return false;

  const cs = state.companies[companyId];
  if (!cs) return false;

  const cost = Math.floor(company.baseCost * 0.9 * Math.pow(1.55, cs.level));
  if (!canAfford(state, cost)) return false;

  state.cash -= cost;
  cs.level += 1;
  cs.multiplier = 1 + (cs.level * 0.25);

  state.stats.upgradesPurchased = (state.stats.upgradesPurchased || 0) + 1;

  return true;
}

// Buy permanent upgrade
export function buyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade || state.ownedUpgrades.includes(upgradeId)) return false;

  if (!canAfford(state, upgrade.cost)) return false;

  state.cash -= upgrade.cost;
  state.ownedUpgrades.push(upgradeId);

  if (upgrade.apply) upgrade.apply(state);

  return true;
}

// Trigger random event
export function triggerRandomEvent(state) {
  if (Math.random() > 0.7) return null; // not every tick

  const event = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  if (!event) return null;

  if (event.apply) event.apply(state);

  state.eventHistory.unshift({
    id: event.id,
    name: event.name,
    time: Date.now()
  });

  if (state.eventHistory.length > 10) state.eventHistory.pop();

  return event;
}

// Progress timed effects (buffs/debuffs)
export function progressTimedEffects(state, deltaSeconds) {
  // Clean expired buffs
  state.eventQueue = (state.eventQueue || []).filter(buff => {
    buff.remaining = (buff.remaining || 0) - deltaSeconds;
    return buff.remaining > 0;
  });

  // Apply global income multiplier from active buffs if needed
}

// Simple offline progress (rough estimate)
export function applyOfflineProgress(state, secondsOffline) {
  if (secondsOffline < 10) return 0;

  const incomePerSec = calculateIncomePerSecond(state);
  const offlineEarnings = Math.floor(incomePerSec * secondsOffline * 0.6); // 60% efficiency

  state.cash += offlineEarnings;
  state.totalEarned += offlineEarnings;

  return offlineEarnings;
}

// Moonshot / Prestige
export function runMoonshot(state) {
  const gain = prestigeGainFor(state);
  if (gain <= 0) return { ok: false, gained: 0 };

  // Reset most progress but keep prestige
  const newState = createInitialState();
  newState.prestige = (state.prestige || 0) + gain;
  newState.stats.moonshotsLaunched = (state.stats?.moonshotsLaunched || 0) + 1;

  // Carry over some hype / multipliers in future versions

  saveState(newState);
  return { ok: true, gained: gain, nextState: newState };
}

// Basic tick (called from main loop)
export function tick(state, deltaSeconds) {
  const now = Date.now();

  // Passive income
  const income = calculateIncomePerSecond(state);
  const earnedThisTick = Math.floor(income * deltaSeconds);

  state.cash = (state.cash || 0) + earnedThisTick;
  state.totalEarned = (state.totalEarned || 0) + earnedThisTick;

  if (income > (state.stats?.biggestIncomePerSecond || 0)) {
    state.stats.biggestIncomePerSecond = income;
  }

  // Progress effects
  progressTimedEffects(state, deltaSeconds);

  // Occasional random event
  if (Math.random() < 0.008) {
    triggerRandomEvent(state);
  }

  // Update valuation
  state.valuation = calculateValuation(state);

  // Decay hype slowly
  state.hypeLevel = Math.max(1, (state.hypeLevel || 1) - deltaSeconds * 0.03);

  state.lastTick = now;
  state.stats.sessionSeconds = (state.stats.sessionSeconds || 0) + deltaSeconds;

  return { passiveEarned: earnedThisTick };
}

// Export everything
export {
  createInitialState,
  formatMoney,
  calculateCompanyCost,
  calculateCompanyIncome,
  calculateIncomePerSecond,
  calculateTapValue,
  calculateValuation,
  prestigeGainFor,
  canAfford,
  saveState,
  loadState,
  hardReset,
  tap,
  buyCompany,
  upgradeCompanyLevel,
  buyUpgrade,
  triggerRandomEvent,
  progressTimedEffects,
  applyOfflineProgress,
  runMoonshot,
  tick
};