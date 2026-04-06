export const STORAGE_KEY = "mogul-mayhem-pocket-empire-save-v1";

export const COMPANIES = [
  {
    key: "cometcat",
    name: "CometCat",
    tagline: "Reusable rocket nonsense",
    description: "A fast-growing rocket startup with too many launch livestreams.",
    baseCost: 20,
    costScale: 1.17,
    baseIncome: 0.4,
    tapBonus: 0.5,
    color: "#78b8ff",
  },
  {
    key: "voltra",
    name: "Voltra",
    tagline: "Electric car vibes",
    description: "Luxury batteries, sharp corners, and a suspicious number of preorders.",
    baseCost: 120,
    costScale: 1.18,
    baseIncome: 2.5,
    tapBonus: 1.1,
    color: "#6be1c9",
  },
  {
    key: "chattr",
    name: "Chattr",
    tagline: "Posting as a business model",
    description: "Ad-funded discourse with a premium chaos tier.",
    baseCost: 900,
    costScale: 1.19,
    baseIncome: 12,
    tapBonus: 3,
    color: "#9aa8ff",
  },
  {
    key: "brainforge",
    name: "BrainForge",
    tagline: "AI, but louder",
    description: "A glowing chip company that confidently ships predictions.",
    baseCost: 6000,
    costScale: 1.205,
    baseIncome: 66,
    tapBonus: 10,
    color: "#7de6f2",
  },
  {
    key: "boroloop",
    name: "BoroLoop",
    tagline: "Tunnels for everyone",
    description: "Solve traffic by digging dramatic circles under everything.",
    baseCost: 45000,
    costScale: 1.215,
    baseIncome: 360,
    tapBonus: 24,
    color: "#ffd585",
  },
  {
    key: "starmesh",
    name: "StarMesh",
    tagline: "Orbiting internet",
    description: "Tiny satellites, huge opinions, recurring revenue.",
    baseCost: 300000,
    costScale: 1.225,
    baseIncome: 1800,
    tapBonus: 60,
    color: "#aac9ff",
  },
];

export const UPGRADES = [
  {
    id: "pr-interns",
    name: "PR Intern Swarm",
    tagline: "More hype per tap",
    description: "A cheerful army of interns turns each tap into a mini earnings call.",
    cost: 100,
    unlock: (state) => state.companies.cometcat >= 3,
    apply(state) {
      state.multipliers.tap *= 1.5;
    },
  },
  {
    id: "battery-whisperers",
    name: "Battery Whisperers",
    tagline: "Voltra output x2",
    description: "A mysterious team gets more range out of pure confidence.",
    cost: 500,
    unlock: (state) => state.companies.voltra >= 5,
    apply(state) {
      state.companyIncomeMult.voltra *= 2;
    },
  },
  {
    id: "algorithm-spark",
    name: "Algorithm Spark",
    tagline: "Global income x1.2",
    description: "An algorithm tweak nobody understands somehow boosts margins.",
    cost: 1500,
    unlock: (state) => state.companies.chattr >= 3,
    apply(state) {
      state.multipliers.income *= 1.2;
    },
  },
  {
    id: "boardroom-espresso",
    name: "Boardroom Espresso",
    tagline: "Tap x1.5, forever caffeinated",
    description: "Everyone has too many ideas and no fear.",
    cost: 2500,
    unlock: (state) => totalLevels(state) >= 15,
    apply(state) {
      state.multipliers.tap *= 1.5;
    },
  },
  {
    id: "data-halo",
    name: "Data Halo",
    tagline: "Tap x2",
    description: "A glowing dashboard turns every tap into strategic theatre.",
    cost: 8000,
    unlock: (state) => state.companies.brainforge >= 2,
    apply(state) {
      state.multipliers.tap *= 2;
    },
  },
  {
    id: "viral-thread",
    name: "Viral Thread",
    tagline: "Income x1.25 + hype",
    description: "The timeline is fighting. Excellent news.",
    cost: 12000,
    unlock: (state) => state.companies.chattr >= 8,
    apply(state) {
      state.multipliers.income *= 1.25;
      state.hype = Math.min(100, state.hype + 15);
    },
  },
  {
    id: "nano-foundry",
    name: "Nano Foundry",
    tagline: "BrainForge x2.2",
    description: "A chip redesign adds more glowing bits. Investors adore glowing bits.",
    cost: 65000,
    unlock: (state) => state.companies.brainforge >= 5,
    apply(state) {
      state.companyIncomeMult.brainforge *= 2.2;
    },
  },
  {
    id: "launch-window",
    name: "Launch Window",
    tagline: "CometCat x3",
    description: "Launch three rockets in a row before anyone asks for unit economics.",
    cost: 90000,
    unlock: (state) => state.companies.cometcat >= 10,
    apply(state) {
      state.companyIncomeMult.cometcat *= 3;
    },
  },
  {
    id: "tunnel-vision",
    name: "Tunnel Vision",
    tagline: "BoroLoop x2",
    description: "A slide deck explains why every city needs a dramatic ring tunnel.",
    cost: 180000,
    unlock: (state) => state.companies.boroloop >= 3,
    apply(state) {
      state.companyIncomeMult.boroloop *= 2;
    },
  },
  {
    id: "solar-buzz",
    name: "Solar Buzz",
    tagline: "Global income x1.35",
    description: "Space buzzwords plus battery buzzwords. Delicious synergy.",
    cost: 250000,
    unlock: (state) => state.companies.starmesh >= 1,
    apply(state) {
      state.multipliers.income *= 1.35;
    },
  },
  {
    id: "megaloop",
    name: "MegaLoop",
    tagline: "Tap x2.5",
    description: "The tunnels get bigger, the headlines get louder.",
    cost: 400000,
    unlock: (state) => state.companies.boroloop >= 6,
    apply(state) {
      state.multipliers.tap *= 2.5;
    },
  },
  {
    id: "orbital-ads",
    name: "Orbital Ads",
    tagline: "StarMesh x2.5",
    description: "Put premium subscriptions in orbit and call it infrastructure.",
    cost: 900000,
    unlock: (state) => state.companies.starmesh >= 5,
    apply(state) {
      state.companyIncomeMult.starmesh *= 2.5;
    },
  },
];

