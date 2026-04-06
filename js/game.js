import {
  ACHIEVEMENTS,
  COMPANIES,
  EVENT_POOL,
  PRESTIGE,
  SAVE_KEY,
  STARTING_STATE,
  UPGRADES,
  GAME_VERSION,
} from './config.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createInitialState() {
  const state = clone(STARTING_STATE);

  for (const company of COMPANIES) {
    state.companies[company.id] = {
      owned: 0,
      level: 0,
      multiplier: 1,
      tempPenalty: null,
    };
  }

  return state;
}

export function formatMoney(value) {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs < 1_000) return `${sign}$${abs.toFixed(abs >= 100 ? 0 : abs >= 10 ? 1 : 2).replace(/\.00$/, '')}`;

  const units = [
    ['K', 1_000],
    ['M', 1_000_000],
    ['B', 1_000_000_000],
    ['T', 1_000_000_000_000],
    ['Qa', 1_000_000_000_000_000],
  ];

  let chosen = units[0];
  for (const unit of units) {
    if (abs >= unit[1]) chosen = unit;
  }

  return `${sign}$${(abs / chosen[1]).toFixed(abs / chosen[1] >= 100 ? 0 : abs / chosen[1] >= 10 ? 1 : 2).replace(/\.00$/, '')}${chosen[0]}`;
}

export function calculateCompanyCost(company, owned) {
  return Math.floor(company.baseCost * Math.pow(company.costGrowth, owned));
}

export function calculateCompanyIncome(company, companyState, state) {
  if (!companyState) return 0;
  const base = company.baseIncome * companyState.owned;
  const levelBoost = 1 + companyState.level * 0.15;
  const penalty = companyState.tempPenalty ? companyState.tempPenalty.multiplier : 1;
  return base * companyState.multiplier * levelBoost * state.incomeMultiplier * state.globalBoost * (1 + state.prestige * 0.08) * penalty;
}

export function calculateIncomePerSecond(state) {
  let total = 0;
  for (const company of COMPANIES) {
    total += calculateCompanyIncome(company, state.companies[company.id], state);
  }

  for (const buff of state.eventQueue) {
    if (buff.kind === 'incomeBoost') {
      total *= buff.multiplier;
    }
  }

  return total;
}

export function calculateTapValue(state) {
  return state.tapPower * state.clickMultiplier * (1 + state.prestige * 0.15) * state.globalBoost;
}

export function calculateValuation(state) {
  const income = calculateIncomePerSecond(state);
  return state.cash + income * 180 + state.totalEarned * 0.15 + state.prestige * 250_000;
}

export function prestigeGainFor(state) {
  const gain = Math.floor(Math.max(0, state.valuation - PRESTIGE.baseThreshold) / PRESTIGE.divisor);
  return Math.max(0, gain);
}

export function canAfford(state, amount) {
  return state.cash >= amount;
}

export function saveState(state) {
  const payload = {
    version: GAME_VERSION,
    savedAt: Date.now(),
    state,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    const merged = createInitialState();

    Object.assign(merged, parsed.state || {});
    merged.stats = { ...createInitialState().stats, ...(parsed.state?.stats || {}) };
    merged.lastTick = Date.now();

    for (const company of COMPANIES) {
      merged.companies[company.id] = {
        ...createInitialState().companies[company.id],
        ...(parsed.state?.companies?.[company.id] || {}),
      };
    }

    return merged;
  } catch (error) {
    console.warn('Failed to load save, starting fresh.', error);
    return createInitialState();
  }
}

export function hardReset() {
  localStorage.removeItem(SAVE_KEY);
  return createInitialState();
}

export function tap(state) {
  const amount = calculateTapValue(state);
  state.cash += amount;
  state.totalEarned += amount;
  state.totalTaps += 1;
  state.stats.manualCash += amount;
  state.stats.biggestTap = Math.max(state.stats.biggestTap, amount);
  state.hypeLevel = Math.max(1, 1 + Math.floor(Math.log10(Math.max(1, state.totalEarned))));
  return amount;
}

export function buyCompany(state, companyId) {
  const company = COMPANIES.find((item) => item.id === companyId);
  if (!company) return { ok: false, reason: 'Company not found.' };

  const companyState = state.companies[companyId];
  const cost = calculateCompanyCost(company, companyState.owned);
  if (!canAfford(state, cost)) return { ok: false, reason: 'Not enough cash.' };

  state.cash -= cost;
  companyState.owned += 1;
  companyState.level += 1;
  state.stats.companiesPurchased += 1;
  return { ok: true, cost };
}

export function upgradeCompanyLevel(state, companyId) {
  const company = COMPANIES.find((item) => item.id === companyId);
  if (!company) return { ok: false, reason: 'Company not found.' };

  const companyState = state.companies[companyId];
  if (companyState.owned <= 0) return { ok: false, reason: 'Buy the company first.' };

  const cost = Math.floor(company.baseCost * 0.9 * Math.pow(1.55, companyState.level));
  if (!canAfford(state, cost)) return { ok: false, reason: 'Not enough cash.' };

  state.cash -= cost;
  companyState.level += 1;
  return { ok: true, cost };
}

