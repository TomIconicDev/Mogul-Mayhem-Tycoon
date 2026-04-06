// js/config.js
// FULL COMPLETE VERSION for Mogul Mayhem: Pocket Empire
// Contains all game data, balancing, companies, upgrades, events, and constants.
// This pairs perfectly with the upgraded scene.js (sceneType mapping), game.js, and UI.

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
  { 
    id: 'cometcat', 
    name: 'CometCat', 
    kicker: 'Orbital nonsense', 
    desc: 'Reusable rockets, reusable promises, reusable launch livestream thumbnails.', 
    baseCost: 35, 
    costGrowth: 1.18, 
    baseIncome: 1, 
    sceneType: 'rocket', 
    accent: 'warning' 
  },
  { 
    id: 'voltra', 
    name: 'Voltra', 
    kicker: 'Electric drama', 
    desc: 'Cars, charging, over-the-air jokes, and premium steering-wheel discourse.', 
    baseCost: 180, 
    costGrowth: 1.21, 
    baseIncome: 5, 
    sceneType: 'car', 
    accent: 'success' 
  },
  { 
    id: 'chattr', 
    name: 'Chattr', 
    kicker: 'Posting economy', 
    desc: 'A social platform powered by subscriptions, chaos, and dramatic midnight polls.', 
    baseCost: 950, 
    costGrowth: 1.23, 
    baseIncome: 26, 
    sceneType: 'billboard', 
    accent: 'accent' 
  },
  { 
    id: 'brainforge', 
    name: 'BrainForge', 
    kicker: 'Hype intelligence', 
    desc: 'Large models, larger claims, and enough server heat to warm a borough.', 
    baseCost: 5400, 
    costGrowth: 1.25, 
    baseIncome: 150, 
    sceneType: 'chip', 
    accent: 'warning' 
  },
  { 
    id: 'boroloop', 
    name: 'BoroLoop', 
    kicker: 'Tunnel optimism', 
    desc: 'Drill stylishly underground and charge extra for mystery route experiences.', 
    baseCost: 32000, 
    costGrowth: 1.27, 
    baseIncome: 880, 
    sceneType: 'tunnel', 
    accent: 'danger' 
  },
  { 
    id: 'starmesh', 
    name: 'StarMesh', 
    kicker: 'Sky internet', 
    desc: 'Orbital dishes, premium signal, and an absolutely normal amount of satellites.', 
    baseCost: 185000, 
    costGrowth: 1.31, 
    baseIncome: 5000, 
    sceneType: 'satellite', 
    accent: 'success' 
  },
];

export const UPGRADES = [
  {
    id: 'neon-signs',
    name: 'Neon Empire Signs',
    kicker: 'Visual flex',
    desc: 'All company props get glowing neon outlines and increased hype generation.',
    cost: 250,
    apply: (state) => {
      state.globalBoost = (state.globalBoost || 1) * 1.15;
      state.hypeLevel = (state.hypeLevel || 1) + 2;
    }
  },
  {
    id: 'ai-hype',
    name: 'AI Hype Engine',
    kicker: 'Viral boost',
    desc: 'Permanently increases tap power by 25% and adds passive hype.',
    cost: 1200,
    apply: (state) => {
      state.clickMultiplier = (state.clickMultiplier || 1) * 1.25;
      state.hypeLevel = Math.min(20, (state.hypeLevel || 1) + 3);
    }
  },
  {
    id: 'mega-factory',
    name: 'Mega-Factory Blueprint',
    kicker: 'Production surge',
    desc: 'All companies produce 20% more income permanently.',
    cost: 8500,
    apply: (state) => {
      state.incomeMultiplier = (state.incomeMultiplier || 1) * 1.20;
    }
  },
  {
    id: 'satellite-boost',
    name: 'Satellite Network',
    kicker: 'Global reach',
    desc: 'Increases valuation and adds a small passive cash trickle.',
    cost: 45000,
    apply: (state) => {
      state.globalBoost = (state.globalBoost || 1) * 1.12;
    }
  },
  // Add more upgrades here as you expand the game
];

export const EVENT_POOL = [
  {
    id: 'market-crash',
    name: 'Market Crash Meme',
    kicker: 'Temporary dip',
    desc: 'All income reduced by 30% for 45 seconds.',
    apply: (state) => {
      state.eventQueue.push({
        kind: 'incomeBoost',
        multiplier: 0.7,
        remaining: 45,
        label: 'Market dip'
      });
    }
  },
  {
    id: 'viral-tweet',
    name: 'Viral Tweet',
    kicker: 'Moonshot moment',
    desc: 'Instant cash injection and hype boost!',
    apply: (state) => {
      state.cash += 5000;
      state.hypeLevel = Math.min(20, (state.hypeLevel || 1) + 5);
      state.totalEarned += 5000;
    }
  },
  {
    id: 'supply-chain-win',
    name: 'Supply Chain Breakthrough',
    kicker: 'Efficiency win',
    desc: 'All companies get a temporary 50% income boost for 30 seconds.',
    apply: (state) => {
      state.eventQueue.push({
        kind: 'incomeBoost',
        multiplier: 1.5,
        remaining: 30,
        label: 'Supply boost'
      });
    }
  },
  // Add more events here as needed
];

export const PRESTIGE = { 
  baseThreshold: 1000000, 
  divisor: 250000 
};

export const SAVE_KEY = 'mogulMayhemSave';