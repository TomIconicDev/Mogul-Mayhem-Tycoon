// js/main.js
// FULL UPGRADED VERSION – Entry point for Mogul Mayhem: Pocket Empire
// Integrates the new 3D scene, upgraded UI, and core game logic.
// Handles game loop, resize, offline progress, tap integration with particles/floating text.

import { PocketEmpireScene } from './scene.js';
import { 
  createInitialState, 
  loadState, 
  saveState, 
  hardReset, 
  tap, 
  buyCompany, 
  upgradeCompanyLevel, 
  buyUpgrade, 
  runMoonshot, 
  tick, 
  calculateIncomePerSecond,
  applyOfflineProgress 
} from './game.js';

import { 
  initUI, 
  updateUI, 
  showFloatingEarnings 
} from './ui.js';

let state = null;
let scene = null;
let lastTime = Date.now();
let animationFrame = null;

// Main initialization
async function init() {
  // Load or create state
  state = loadState();

  // Apply any offline progress
  const now = Date.now();
  const secondsOffline = Math.floor((now - (state.lastTick || now)) / 1000);
  if (secondsOffline > 30) {
    const offlineEarned = applyOfflineProgress(state, secondsOffline);
    if (offlineEarned > 0) {
      console.log(`Offline earnings: +$${offlineEarned}`);
      // Could show a toast here if you want
    }
  }
  state.lastTick = now;

  // Setup 3D Scene
  const canvas = document.getElementById('sceneCanvas');
  if (canvas) {
    scene = new PocketEmpireScene(canvas);
    scene.start();

    // Handle window resize
    window.addEventListener('resize', () => {
      if (scene) {
        scene.resize(canvas.clientWidth, canvas.clientHeight);
      }
    });
  }

  // Setup UI with handlers
  initUI(state, {
    onTap: handleTap,
    onBuyCompany: handleBuyCompany,
    onUpgradeCompany: handleUpgradeCompany,
    onBuyUpgrade: handleBuyUpgrade,
    onMoonshot: handleMoonshot,
    onSave: handleSave,
    onReset: handleHardReset,
    getState: () => state,
    getIncomePerSecond: () => calculateIncomePerSecond(state),
    canAfford: (amount) => state.cash >= amount
  });

  // Initial UI render
  updateUI(state);

  // Start game loop
  lastTime = Date.now();
  gameLoop();
}

// Tap handler (called from UI and canvas)
function handleTap() {
  const amount = tap(state);
  
  // Visual feedback in 3D scene
  if (scene) {
    scene.createEarningsParticles(new THREE.Vector3(0, 4.5, 0));
  }

  // Floating text (screen position from tap button or center)
  const tapBtn = document.getElementById('tapButton');
  let screenX = window.innerWidth / 2;
  let screenY = window.innerHeight / 2;
  
  if (tapBtn) {
    const rect = tapBtn.getBoundingClientRect();
    screenX = rect.left + rect.width / 2;
    screenY = rect.top + rect.height / 2;
  }

  showFloatingEarnings(amount, screenX, screenY);
  updateUI(state);
  return amount;
}

// Buy company handler
function handleBuyCompany(companyId) {
  const success = buyCompany(state, companyId);
  if (success) {
    updateUI(state);
    // Optional particle burst on new prop
    if (scene) scene.update(state, buildCompanyViews());
  }
}

// Upgrade company handler
function handleUpgradeCompany(companyId) {
  const success = upgradeCompanyLevel(state, companyId);
  if (success) {
    updateUI(state);
    if (scene) scene.update(state, buildCompanyViews());
  }
}

// Buy upgrade handler
function handleBuyUpgrade(upgradeId) {
  const success = buyUpgrade(state, upgradeId);
  if (success) {
    updateUI(state);
  }
}

// Moonshot handler
function handleMoonshot() {
  const result = runMoonshot(state);
  if (result.ok) {
    state = result.nextState;
    updateUI(state);
    showToast(`Moonshot successful! +${result.gained} prestige`, 'success');
    // Could reset scene or add special effect here
  } else {
    showToast('Not enough valuation for moonshot yet!', 'warning');
  }
}

// Save handler
function handleSave() {
  saveState(state);
}

// Hard reset handler
function handleHardReset() {
  state = hardReset();
  updateUI(state);
  if (scene) {
    // Optional: reset scene visuals if needed
  }
}

// Helper to build company views for scene
function buildCompanyViews() {
  return Object.keys(state.companies).map(id => {
    const cs = state.companies[id];
    return {
      id,
      owned: cs.owned || 0,
      level: cs.level || 0
    };
  });
}

// Main game loop (60fps target)
function gameLoop() {
  const now = Date.now();
  const deltaMs = now - lastTime;
  const deltaSeconds = deltaMs / 1000;

  if (deltaMs >= 16) {  // ~60fps
    // Run game tick
    tick(state, deltaSeconds);

    // Update 3D scene visuals
    if (scene) {
      scene.update(state, buildCompanyViews());
    }

    // Update UI
    updateUI(state);

    lastTime = now;
  }

  animationFrame = requestAnimationFrame(gameLoop);
}

// Toast helper (uses ui.js)
function showToast(message, type = 'info') {
  // showToast is exported from ui.js and attached globally in ui.js
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    console.log(`[Toast] ${message}`);
  }
}

// Expose some globals for debugging / console access (optional)
window.getGameState = () => state;
window.saveGame = () => saveState(state);
window.resetGame = () => {
  if (confirm('Reset everything?')) handleHardReset();
};

// Start the app
window.addEventListener('load', init);

// Cleanup on page hide (save automatically)
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveState(state);
  }
});