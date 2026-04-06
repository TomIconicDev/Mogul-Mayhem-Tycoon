export const GAME_VERSION = '1.0.0';

export const STARTING_STATE = {
  cash: 0,
  totalEarned: 0,
  totalTaps: 0,
  tapPower: 1,
  incomeMultiplier: 1,
  clickMultiplier: 1,
  globalBoost: 1,
  hypeLevel: 1,
  prestige: 0,
  valuation: 0,
  companies: {},
  ownedUpgrades: [],
  consumedEvents: {},
  eventHistory: [],
  eventQueue: [],
  achievements: [],
  stats: {
    manualCash: 0,
    passiveCash: 0,
    moonshotsLaunched: 0,
    biggestTap: 1,
    biggestIncomePerSecond: 0,
    sessionSeconds: 0,
    companiesPurchased: 0,
    upgradesPurchased: 0,
  },
  lastTick: Date.now(),
};

export const COMPANIES = [
  { id: 'cometcat', name: 'CometCat', kicker: 'Orbital nonsense', desc: 'Reusable rockets, reusable promises, reusable launch livestream thumbnails.', baseCost: 35, costGrowth: 1.18, baseIncome: 1, sceneType: 'rocket', accent: 'warning' },
  { id: 'voltra', name: 'Voltra', kicker: 'Electric drama', desc: 'Cars, charging, over-the-air jokes, and premium steering-wheel discourse.', baseCost: 180, costGrowth: 1.21, baseIncome: 5, sceneType: 'car', accent: 'success' },
  { id: 'chattr', name: 'Chattr', kicker: 'Posting economy', desc: 'A social platform powered by subscriptions, chaos, and dramatic midnight polls.', baseCost: 950, costGrowth: 1.23, baseIncome: 26, sceneType: 'billboard', accent: 'accent' },
  { id: 'brainforge', name: 'BrainForge', kicker: 'Hype intelligence', desc: 'Large models, larger claims, and enough server heat to warm a borough.', baseCost: 5400, costGrowth: 1.25, baseIncome: 150, sceneType: 'chip', accent: 'warning' },
  { id: 'boroloop', name: 'BoroLoop', kicker: 'Tunnel optimism', desc: 'Drill stylishly underground and charge extra for mystery route experiences.', baseCost: 32000, costGrowth: 1.27, baseIncome: 880, sceneType: 'tunnel', accent: 'danger' },
  { id: 'starmesh', name: 'StarMesh', kicker: 'Sky internet', desc: 'Orbital dishes, premium signal, and an absolutely normal amount of satellites.', baseCost: 185000, costGrowth: 1.31, baseIncome: 5000, sceneType: 'satellite', accent: 'success' },
];

export const UPGRADES = [ /* ... (full list from your repo — unchanged) ... */ ];

export const EVENT_POOL = [ /* ... (full list from your repo — unchanged) ... */ ];

export const PRESTIGE = { baseThreshold: 1000000, divisor: 250000 };
export const SAVE_KEY = 'mogulMayhemSave';