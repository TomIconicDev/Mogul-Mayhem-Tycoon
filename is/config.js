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
    accent: 'warning',
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
    accent: 'success',
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
    accent: 'accent',
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
    accent: 'warning',
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
    accent: 'danger',
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
    accent: 'success',
  },
];

export const UPGRADES = [
  {
    id: 'tap-gloves',
    name: 'Founder Finger Gloves',
    kicker: 'Manual boost',
    desc: 'Adds a little premium nonsense to every tap.',
    cost: 120,
    type: 'global',
    apply: (state) => {
      state.tapPower += 2;
      state.clickMultiplier *= 1.1;
    },
  },
  {
    id: 'brand-deal',
    name: 'Questionable Brand Deal',
    kicker: 'Global income',
    desc: 'Nobody knows what you are selling, but it definitely boosts revenue.',
    cost: 450,
    type: 'global',
    apply: (state) => {
      state.incomeMultiplier *= 1.2;
    },
  },
  {
    id: 'cometcat-pad',
    name: 'CometCat Mega Pad',
    kicker: 'CometCat',
    desc: 'Bigger launch pad, bigger explosions, bigger margins.',
    cost: 300,
    type: 'company',
    companyId: 'cometcat',
    apply: (state) => {
      state.companies.cometcat.multiplier *= 2;
    },
  },
  {
    id: 'voltra-autopark',
    name: 'Voltra AutoPark+',
    kicker: 'Voltra',
    desc: 'The parking works about 63% of the time and investors love it.',
    cost: 1350,
    type: 'company',
    companyId: 'voltra',
    apply: (state) => {
      state.companies.voltra.multiplier *= 2.25;
    },
  },
  {
    id: 'chattr-badges',
    name: 'Chattr Verified Badges 2.0',
    kicker: 'Chattr',
    desc: 'Add more badge tiers. Add too many badge tiers. Revenue goes up anyway.',
    cost: 6200,
    type: 'company',
    companyId: 'chattr',
    apply: (state) => {
      state.companies.chattr.multiplier *= 2.35;
    },
  },
  {
    id: 'brainforge-racks',
    name: 'BrainForge Hot Rack Expansion',
    kicker: 'BrainForge',
    desc: 'More servers, louder fans, stronger valuation vibes.',
    cost: 28000,
    type: 'company',
    companyId: 'brainforge',
    apply: (state) => {
      state.companies.brainforge.multiplier *= 2.5;
    },
  },
  {
    id: 'boroloop-gold',
    name: 'BoroLoop Gold Tunnel',
    kicker: 'BoroLoop',
    desc: 'Pure status. Mildly faster. Enormously expensive.',
    cost: 160000,
    type: 'company',
    companyId: 'boroloop',
    apply: (state) => {
      state.companies.boroloop.multiplier *= 2.7;
    },
  },
  {
    id: 'starmesh-dishes',
    name: 'StarMesh Pizza Dish Bundle',
    kicker: 'StarMesh',
    desc: 'Every suburban rooftop becomes a revenue node.',
    cost: 750000,
    type: 'company',
    companyId: 'starmesh',
    apply: (state) => {
      state.companies.starmesh.multiplier *= 3;
    },
  },
  {
    id: 'hype-team',
    name: '24/7 Hype Team',
    kicker: 'Global hype',
    desc: 'Three interns and one ring light multiply the empire aura.',
    cost: 50000,
    type: 'global',
    apply: (state) => {
      state.globalBoost *= 1.35;
      state.hypeLevel += 2;
    },
  },
  {
    id: 'moonshot-advisors',
    name: 'Moonshot Advisors',
    kicker: 'Prestige',
    desc: 'Professional reset enjoyers increase future Moonshot gains.',
    cost: 220000,
    type: 'global',
    apply: (state) => {
      state.incomeMultiplier *= 1.25;
      state.clickMultiplier *= 1.25;
    },
  },
];

