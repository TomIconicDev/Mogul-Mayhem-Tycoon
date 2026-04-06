# Mogul Mayhem: Pocket Empire

A funny touch-first parody empire clicker for **GitHub Pages** and **iPhone Safari**.

You play as an absurd billionaire founder building a ridiculous tech empire using parody companies like:

- **CometCat** — reusable rockets and moon marketing
- **Voltra** — self-dramatizing electric cars
- **Chattr** — chaotic social platform revenue machine
- **BrainForge** — premium AI hype extraction
- **BoroLoop** — prestige tunnel dreams
- **StarMesh** — sky internet, orbital vibes, subscription energy

The game is built as a **static web app** with **Three.js** graphics, no server required.

## Features

- Touch-first UI designed for iPhone
- Runs on GitHub Pages with no build step
- Three.js 3D skyline and company props
- Tap-to-earn + passive income economy
- 6 business lines with upgrade trees
- Random comedy events
- Prestige system: **Moonshots**
- Achievements
- Autosave to localStorage
- PWA support (installable on iPhone home screen)
- Offline cache through a service worker

## How to use

### 1. Upload to GitHub
Create a new repo and upload everything in this folder.

### 2. Enable GitHub Pages
In GitHub:

- Go to **Settings**
- Open **Pages**
- Under **Build and deployment**, choose **Deploy from a branch**
- Select the **main** branch and the **root** folder

### 3. Open on iPhone
Open the GitHub Pages URL in Safari and use **Add to Home Screen**.

## Files

- `index.html` — app shell
- `styles.css` — responsive mobile UI
- `js/config.js` — content data and balancing
- `js/game.js` — game state, economy, saving, events
- `js/scene.js` — Three.js skyline and simple animated assets
- `js/ui.js` — rendering and interaction layer
- `js/main.js` — app bootstrap
- `manifest.webmanifest` — install metadata
- `sw.js` — offline cache

## Gameplay loop

1. Tap the tower to generate **Cash**
2. Buy businesses to unlock passive income
3. Upgrade each parody company
4. Trigger silly events for bonus boosts or penalties
5. Reach prestige threshold and launch a **Moonshot**
6. Use Moonshots for permanent multipliers

## Notes

- All names are parody/fictional
- Progress saves automatically in the browser
- Three.js is loaded from a CDN so the repo stays lightweight

## Custom ideas you can add later

- Sound effects + music toggle
- More companies and rival moguls
- Cosmetics / skins for the skyline
- Daily challenges
- Leaderboard using a lightweight backend
- Card-based executive system