export const RANDOM_EVENTS = [
  {
    id: "viral-demo",
    name: "Prototype Demo Goes Viral",
    detail: "Clips of the HQ launch loop through every feed on Earth.",
    weight: 20,
    apply: (state, derived) => ({
      type: "instant",
      cash: derived.incomePerSecond * 45 + derived.tapPower * 8,
      hype: 7,
      toast: "Prototype demo went viral. Instant cash surge.",
    }),
  },
  {
    id: "meme-stock",
    name: "Meme Stock Mania",
    detail: "A meme account accidentally starts a buying frenzy.",
    weight: 18,
    apply: (state, derived) => ({
      type: "buff",
      duration: 24,
      mod: { incomeMultiplier: 1.35 },
      hype: 10,
      toast: "Meme stock mania. Income boosted for 24s.",
    }),
  },
  {
    id: "server-wobble",
    name: "Servers Wobble",
    detail: "A dramatic outage arrives five minutes before the keynote.",
    weight: 12,
    apply: (state, derived) => ({
      type: "instant",
      cash: -Math.max(derived.incomePerSecond * 18, 40),
      hype: -6,
      toast: "Servers wobbled. Cash took a hit.",
    }),
  },
  {
    id: "ai-breakthrough",
    name: "Questionable AI Breakthrough",
    detail: "BrainForge publishes a chart with a very upward arrow.",
    weight: 14,
    apply: (state, derived) => ({
      type: "buff",
      duration: 30,
      mod: { tapMultiplier: 1.5, incomeMultiplier: 1.12 },
      hype: 8,
      toast: "BrainForge hype spike. Tap power and income boosted.",
    }),
  },
  {
    id: "launch-delay",
    name: "Launch Delay",
    detail: "The launch is rescheduled for the very investor-friendly phrase 'soon'.",
    weight: 10,
    apply: (state, derived) => ({
      type: "buff",
      duration: 18,
      mod: { incomeMultiplier: 0.84 },
      hype: -4,
      toast: "Launch delay. Income softened for 18s.",
    }),
  },
  {
    id: "luxury-preorders",
    name: "Luxury Preorders Flood In",
    detail: "Voltra sells dreams with leather seats.",
    weight: 16,
    apply: (state, derived) => ({
      type: "instant",
      cash: derived.incomePerSecond * 28 + state.companies.voltra * 42,
      hype: 4,
      toast: "Voltra preorders arrived. Cash received.",
    }),
  },
  {
    id: "satellite-upgrade",
    name: "Satellite Network Upgrade",
    detail: "StarMesh improves coverage and accidentally invents optimism.",
    weight: 8,
    apply: (state, derived) => ({
      type: "buff",
      duration: 26,
      mod: { incomeMultiplier: 1.22 },
      hype: 5,
      toast: "StarMesh coverage boost. Income increased.",
    }),
  },
  {
    id: "board-drama",
    name: "Boardroom Drama",
    detail: "A leaked group chat becomes a lifestyle newsletter.",
    weight: 10,
    apply: (state, derived) => ({
      type: "instant",
      cash: derived.incomePerSecond * 10,
      hype: 12,
      toast: "Boardroom drama. Hype climbs anyway.",
    }),
  },
];