export const EVENT_POOL = [
  {
    id: 'meme-rally',
    name: 'Meme Rally',
    kicker: 'Viral luck',
    desc: 'A chaotic meme goes nuclear and your companies trend for all the wrong reasons.',
    impactLabel: '+12 seconds income x2',
    apply: (state) => {
      state.eventQueue.push({
        kind: 'incomeBoost',
        multiplier: 2,
        remaining: 12,
        label: 'Meme Rally',
      });
    },
  },
  {
    id: 'panel-interview',
    name: 'Disastrous Panel Interview',
    kicker: 'Oops',
    desc: 'You say something extremely confident and the market takes a tiny emotional hit.',
    impactLabel: '-8% cash',
    apply: (state) => {
      state.cash *= 0.92;
    },
  },
  {
    id: 'overnight-preorders',
    name: 'Overnight Preorders',
    kicker: 'Sales spike',
    desc: 'Nobody has seen the product, but everyone definitely wants one now.',
    impactLabel: '+15% cash',
    apply: (state) => {
      state.cash *= 1.15;
      state.totalEarned *= 1.01;
    },
  },
  {
    id: 'server-meltdown',
    name: 'Server Meltdown',
    kicker: 'Compute drama',
    desc: 'BrainForge racks hit sauna mode. Revenue suffers. The apology post is weird.',
    impactLabel: '-20 seconds of BrainForge output',
    apply: (state) => {
      const c = state.companies.brainforge;
      if (c) {
        c.tempPenalty = { remaining: 20, multiplier: 0.4 };
      }
    },
  },
  {
    id: 'free-wifi-hype',
    name: 'Free Wi-Fi on a Ferry',
    kicker: 'StarMesh boost',
    desc: 'A ferry demo goes semi-viral and suddenly maritime internet is glamorous.',
    impactLabel: '+StarMesh burst',
    apply: (state) => {
      if (state.companies.starmesh) {
        state.companies.starmesh.multiplier *= 1.15;
      }
    },
  },
  {
    id: 'founder-vision',
    name: 'Founder Vision Thread',
    kicker: 'Manual power',
    desc: 'A 3 a.m. post about the future somehow makes every tap hit harder.',
    impactLabel: '+4 tap power',
    apply: (state) => {
      state.tapPower += 4;
    },
  },
];

export const ACHIEVEMENTS = [
  {
    id: 'first-tap',
    name: 'Tap Baron',
    desc: 'Make your first tap.',
    check: (state) => state.totalTaps >= 1,
  },
  {
    id: 'first-company',
    name: 'Incorporated Chaos',
    desc: 'Buy your first company.',
    check: (state) => state.stats.companiesPurchased >= 1,
  },
  {
    id: 'millionaire',
    name: 'Pocket Millionaire',
    desc: 'Hold $1,000,000 at once.',
    check: (state) => state.cash >= 1_000_000,
  },
  {
    id: 'income-machine',
    name: 'Cash Waterfall',
    desc: 'Reach $10,000 per second.',
    check: (state) => state.stats.biggestIncomePerSecond >= 10_000,
  },
  {
    id: 'moonshot-1',
    name: 'Reset Enjoyer',
    desc: 'Launch your first Moonshot.',
    check: (state) => state.stats.moonshotsLaunched >= 1,
  },
  {
    id: 'all-companies',
    name: 'Conglomerate Gremlin',
    desc: 'Own at least 1 of every company.',
    check: (state) => COMPANIES.every((company) => (state.companies[company.id]?.owned || 0) >= 1),
  },
  {
    id: 'tap-lord',
    name: 'Thumb of Destiny',
    desc: 'Make 1,000 taps.',
    check: (state) => state.totalTaps >= 1000,
  },
];

export const PRESTIGE = {
  baseThreshold: 300_000,
  divisor: 220_000,
};

export const SAVE_KEY = 'mogul-mayhem-pocket-empire-save';