export function buyUpgrade(state, upgradeId) {
  if (state.ownedUpgrades.includes(upgradeId)) return { ok: false, reason: 'Already owned.' };
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade) return { ok: false, reason: 'Upgrade not found.' };

  if (upgrade.companyId && state.companies[upgrade.companyId].owned <= 0) {
    return { ok: false, reason: 'You need the matching company first.' };
  }

  if (!canAfford(state, upgrade.cost)) return { ok: false, reason: 'Not enough cash.' };

  state.cash -= upgrade.cost;
  upgrade.apply(state);
  state.ownedUpgrades.push(upgradeId);
  state.stats.upgradesPurchased += 1;
  return { ok: true, cost: upgrade.cost };
}

export function triggerRandomEvent(state) {
  const event = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  if (!event) return null;

  event.apply(state);
  state.eventHistory.unshift({
    id: `${event.id}-${Date.now()}`,
    name: event.name,
    kicker: event.kicker,
    desc: event.desc,
    impactLabel: event.impactLabel,
    at: Date.now(),
  });
  state.eventHistory = state.eventHistory.slice(0, 12);
  return event;
}

export function progressTimedEffects(state, deltaSeconds) {
  state.eventQueue = state.eventQueue
    .map((buff) => ({ ...buff, remaining: buff.remaining - deltaSeconds }))
    .filter((buff) => buff.remaining > 0);

  for (const company of Object.values(state.companies)) {
    if (company.tempPenalty) {
      company.tempPenalty.remaining -= deltaSeconds;
      if (company.tempPenalty.remaining <= 0) company.tempPenalty = null;
    }
  }
}

export function checkAchievements(state) {
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!state.achievements.includes(achievement.id) && achievement.check(state)) {
      state.achievements.push(achievement.id);
      unlocked.push(achievement);
    }
  }
  return unlocked;
}

export function tick(state, now = Date.now()) {
  const elapsed = clamp((now - state.lastTick) / 1000, 0, 5);
  state.lastTick = now;
  state.stats.sessionSeconds += elapsed;

  const income = calculateIncomePerSecond(state);
  const earned = income * elapsed;
  if (earned > 0) {
    state.cash += earned;
    state.totalEarned += earned;
    state.stats.passiveCash += earned;
  }

  progressTimedEffects(state, elapsed);

  state.valuation = calculateValuation(state);
  state.stats.biggestIncomePerSecond = Math.max(state.stats.biggestIncomePerSecond, income);
  state.hypeLevel = Math.max(1, 1 + Math.floor(Math.log10(Math.max(1, state.valuation))));

  return {
    elapsed,
    income,
    earned,
    achievements: checkAchievements(state),
  };
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsed = clamp((now - state.lastTick) / 1000, 0, 60 * 60 * 3);
  if (elapsed <= 1) {
    state.lastTick = now;
    return 0;
  }

  const income = calculateIncomePerSecond(state);
  const earned = income * elapsed * 0.75;
  state.cash += earned;
  state.totalEarned += earned;
  state.stats.passiveCash += earned;
  state.stats.sessionSeconds += elapsed;
  state.lastTick = now;
  state.valuation = calculateValuation(state);
  checkAchievements(state);
  return earned;
}

export function runMoonshot(state) {
  const gained = prestigeGainFor(state);
  if (gained <= 0) return { ok: false, reason: 'Need a bigger empire before a Moonshot.' };

  const next = createInitialState();
  next.prestige = state.prestige + gained;
  next.stats.moonshotsLaunched = state.stats.moonshotsLaunched + 1;
  next.stats.manualCash = state.stats.manualCash;
  next.stats.passiveCash = state.stats.passiveCash;
  next.stats.biggestTap = state.stats.biggestTap;
  next.stats.biggestIncomePerSecond = state.stats.biggestIncomePerSecond;
  next.stats.companiesPurchased = state.stats.companiesPurchased;
  next.stats.upgradesPurchased = state.stats.upgradesPurchased;
  next.totalEarned = 0;
  next.achievements = [...state.achievements];
  next.lastTick = Date.now();
  return { ok: true, gained, nextState: next };
}

export function getVisibleUpgrades(state) {
  return UPGRADES.filter((upgrade) => {
    if (state.ownedUpgrades.includes(upgrade.id)) return false;
    if (upgrade.companyId) return state.companies[upgrade.companyId].owned > 0;
    return true;
  });
}

export function buildCompanyView(state) {
  return COMPANIES.map((company) => {
    const companyState = state.companies[company.id];
    const buyCost = calculateCompanyCost(company, companyState.owned);
    const upgradeCost = Math.floor(company.baseCost * 0.9 * Math.pow(1.55, companyState.level));
    const income = calculateCompanyIncome(company, companyState, state);
    return {
      ...company,
      ...companyState,
      buyCost,
      upgradeCost,
      income,
    };
  });
}

export function getAchievementData(state) {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlocked: state.achievements.includes(achievement.id),
  }));
}