export function totalLevels(state) {
  return Object.values(state.companies).reduce((sum, value) => sum + value, 0);
}

export function createInitialState() {
  return {
    version: 1,
    cash: 0,
    moonshots: 0,
    prestigePointsSpent: 0,
    lastUpdate: Date.now(),
    lastSave: Date.now(),
    companies: Object.fromEntries(COMPANIES.map((company) => [company.key, 0])),
    companyIncomeMult: Object.fromEntries(COMPANIES.map((company) => [company.key, 1])),
    multipliers: {
      income: 1,
      tap: 1,
    },
    unlockedUpgradeIds: [],
    hype: 8,
    eventLog: [],
    activeBuffs: [],
    stats: {
      totalTaps: 0,
      totalEarned: 0,
      passiveEarned: 0,
      tapEarned: 0,
      totalSpent: 0,
      moonshotsPerformed: 0,
      randomEventsSeen: 0,
      playSeconds: 0,
      bestValuation: 0,
      bestIncomePerSecond: 0,
      bestTapPower: 0,
      companyPurchases: 0,
      upgradesPurchased: 0,
    },
  };
}

export function sanitizeState(rawState) {
  const state = createInitialState();

  if (!rawState || typeof rawState !== "object") {
    return state;
  }

  state.cash = numberOr(rawState.cash, state.cash);
  state.moonshots = numberOr(rawState.moonshots, state.moonshots);
  state.prestigePointsSpent = numberOr(rawState.prestigePointsSpent, 0);
  state.lastUpdate = numberOr(rawState.lastUpdate, Date.now());
  state.lastSave = numberOr(rawState.lastSave, Date.now());
  state.hype = clamp(numberOr(rawState.hype, state.hype), 0, 100);

  for (const company of COMPANIES) {
    state.companies[company.key] = Math.max(0, Math.floor(numberOr(rawState.companies?.[company.key], 0)));
    state.companyIncomeMult[company.key] = Math.max(1, numberOr(rawState.companyIncomeMult?.[company.key], 1));
  }

  state.multipliers.income = Math.max(1, numberOr(rawState.multipliers?.income, 1));
  state.multipliers.tap = Math.max(1, numberOr(rawState.multipliers?.tap, 1));

  state.unlockedUpgradeIds = Array.isArray(rawState.unlockedUpgradeIds)
    ? rawState.unlockedUpgradeIds.filter((value) => typeof value === "string")
    : [];

  state.activeBuffs = Array.isArray(rawState.activeBuffs)
    ? rawState.activeBuffs
        .filter((buff) => buff && typeof buff === "object")
        .map((buff) => ({
          id: String(buff.id || cryptoRandomFallback()),
          name: String(buff.name || "Market Mood"),
          detail: String(buff.detail || "Temporary modifier"),
          expiresAt: numberOr(buff.expiresAt, Date.now() + 1000),
          mod: {
            incomeMultiplier: Math.max(0.05, numberOr(buff.mod?.incomeMultiplier, 1)),
            tapMultiplier: Math.max(0.05, numberOr(buff.mod?.tapMultiplier, 1)),
          },
        }))
    : [];

  state.eventLog = Array.isArray(rawState.eventLog)
    ? rawState.eventLog
        .filter((entry) => entry && typeof entry === "object")
        .slice(0, 30)
        .map((entry) => ({
          id: String(entry.id || cryptoRandomFallback()),
          name: String(entry.name || "Event"),
          detail: String(entry.detail || ""),
          deltaText: String(entry.deltaText || ""),
          timestamp: numberOr(entry.timestamp, Date.now()),
        }))
    : [];

  if (rawState.stats && typeof rawState.stats === "object") {
    for (const [key, value] of Object.entries(state.stats)) {
      state.stats[key] = Math.max(0, numberOr(rawState.stats[key], value));
    }
  }

  return state;
}

export function getCompanyCost(company, level) {
  return Math.floor(company.baseCost * Math.pow(company.costScale, level));
}

