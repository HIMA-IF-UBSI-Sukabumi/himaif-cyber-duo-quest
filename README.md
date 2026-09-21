<p align="center">
  <img src="assets/logo/image.png" alt="HIMAIF Logo" width="120" />
</p>

<h1 align="center">HIMAIF Duo: Cyber Quest</h1>
<p align="center">
  <strong>2-Player Co-op Platformer • 1 Device Offline</strong><br />
  A cyberpunk puzzle platformer built by HIMAIF for the Computer Science student organization.
</p>

<p align="center">
  🌐 <a href="README_ID.md"><strong>Bahasa Indonesia (README_ID.md)</strong></a>
</p>

---

## 📖 About the Game

**HIMAIF Duo: Cyber Quest** is a 2-player cooperative platformer played offline on a single keyboard (in the spirit of *Fireboy & Watergirl*). Two players pick their avatars from **26 unique HIMAIF characters**, then work together to solve circuit puzzles, dodge patrolling sentinel drones, and reach the exit portal together.

It is built entirely with vanilla HTML, CSS, and JavaScript (ES Modules) — no framework, no build step, and no external game engine required.

---

## ✨ Features

- **2-Player Local Co-op** — Both players share one keyboard on one device.
- **26 Unique Characters** — Each with name, role, and backstory; pick via grid, keyboard navigation, or the 🎲 random button.
- **3 Hand-Crafted Stages** — Tutorial to stealth to laser-puzzle infiltration.
- **Unique Player Abilities** — P1's Cyber EMP Pulse vs P2's Kinetic Shield.
- **Cyberpunk Theme** — Neon HUD, cyber grid backgrounds, and HIMAIF logo tokens.
- **AI Sentinel Drones** — Patrol AI with vision cones and line-of-sight raycasting.
- **Procedural Audio** — Background music and sound effects generated live with the Web Audio API (no audio files).
- **Star Rating** — 1–3 stars per stage based on collected tokens and completion time.
- **Zero Build Step** — Runs directly in the browser.

---

## 🚀 How to Run

### Option A — Open directly
Open `index.html` in any modern browser (Chrome, Edge, Firefox). No server required.

### Option B — Local server (recommended)
```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000

# Or with Node
npx serve .
```

> 💡 Keyboard controls for both players are read from the **same device**, so both players must use the same computer/keyboard.

---

## 🎮 Controls

| Action | Player 1 (P1) | Player 2 (P2) |
|---|---|---|
| Move | `A` / `D` | `◄` / `►` |
| Jump | `W` | `▲` |
| Interact (lever) | `S` | `▼` |
| Ability | `E` (or `Q`) | `Shift` (or `Enter`) |

### In-game hotkeys

| Key | Action |
|---|---|
| `R` | Restart current stage |
| `M` | Toggle sound |
| `P` / `Esc` | Pause / resume |
| `Space` / `Enter` | Start game (on character select) |

---

## ⚡ Player Abilities

| Player | Ability | Effect |
|---|---|---|
| P1 — Cyber EMP Pulse | `E` | Disables lasers & drones within a 320px radius for **4 seconds** (cooldown ~6s) |
| P2 — Kinetic Shield | `Shift` | Grants immunity to lasers & drone detection for **3.5 seconds** (cooldown ~7s) |

---

## 🧩 Gameplay Elements

| Element | How it works |
|---|---|
| **Pressure Plate** | Hold it down (step on it or weigh it with a box) to open its linked door. |
| **Lever** | Stand near it and press the interact key to toggle it on/off. |
| **Hydraulic Door** | Sliding gate opened by a linked plate or lever. |
| **Laser Barrier** | Instantly lethal — disable with a lever, P1's EMP, or block it with a pushable box. |
| **Pushable Box** | Pushable blocks; P2 (Heavy) pushes harder. Great for stepping on plates and blocking lasers. |
| **Moving Lift** | Vertical transport between floors. |
| **Logo Token** | The collectible HIMAIF coin — 3 per stage. |
| **Exit Portal** | Both players must enter it together to clear the stage. |
| **Sentinel Drone** | Patrols with a vision cone; detects and chases players, but is blind to shielded players and stunnable by EMP. |

---

## 🗺️ Stages

| # | Name | Theme |
|---|---|---|
| 1 | **SYSTEM BOOT** | Tutorial — plates, levers, doors, and the first pushable box. |
| 2 | **SENTINEL INFILTRATION** | Stealth — drone patrols, a drone cage trap, and a lift to the exit. |
| 3 | **CORE BREACH** | Lasers, dual drone patrol, and the final Core Room power-up. |

---

## 📁 Project Structure

```
├── index.html           # Entry point & all UI screens (select, HUD, modals)
├── css/
│   └── style.css        # Cyberpunk theme styling
├── js/
│   ├── constants.js     # Characters, player configs, physics, asset paths
│   ├── game.js          # Core game loop, state management, UI hooks
│   ├── level.js         # 3 stage layouts & level update/draw
│   ├── player.js        # Player entity: movement, collisions, abilities, rendering
│   ├── interactive.js   # Plates, levers, doors, lasers, boxes, lifts, tokens, portal
│   ├── enemy.js         # Sentinel Drone AI (patrol, vision cone, alert states)
│   └── audio.js         # Web Audio API procedural BGM & SFX engine
└── assets/
    ├── logo/image.png   # HIMAIF logo (favicon, watermark, token sprite)
    └── charakter/       # 26 character sprites (1.png – 26.png)
```

---

## 🛠️ Technology

- **HTML5 Canvas** for all in-game rendering
- **Vanilla JavaScript (ES Modules)** — no framework, no build tools
- **Web Audio API** for procedural music & effects
- **Google Fonts** — *Outfit* & *Space Grotesk* (the only external dependency)

---

## 🧑‍💻 Extending the Game

- **Add/edit characters** — edit the `CHARACTERS` array in `js/constants.js:7` and drop the sprite as `assets/charakter/<id>.png`.
- **Tweak physics** — adjust the `PHYSICS` object in `js/constants.js:79`.
- **Add a new stage** — add a `initStageN()` method in `js/level.js` and register it in `loadStage` (`js/level.js:40`).

---

## 🏆 Credits

Built with ❤️ by the **HIMAIF Developer Team**.

---

*HIMAIF Duo: Cyber Quest — Himpunan Mahasiswa Informatika.*