# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"下克上御前乱斗" (Gekokujo Gozen Rantou) — a 2D Edo-period pixel action brawler game inspired by the Chiikawa anime's in-universe arcade game "下剋上オンライン". Players pick a character and fight through waves of increasingly powerful enemies, earning bonus multipliers for defeating foes of higher rank.

## Running the Game

No build system or dependencies. Open `index.html` directly in a browser, or serve with any static file server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

There are no tests, linters, or build steps.

## Architecture

The entire game is a single vanilla JS IIFE in `src/main.js` (~4600 lines) rendering to an HTML5 Canvas (1179×543). No frameworks, no modules, no bundler.

### Scene State Machine

`state.scene` drives the game flow:
```
loading → start → select → playing → upgrade → playing → ... → result → ranking
```
The boss stage transitions the arena from "street" to "castle" mid-game.

### Core Systems (all in main.js)

- **Game loop**: `loop()` → `update(dt)` → `draw()` via requestAnimationFrame, capped at 33ms delta
- **Global state**: Single `state` object holds scene, images, sprites, buttons, keys, pointer, and the active `game` sub-object
- **Entity model**: Player, enemies, projectiles, drops, effects, floaters — all plain objects in arrays on `state.game`
- **Combat**: 3-step combo (`ATTACK_COMBO`), block with perfect-block window (`BLOCK_PERFECT_WINDOW`), dash with charges, per-character special skills (E/K key)
- **Rank/multiplier system**: 6 enemy ranks (农民→足轻→武士→忍者→大名→将军). Defeating higher-rank enemies yields score multipliers via `calculateMultiplier()`
- **Boss fight**: Triggered after wave 3. Boss has 2 HP phases, charge attacks, minion spawns, and a dedicated arena with destructible shrines
- **Upgrade system**: Between waves, player picks from `upgradePool` (attack, speed, heal, rebel multiplier, range, score, damage reduction)

### Characters

Three playable characters (ROLES array): Chiikawa (balanced), Hachiware (support), Usagi (glass cannon). Each has a unique special skill (`useChiikawaSpecial`, `useHachiwareSpecial`, `useUsagiSpecial`).

### Input

- Movement: WASD / Arrow keys
- Attack: J / left-click
- Block: Space / right-click (with perfect-block timing)
- Special: E or K
- Dash: Shift (2 charges, 15s recharge)
- Aim direction follows mouse pointer

### Asset Pipeline

- `src/embedded-assets.js`: All sprite images base64-encoded into `window.GEKOKUJO_EMBEDDED_ASSETS` (very large file, ~1.5MB). This allows the game to work without a server for asset loading.
- `asset/characters/`: 6-column × 5-row sprite sheets (front/side/back/attack/emote × 6 frames). Parsed by `buildGridSprites()`.
- `asset/enemies/`: Same grid format for enemy sprites.
- Legacy sprites in `asset/asset_avater_sprit.png` use a different layout (`FRAME_X` / `ROW_Y` constants) and are cut out with white-background removal (`makeCutout()`).

### Sprite Sheet Format (characters & enemies)

Each sheet is a 6×5 grid. Rows: front, side, back, attack, emote. Columns: 6 animation frames. Cell size is auto-calculated from image dimensions.

## Key Constants to Know

- Canvas: 1179×543 fixed resolution
- `RANKS`: enemy stat table (hp, speed, damage, score thresholds)
- `ATTACK_COMBO`: timing/damage/range for the 3-hit combo
- `BOSS_TRIGGER_WAVE`: boss appears after wave 3
- `COMBO_WINDOW`: 0.55s to chain the next hit
- `BLOCK_PERFECT_WINDOW`: 0.10s for perfect block
- Rankings stored in localStorage under key `gekokujoRankings`

## Game Design Reference

`gamedesign.md` contains the full game design document (in Chinese) covering planned features, character classes, maps, items, and modes. The current implementation is a subset (demo version) of that design.

## Working with the Code

- The codebase is a single large file — search by function name. Key entry points: `createGame()`, `update()`, `draw()`, `loop()`.
- Adding a new enemy rank: add to `RANKS` array, create a sprite sheet in `asset/enemies/`, add to `ASSET_PATHS.enemies` and the image loading Promise.all chain.
- Adding a new character: add to `ROLES` array, create sprite sheet, add special skill function, wire it in `useSpecialSkill()`.
- Version cache-busting: update the `?v=` query param in `index.html` script tags when changing assets or code.