export function getDerivedState(state) {
  const moonshotBonus = 1 + state.moonshots * 0.18;
  const hypeFactor = 1 + state.hype * 0.01;

  let rawIncome = 0;
  let rawTap = 1;

  for (const company of COMPANIES) {
    const level = state.companies[company.key];
    rawIncome += company.baseIncome * level * state.companyIncomeMult[company.key];
    rawTap += company.tapBonus * level;
  }

  let buffIncomeMult = 1;
  let buffTapMult = 1;

  for (const buff of state.activeBuffs) {
    buffIncomeMult *= buff.mod?.incomeMultiplier ?? 1;
    buffTapMult *= buff.mod?.tapMultiplier ?? 1;
  }

  const incomePerSecond = rawIncome * state.multipliers.income * moonshotBonus * hypeFactor * buffIncomeMult;
  const tapPower = rawTap * state.multipliers.tap * moonshotBonus * (1 + state.hype * 0.004) * buffTapMult;

  const valuation =
    state.cash +
    state.stats.totalSpent * 1.35 +
    incomePerSecond * 145 +
    tapPower * 28 +
    totalLevels(state) * 180 +
    state.hype * 620 +
    state.moonshots * 12000;

  return {
    moonshotBonus,
    hypeFactor,
    rawIncome,
    rawTap,
    incomePerSecond,
    tapPower,
    valuation,
    buffIncomeMult,
    buffTapMult,
  };
}

export function getAvailableUpgradeDefinitions(state) {
  return UPGRADES.filter((upgrade) => !state.unlockedUpgradeIds.includes(upgrade.id) && upgrade.unlock(state));
}

export function getMoonshotPotential(state) {
  const derived = getDerivedState(state);
  const prestigeBase = state.stats.totalEarned + state.stats.totalSpent + derived.valuation * 0.3;
  const totalPotential = Math.floor(Math.sqrt(Math.max(0, prestigeBase) / 250000));
  return Math.max(0, totalPotential - state.moonshots);
}

export function buildEventLogEntry(name, detail, deltaText) {
  return {
    id: cryptoRandomFallback(),
    name,
    detail,
    deltaText,
    timestamp: Date.now(),
  };
}

export function addEventLog(state, entry) {
  state.eventLog.unshift(entry);
  state.eventLog = state.eventLog.slice(0, 30);
}

export function applyMoonshotReset(state) {
  const points = getMoonshotPotential(state);
  if (points <= 0) return 0;

  const newState = createInitialState();
  newState.moonshots = state.moonshots + points;
  newState.stats.moonshotsPerformed = state.stats.moonshotsPerformed + 1;
  newState.stats.bestValuation = Math.max(state.stats.bestValuation, getDerivedState(state).valuation);
  newState.stats.bestIncomePerSecond = Math.max(state.stats.bestIncomePerSecond, getDerivedState(state).incomePerSecond);
  newState.stats.bestTapPower = Math.max(state.stats.bestTapPower, getDerivedState(state).tapPower);

  return { points, newState };
}

export function formatMoney(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs < 1000) return `${sign}$${abs.toFixed(abs >= 100 ? 0 : abs >= 10 ? 1 : 2).replace(/\.0$/, "")}`;

  const units = [
    { limit: 1e15, suffix: "Q" },
    { limit: 1e12, suffix: "T" },
    { limit: 1e9, suffix: "B" },
    { limit: 1e6, suffix: "M" },
    { limit: 1e3, suffix: "K" },
  ];

  for (const unit of units) {
    if (abs >= unit.limit) {
      const shortValue = abs / unit.limit;
      const digits = shortValue >= 100 ? 0 : shortValue >= 10 ? 1 : 2;
      return `${sign}$${shortValue.toFixed(digits).replace(/\.0$/, "")}${unit.suffix}`;
    }
  }

  return `${sign}$${abs.toFixed(0)}`;
}

export function formatCompactNumber(value) {
  const abs = Math.abs(value);
  if (abs < 1000) return `${Math.round(value)}`;
  const units = [
    { limit: 1e12, suffix: "T" },
    { limit: 1e9, suffix: "B" },
    { limit: 1e6, suffix: "M" },
    { limit: 1e3, suffix: "K" },
  ];
  for (const unit of units) {
    if (abs >= unit.limit) {
      const shortValue = value / unit.limit;
      return `${shortValue.toFixed(shortValue >= 100 ? 0 : shortValue >= 10 ? 1 : 2).replace(/\.0$/, "")}${unit.suffix}`;
    }
  }
  return `${Math.round(value)}`;
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remaining}s`;
  return `${remaining}s`;
}

export function chooseRandomEvent() {
  const totalWeight = RANDOM_EVENTS.reduce((sum, event) => sum + event.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of RANDOM_EVENTS) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return RANDOM_EVENTS[RANDOM_EVENTS.length - 1];
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numberOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function cryptoRandomFallback() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
