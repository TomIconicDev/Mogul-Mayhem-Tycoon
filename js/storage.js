import { STORAGE_KEY, sanitizeState, getDerivedState, clamp } from "./game-data.js";

export function saveState(state) {
  const payload = {
    ...state,
    lastSave: Date.now(),
    lastUpdate: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, timestamp: payload.lastSave };
  } catch (error) {
    console.error("Failed to save state", error);
    return { ok: false, error };
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: sanitizeState(null), offlineCash: 0, offlineSeconds: 0 };

    const parsed = JSON.parse(raw);
    const state = sanitizeState(parsed);
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - state.lastUpdate) / 1000);
    const cappedSeconds = Math.min(elapsedSeconds, 8 * 3600);
    const derived = getDerivedState(state);
    const offlineCash = derived.incomePerSecond * cappedSeconds * 0.85;

    if (offlineCash > 0) {
      state.cash += offlineCash;
      state.stats.totalEarned += offlineCash;
      state.stats.passiveEarned += offlineCash;
      state.hype = clamp(state.hype - cappedSeconds * 0.002, 0, 100);
    }

    state.lastUpdate = now;
    return { state, offlineCash, offlineSeconds: cappedSeconds };
  } catch (error) {
    console.error("Failed to load state", error);
    return { state: sanitizeState(null), offlineCash: 0, offlineSeconds: 0 };
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear state", error);
    return false;
  }
}
