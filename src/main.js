(() => {
  "use strict";

  const WIDTH = 1179;
  const HEIGHT = 543;
  const RANKING_KEY = "gekokujoRankings";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const EMBEDDED_ASSETS = window.GEKOKUJO_EMBEDDED_ASSETS || {};
  const ASSET_PATHS = {
    avatar: EMBEDDED_ASSETS.avatar || "asset/asset_avater_sprit.png",
    background: EMBEDDED_ASSETS.background || "asset/asset_backgroud.png",
    opening: EMBEDDED_ASSETS.opening || "asset/game_opening.png",
    battle: EMBEDDED_ASSETS.battle || "asset/edo_battle_background.png",
    battleLevel1: EMBEDDED_ASSETS.battleLevel1 || "asset/edo_battle_background_level1.png",
    castleInterior: EMBEDDED_ASSETS.castleInterior || "asset/edo_castle_interior_background.png",
    characters: {
      chiikawa: EMBEDDED_ASSETS.chiikawa || "asset/characters/chiikawa-sheet.png",
      hachiware: EMBEDDED_ASSETS.hachiware || "asset/characters/hachiware-sheet.png",
      usagi: EMBEDDED_ASSETS.usagi || "asset/characters/usagi-sheet.png",
    },
    enemies: {
      farmer: EMBEDDED_ASSETS.enemyFarmer || "asset/enemies/farmer-sheet.png",
      ashigaru: EMBEDDED_ASSETS.enemyAshigaru || "asset/enemies/ashigaru-sheet.png",
      samurai: EMBEDDED_ASSETS.enemySamurai || "asset/enemies/samurai-sheet.png",
      ninja: EMBEDDED_ASSETS.enemyNinja || "asset/enemies/ninja-sheet.png",
      daimyo: EMBEDDED_ASSETS.enemyDaimyo || "asset/enemies/daimyo-sheet.png",
      shogun: EMBEDDED_ASSETS.enemyShogun || "asset/enemies/shogun-sheet.png",
      momonga: EMBEDDED_ASSETS.enemyMomonga || "asset/enemies/momonga-sheet.png",
    },
    attackDefend: {
      chiikawa: EMBEDDED_ASSETS.chiikawaAttackDefend || "asset/characters/chiikawa-attack-defend.png?v=20260526",
      hachiware: EMBEDDED_ASSETS.hachiwareAttackDefend || "asset/characters/hachiware-attack-defend.png?v=20260526",
      usagi: EMBEDDED_ASSETS.usagiAttackDefend || "asset/characters/usagi-attack-defend.png?v=20260526",
    },
  };

  const COLORS = {
    ink: "#443638",
    paper: "#fbf4ea",
    muted: "#7b6b67",
    red: "#b94d45",
    blue: "#7fb6d3",
    gold: "#e6bd4e",
    green: "#85b37b",
    shadow: "rgba(67,54,56,0.2)",
  };

  const PLAYER_BOUNDS = { minX: 42, maxX: WIDTH - 42, minY: 178, maxY: HEIGHT - 36 };
  const ENEMY_BOUNDS = { minX: 36, maxX: WIDTH - 36, minY: 180, maxY: HEIGHT - 30 };
  const DASH_MAX_CHARGES = 2;
  const DASH_RECHARGE_TIME = 15;
  const DASH_ANIMATION_TIME = 0.22;
  const DASH_INPUT_LOCK = 0.12;

  const ATTACK_COMBO = [
    { name: "突刺", duration: 0.32, cooldownMult: 0.55, rangeMult: 0.85, damageMult: 0.85, cone: 0.25 },
    { name: "横扫", duration: 0.42, cooldownMult: 0.85, rangeMult: 1.0,  damageMult: 1.0,  cone: 0.08 },
    { name: "终结斩", duration: 0.62, cooldownMult: 1.6, rangeMult: 1.2, damageMult: 1.55, cone: -0.2 },
  ];
  const COMBO_WINDOW = 0.55;
  const BLOCK_PERFECT_WINDOW = 0.15;
  const BLOCK_DURATION = 0.35;
  const BLOCK_COOLDOWN = 0.55;
  const BOSS_TRIGGER_WAVE = 3;
  const STAGE1_BOSS_WAVE = 2;
  const STAGE1_MAX_RANK = 3;
  const BOSS_BOUNDS = { minX: 92, maxX: WIDTH - 92, minY: 220, maxY: HEIGHT - 48 };

  const RANKS = [
    { rank: 1, name: "农民", jp: "農", spriteKey: "farmer", score: 80, hp: 32, speed: 66, damage: 6, color: "#8aa879" },
    { rank: 2, name: "足轻", jp: "足", spriteKey: "ashigaru", score: 145, hp: 46, speed: 72, damage: 8, color: "#d9b34f" },
    { rank: 3, name: "武士", jp: "武", spriteKey: "samurai", score: 240, hp: 70, speed: 77, damage: 11, color: "#8eb5ce" },
    { rank: 4, name: "忍者", jp: "忍", spriteKey: "ninja", score: 390, hp: 82, speed: 96, damage: 12, color: "#6d789d", ranged: true },
    { rank: 5, name: "大名", jp: "大", spriteKey: "daimyo", score: 460, hp: 125, speed: 62, damage: 17, color: "#bc5f55" },
    { rank: 6, name: "将军", jp: "将", spriteKey: "shogun", score: 820, hp: 185, speed: 52, damage: 24, color: "#e3bb45" },
  ];

  const ROLES = [
    {
      id: "chiikawa",
      name: "吉伊",
      jp: "ちいかわ",
      title: "软萌勇气",
      row: 0,
      spriteKey: "chiikawa",
      rank: 1,
      maxHp: 118,
      speed: 144,
      attack: 20,
      range: 60,
      cooldown: 0.36,
      color: "#8fb3a5",
      trait: "可爱但会认真挥棍。",
    },
    {
      id: "hachiware",
      name: "小八",
      jp: "ハチワレ",
      title: "友善支援",
      row: 1,
      spriteKey: "hachiware",
      rank: 2,
      maxHp: 108,
      speed: 136,
      attack: 18,
      range: 66,
      cooldown: 0.34,
      color: "#e7c64f",
      moveScale: 0.44,
      trait: "开朗可靠，步伐最稳。",
    },
    {
      id: "usagi",
      name: "乌萨奇",
      jp: "うさぎ",
      title: "古灵精怪",
      row: 2,
      spriteKey: "usagi",
      rank: 3,
      maxHp: 98,
      speed: 153,
      attack: 26,
      range: 62,
      cooldown: 0.45,
      color: "#d3b69f",
      trait: "跳脱怪招，斧头很忙。",
    },
  ];

  const FAKE_RANKINGS = [
    { name: "小八-蓝", score: 6280, title: "天下级", bestDefeatRank: "将军", createdAt: "2026-04-20T08:00:00.000Z", fake: true },
    { name: "吉伊-粉", score: 5140, title: "传说下克上", bestDefeatRank: "将军", createdAt: "2026-04-21T08:00:00.000Z", fake: true },
    { name: "瓦版太郎", score: 4580, title: "大名克星", bestDefeatRank: "大名", createdAt: "2026-04-22T08:00:00.000Z", fake: true },
    { name: "团子忍者", score: 3900, title: "反骨达人", bestDefeatRank: "大名", createdAt: "2026-04-23T08:00:00.000Z", fake: true },
    { name: "桥边浪人", score: 3160, title: "御前新星", bestDefeatRank: "浪人", createdAt: "2026-04-24T08:00:00.000Z", fake: true },
  ];

  const FRAME_X = {
    front: [34, 92, 205],
    side: [262, 92, 215],
    back: [704, 92, 214],
    weapon: [922, 92, 245],
    attack: [1110, 92, 265],
    hurt: [1348, 92, 215],
    win: [1560, 92, 205],
  };
  const ROW_Y = [76, 318, 552];
  const FRAME_H = 238;

  const SHEET_RECTS = {
    tree: [42, 415, 220, 230],
    bush: [300, 472, 174, 90],
    house: [444, 408, 318, 250],
    sign: [744, 465, 164, 136],
    fence: [920, 506, 260, 96],
    stump: [1210, 505, 116, 112],
    heart: [244, 932, 72, 74],
    coin: [350, 930, 72, 74],
    dust: [740, 870, 90, 78],
    slash: [1142, 878, 192, 120],
  };

  const state = {
    scene: "loading",
    images: {},
    sprites: {},
    characterSprites: {},
    attackDefendSprites: {},
    enemySprites: {},
    sheet: {},
    buttons: [],
    keys: new Set(),
    pointer: { x: WIDTH / 2, y: HEIGHT / 2, down: false, active: false },
    selectedRole: 0,
    game: null,
    result: null,
    loadError: "",
    shake: { time: 0, duration: 0, magnitude: 0 },
  };

  const upgradePool = [
    {
      id: "attack",
      name: "破竹一击",
      desc: "攻击力提升",
      apply(game) {
        game.attackMult += 0.18;
      },
    },
    {
      id: "speed",
      name: "草鞋疾走",
      desc: "移动速度提升",
      apply(game) {
        game.speedBonus += 18;
      },
    },
    {
      id: "heal",
      name: "三色团子",
      desc: "体力上限和体力回复",
      apply(game) {
        game.player.maxHp += 12;
        game.player.hp = Math.min(game.player.maxHp, game.player.hp + 44);
      },
    },
    {
      id: "rebel",
      name: "反骨御守",
      desc: "下克上倍率提升",
      apply(game) {
        game.rebelLevel += 1;
      },
    },
    {
      id: "range",
      name: "长柄竹竿",
      desc: "攻击范围扩大",
      apply(game) {
        game.rangeBonus += 12;
      },
    },
    {
      id: "coin",
      name: "小判嗅觉",
      desc: "得分收益提升",
      apply(game) {
        game.scoreMult += 0.13;
      },
    },
    {
      id: "guard",
      name: "身份潜伏",
      desc: "受到伤害降低",
      apply(game) {
        game.damageTakenMult = Math.max(0.62, game.damageTakenMult - 0.08);
      },
    },
  ];

  let lastTime = performance.now();

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`无法加载 ${src}`));
      image.src = src;
    });
  }

  function makeCutout(image, sx, sy, sw, sh, threshold = 246) {
    const rawFrame = {
      image,
      sx,
      sy,
      sw,
      sh,
      width: sw,
      height: sh,
      raw: true,
    };
    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const outCtx = out.getContext("2d");
    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    let pixels;
    try {
      pixels = outCtx.getImageData(0, 0, sw, sh);
    } catch {
      return rawFrame;
    }
    const data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > threshold && data[i + 1] > threshold && data[i + 2] > threshold) {
        data[i + 3] = 0;
      }
    }
    outCtx.putImageData(pixels, 0, 0);
    return {
      image: out,
      sx: 0,
      sy: 0,
      sw,
      sh,
      width: sw,
      height: sh,
      raw: false,
    };
  }

  function buildAssets() {
    for (let row = 0; row < 3; row += 1) {
      state.sprites[row] = {};
      Object.entries(FRAME_X).forEach(([name, rect]) => {
        state.sprites[row][name] = makeCutout(
          state.images.avatar,
          rect[0],
          ROW_Y[row],
          rect[2],
          FRAME_H,
          248
        );
      });
    }
    Object.entries(SHEET_RECTS).forEach(([name, rect]) => {
      state.sheet[name] = makeCutout(state.images.background, rect[0], rect[1], rect[2], rect[3], 249);
    });
    buildCharacterSprites();
    buildEnemySprites();
    buildAttackDefendSprites();
  }

  function buildGridSprites(images, target) {
    const rowNames = ["front", "side", "back", "attack", "emote"];
    Object.entries(images || {}).forEach(([key, image]) => {
      if (!image) return;
      const cellW = Math.floor(image.width / 6);
      const cellH = Math.floor(image.height / 5);
      const bg = detectBackground(image);
      const cutFn = bg === "black"
        ? (img, sx, sy, sw, sh) => makeCutoutDark(img, sx, sy, sw, sh, 10)
        : bg === "purple"
        ? (img, sx, sy, sw, sh) => makeCutoutPurple(img, sx, sy, sw, sh)
        : null;
      target[key] = {};
      rowNames.forEach((rowName, row) => {
        target[key][rowName] = Array.from({ length: 6 }, (_, col) => {
          const sx = col * cellW;
          const sy = row * cellH;
          if (cutFn) return cutFn(image, sx, sy, cellW, cellH);
          return {
            image,
            sx,
            sy,
            sw: cellW,
            sh: cellH,
            width: cellW,
            height: cellH,
            raw: false,
          };
        });
      });
    });
  }

  function buildCharacterSprites() {
    buildGridSprites(state.images.characters, state.characterSprites);
  }

  function buildEnemySprites() {
    const rowNames = ["front", "side", "back", "attack", "emote"];
    Object.entries(state.images.enemies || {}).forEach(([key, image]) => {
      if (!image) return;
      const cellW = Math.floor(image.width / 6);
      const cellH = Math.floor(image.height / 5);
      const bg = detectBackground(image);
      const cutFn = bg === "black"
        ? (img, sx, sy, sw, sh) => makeCutoutDark(img, sx, sy, sw, sh, 10)
        : bg === "purple"
        ? (img, sx, sy, sw, sh) => makeCutoutPurple(img, sx, sy, sw, sh)
        : null;
      state.enemySprites[key] = {};
      rowNames.forEach((rowName, row) => {
        state.enemySprites[key][rowName] = Array.from({ length: 6 }, (_, col) => {
          const off = ENEMY_FRAME_OFFSETS[`${key}.${rowName}.${col}`];
          const sx = col * cellW + (off ? off.dx : 0);
          const sy = row * cellH + (off ? off.dy : 0);
          const sw = cellW + (off ? off.dw : 0);
          const sh = cellH + (off ? off.dh : 0);
          if (cutFn) return cutFn(image, sx, sy, sw, sh);
          return {
            image, sx, sy, sw, sh,
            width: sw, height: sh, raw: false,
          };
        });
      });
    });
  }

  function detectBackground(image) {
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const cx = c.getContext("2d");
    cx.drawImage(image, 0, 0);
    try {
      const corners = [
        cx.getImageData(0, 0, 1, 1).data,
        cx.getImageData(image.width - 1, 0, 1, 1).data,
        cx.getImageData(0, image.height - 1, 1, 1).data,
        cx.getImageData(image.width - 1, image.height - 1, 1, 1).data,
      ];
      let dark = 0;
      let purple = 0;
      for (const p of corners) {
        if (p[0] < 30 && p[1] < 30 && p[2] < 30) dark++;
        if (p[2] > 150 && p[0] > 80 && p[0] < 180 && p[1] < 150 && p[2] - p[1] > 60) purple++;
      }
      if (dark >= 3) return "black";
      if (purple >= 3) return "purple";
      return "white";
    } catch {
      return "white";
    }
  }

  function makeCutoutDark(image, sx, sy, sw, sh, threshold = 30) {
    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const outCtx = out.getContext("2d");
    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    let pixels;
    try {
      pixels = outCtx.getImageData(0, 0, sw, sh);
    } catch {
      return { image, sx, sy, sw, sh, width: sw, height: sh, raw: true };
    }
    const data = pixels.data;
    const visited = new Uint8Array(sw * sh);
    const stack = [];
    for (let x = 0; x < sw; x++) {
      stack.push(x, 0);
      stack.push(x, sh - 1);
    }
    for (let y = 1; y < sh - 1; y++) {
      stack.push(0, y);
      stack.push(sw - 1, y);
    }
    while (stack.length > 0) {
      const cy = stack.pop();
      const cx = stack.pop();
      if (cx < 0 || cx >= sw || cy < 0 || cy >= sh) continue;
      const idx = cy * sw + cx;
      if (visited[idx]) continue;
      const pi = idx * 4;
      if (data[pi] >= threshold && data[pi + 1] >= threshold && data[pi + 2] >= threshold) continue;
      visited[idx] = 1;
      data[pi + 3] = 0;
      stack.push(cx - 1, cy);
      stack.push(cx + 1, cy);
      stack.push(cx, cy - 1);
      stack.push(cx, cy + 1);
    }
    outCtx.putImageData(pixels, 0, 0);
    return { image: out, sx: 0, sy: 0, sw, sh, width: sw, height: sh, raw: false };
  }

  function makeCutoutPurple(image, sx, sy, sw, sh) {
    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const outCtx = out.getContext("2d");
    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    let pixels;
    try {
      pixels = outCtx.getImageData(0, 0, sw, sh);
    } catch {
      return { image, sx, sy, sw, sh, width: sw, height: sh, raw: true };
    }
    const data = pixels.data;
    const visited = new Uint8Array(sw * sh);
    const stack = [];
    for (let x = 0; x < sw; x++) {
      stack.push(x, 0);
      stack.push(x, sh - 1);
    }
    for (let y = 1; y < sh - 1; y++) {
      stack.push(0, y);
      stack.push(sw - 1, y);
    }
    while (stack.length > 0) {
      const cy = stack.pop();
      const cx = stack.pop();
      if (cx < 0 || cx >= sw || cy < 0 || cy >= sh) continue;
      const idx = cy * sw + cx;
      if (visited[idx]) continue;
      const pi = idx * 4;
      const r = data[pi], g = data[pi + 1], b = data[pi + 2];
      if (!(b > 150 && r > 80 && r < 200 && g < 160 && b - g > 50)) continue;
      visited[idx] = 1;
      data[pi + 3] = 0;
      stack.push(cx - 1, cy);
      stack.push(cx + 1, cy);
      stack.push(cx, cy - 1);
      stack.push(cx, cy + 1);
    }
    outCtx.putImageData(pixels, 0, 0);
    return { image: out, sx: 0, sy: 0, sw, sh, width: sw, height: sh, raw: false };
  }

  const ENEMY_FRAME_OFFSETS = {
    "ashigaru.attack.0": { dx: 32, dy: -9, dw: 0, dh: 0 },
    "ashigaru.attack.1": { dx: 36, dy: -15, dw: 0, dh: 0 },
    "ashigaru.attack.2": { dx: 24, dy: -17, dw: 0, dh: 0 },
    "ashigaru.attack.3": { dx: 53, dy: -18, dw: 30, dh: -1 },
    "ashigaru.attack.4": { dx: -27, dy: -27, dw: -40, dh: 4 },
    "ashigaru.attack.5": { dx: -42, dy: -10, dw: 0, dh: 0 },
    "momonga.attack.0": { dx: 0, dy: -20, dw: 0, dh: 0 },
    "momonga.attack.1": { dx: -11, dy: -22, dw: -3, dh: 0 },
    "momonga.attack.2": { dx: 26, dy: -31, dw: 0, dh: 0 },
    "momonga.attack.3": { dx: 28, dy: -20, dw: 0, dh: 0 },
    "momonga.attack.4": { dx: 34, dy: -18, dw: 0, dh: 0 },
    "momonga.attack.5": { dx: 13, dy: -29, dw: -12, dh: -8 },
    "farmer.attack.0": { dx: 24, dy: 0, dw: 0, dh: 0 },
    "farmer.attack.1": { dx: 32, dy: 0, dw: 0, dh: 0 },
    "farmer.attack.2": { dx: 38, dy: 0, dw: 0, dh: 0 },
    "farmer.attack.3": { dx: 34, dy: 0, dw: 0, dh: 0 },
    "farmer.attack.4": { dx: 27, dy: 0, dw: 0, dh: 0 },
    "farmer.attack.5": { dx: 27, dy: 0, dw: 0, dh: 0 },
    "shogun.attack.1": { dx: 17, dy: 0, dw: 0, dh: 0 },
    "shogun.attack.2": { dx: 21, dy: 0, dw: 0, dh: 0 },
    "shogun.attack.3": { dx: 11, dy: 0, dw: 0, dh: 0 },
  };

  const FRAME_OFFSETS = {
    "chiikawa.attack1.0": { dx: 1, dy: 4, dw: 6, dh: 0 },
    "chiikawa.attack1.1": { dx: 1, dy: 4, dw: 6, dh: 0 },
    "chiikawa.attack1.2": { dx: 23, dy: 4, dw: 6, dh: 0 },
    "chiikawa.attack1.3": { dx: 23, dy: 4, dw: 6, dh: 0 },
    "chiikawa.attack1.4": { dx: 23, dy: 4, dw: -15, dh: 0 },
    "chiikawa.attack1.5": { dx: 23, dy: 4, dw: -40, dh: 0 },
    "chiikawa.attack2.5": { dx: 23, dy: 4, dw: -40, dh: 0 },
    "chiikawa.attack3.0": { dx: 0, dy: -74, dw: 0, dh: 0 },
    "chiikawa.attack3.1": { dx: 10, dy: -6, dw: 0, dh: 0 },
    "chiikawa.attack3.2": { dx: 19, dy: -51, dw: 0, dh: 0 },
    "chiikawa.attack3.3": { dx: 46, dy: -65, dw: -7, dh: 0 },
    "chiikawa.attack3.4": { dx: 37, dy: -80, dw: -2, dh: 0 },
    "chiikawa.attack3.5": { dx: 26, dy: -80, dw: -40, dh: 0 },
    "hachiware.block.5": { dx: 31, dy: -16, dw: -40, dh: 0 },
    "hachiware.attack1.4": { dx: 14, dy: 15, dw: 0, dh: 0 },
    "hachiware.attack1.5": { dx: 31, dy: -16, dw: -40, dh: 0 },
    "hachiware.attack2.0": { dx: 0, dy: -5, dw: 0, dh: 0 },
    "hachiware.attack2.1": { dx: 0, dy: -8, dw: -7, dh: -13 },
    "hachiware.attack2.2": { dx: -45, dy: 0, dw: 0, dh: 0 },
    "hachiware.attack2.3": { dx: -45, dy: -3, dw: 0, dh: 0 },
    "hachiware.attack2.4": { dx: -37, dy: -7, dw: 22, dh: 0 },
    "hachiware.attack3.0": { dx: -4, dy: -36, dw: 0, dh: 0 },
    "hachiware.attack3.1": { dx: 0, dy: -32, dw: 0, dh: 0 },
    "hachiware.attack3.3": { dx: 0, dy: -28, dw: 0, dh: 0 },
    "hachiware.attack3.4": { dx: 0, dy: -30, dw: 0, dh: 0 },
    "hachiware.attack3.5": { dx: 0, dy: -27, dw: 0, dh: 0 },
    "usagi.block.5": { dx: 31, dy: -16, dw: -40, dh: 0 },
    "usagi.attack1.0": { dx: 16, dy: -17, dw: 0, dh: 0 },
    "usagi.attack1.1": { dx: 22, dy: -21, dw: 0, dh: 0 },
    "usagi.attack1.2": { dx: 18, dy: -22, dw: 14, dh: 0 },
    "usagi.attack1.3": { dx: 37, dy: 12, dw: 7, dh: 0 },
    "usagi.attack1.4": { dx: 38, dy: -9, dw: -7, dh: 0 },
    "usagi.attack1.5": { dx: 31, dy: -16, dw: -40, dh: 0 },
    "usagi.attack2.0": { dx: 17, dy: -46, dw: 0, dh: 0 },
    "usagi.attack2.1": { dx: 15, dy: -44, dw: 0, dh: 0 },
    "usagi.attack2.2": { dx: 25, dy: -43, dw: 0, dh: 0 },
    "usagi.attack2.3": { dx: 16, dy: -38, dw: 0, dh: 0 },
    "usagi.attack2.4": { dx: 0, dy: -33, dw: 0, dh: 0 },
    "usagi.attack2.5": { dx: 3, dy: -31, dw: -18, dh: 0 },
    "usagi.attack3.0": { dx: 9, dy: -61, dw: 0, dh: 0 },
    "usagi.attack3.1": { dx: 0, dy: -77, dw: 0, dh: 0 },
    "usagi.attack3.2": { dx: 10, dy: -30, dw: 0, dh: 0 },
    "usagi.attack3.4": { dx: 5, dy: -42, dw: 0, dh: 0 },
    "usagi.attack3.5": { dx: -16, dy: -70, dw: 0, dh: 0 },
  };

  function buildAttackDefendSprites() {
    const rowNames = ["block", "attack1", "attack2", "attack3"];
    Object.entries(state.images.attackDefend || {}).forEach(([key, image]) => {
      if (!image) return;
      const cellW = image.width / 6;
      const cellH = image.height / 4;
      const bg = detectBackground(image);
      const cutFn = bg === "black"
        ? (img, sx, sy, sw, sh) => makeCutoutDark(img, sx, sy, sw, sh, 10)
        : bg === "purple"
        ? (img, sx, sy, sw, sh) => makeCutoutPurple(img, sx, sy, sw, sh)
        : (img, sx, sy, sw, sh) => makeCutout(img, sx, sy, sw, sh, 246);
      state.attackDefendSprites[key] = {};
      rowNames.forEach((rowName, row) => {
        state.attackDefendSprites[key][rowName] = Array.from({ length: 6 }, (_, col) => {
          const off = FRAME_OFFSETS[`${key}.${rowName}.${col}`];
          const sx = col * cellW + (off ? off.dx : 0);
          const sy = row * cellH + (off ? off.dy : 0);
          const sw = cellW + (off ? off.dw : 0);
          const sh = cellH + (off ? off.dh : 0);
          return cutFn(image, sx, sy, sw, sh);
        });
      });
    });
  }

  Promise.all([
    loadImage(ASSET_PATHS.avatar),
    loadImage(ASSET_PATHS.background),
    loadImage(ASSET_PATHS.opening).catch(() => null),
    loadImage(ASSET_PATHS.battle).catch(() => null),
    loadImage(ASSET_PATHS.battleLevel1).catch(() => null),
    loadImage(ASSET_PATHS.castleInterior).catch(() => null),
    loadImage(ASSET_PATHS.characters.chiikawa).catch(() => null),
    loadImage(ASSET_PATHS.characters.hachiware).catch(() => null),
    loadImage(ASSET_PATHS.characters.usagi).catch(() => null),
    loadImage(ASSET_PATHS.enemies.farmer).catch(() => null),
    loadImage(ASSET_PATHS.enemies.ashigaru).catch(() => null),
    loadImage(ASSET_PATHS.enemies.samurai).catch(() => null),
    loadImage(ASSET_PATHS.enemies.ninja).catch(() => null),
    loadImage(ASSET_PATHS.enemies.daimyo).catch(() => null),
    loadImage(ASSET_PATHS.enemies.shogun).catch(() => null),
    loadImage(ASSET_PATHS.enemies.momonga).catch(() => null),
    loadImage(ASSET_PATHS.attackDefend.chiikawa).catch(() => null),
    loadImage(ASSET_PATHS.attackDefend.hachiware).catch(() => null),
    loadImage(ASSET_PATHS.attackDefend.usagi).catch(() => null),
  ])
    .then(([avatar, background, opening, battleBackground, battleLevel1, castleInterior, chiikawa, hachiware, usagi, farmer, ashigaru, samurai, ninja, daimyo, shogun, momonga, adChiikawa, adHachiware, adUsagi]) => {
      state.images.avatar = avatar;
      state.images.background = background;
      state.images.opening = opening;
      state.images.characters = { chiikawa, hachiware, usagi };
      state.images.enemies = { farmer, ashigaru, samurai, ninja, daimyo, shogun, momonga };
      state.images.attackDefend = { chiikawa: adChiikawa, hachiware: adHachiware, usagi: adUsagi };
      if (battleBackground) {
        state.images.battleBackground = battleBackground;
      }
      if (battleLevel1) {
        state.images.battleLevel1 = battleLevel1;
      }
      if (castleInterior) {
        state.images.castleInterior = castleInterior;
      }
      buildAssets();
      state.scene = "start";
      canvas.focus();
      requestAnimationFrame(loop);
    })
    .catch((error) => {
      state.scene = "error";
      state.loadError = error.message;
      requestAnimationFrame(loop);
    });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    state.keys.add(key);
    if ([" ", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      event.preventDefault();
    }
    if (state.scene === "start" && (key === "enter" || key === " ")) {
      state.scene = "select";
    }
    if (state.scene === "playing") {
      if (key === "j") {
        attackWithPlayer();
      }
      if (key === " " && !event.repeat) {
        tryStartBlock();
      }
      if ((key === "e" || key === "k") && !event.repeat) {
        useSpecialSkill();
      }
      if (key === "shift" && !event.repeat) {
        dashPlayer();
      }
    }
    if (state.scene === "upgrade" && ["1", "2", "3"].includes(key)) {
      chooseUpgrade(Number(key) - 1);
    }
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.key.toLowerCase());
  });

  canvas.addEventListener("pointerdown", (event) => {
    canvas.focus();
    const point = getCanvasPoint(event);
    state.pointer = { ...point, down: true, active: true };
    if (state.scene === "playing" && event.button === 2) {
      tryStartBlock();
      return;
    }
    const button = [...state.buttons].reverse().find((item) => pointInRect(point, item));
    if (button) {
      button.onClick();
      return;
    }
    if (state.scene === "start") {
      state.scene = "select";
      return;
    }
    if (state.scene === "playing") {
      attackWithPlayer(point);
    }
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", (event) => {
    state.pointer = { ...getCanvasPoint(event), down: state.pointer.down, active: true };
  });

  canvas.addEventListener("mousemove", (event) => {
    state.pointer = { ...getCanvasPoint(event), down: state.pointer.down, active: true };
  });

  canvas.addEventListener("pointerup", () => {
    state.pointer.down = false;
  });

  canvas.addEventListener("pointerleave", () => {
    state.pointer.down = false;
    state.pointer.active = false;
  });

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (state.scene !== "playing" || !state.game) return;
    const game = state.game;
    game.elapsed += dt;
    game.floaters.forEach((floater) => {
      floater.y -= 34 * dt;
      floater.life -= dt;
    });
    game.floaters = game.floaters.filter((floater) => floater.life > 0);
    game.effects.forEach((effect) => {
      effect.life -= dt;
      effect.age += dt;
    });
    game.effects = game.effects.filter((effect) => effect.life > 0);
    updateScreenShake(dt);
    if (game.bossIntroTimer > 0) {
      game.bossIntroTimer = Math.max(0, game.bossIntroTimer - dt);
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateBombs(dt);
    updateDrops(dt);
    updateShrines(dt);

    if (game.player.hp <= 0) {
      finishGame("lose");
      return;
    }
    if (game.elapsed >= game.duration) {
      finishGame("time");
      return;
    }
    if (game.stageClearTimer > 0) {
      game.stageClearTimer -= dt;
      if (game.stageClearTimer <= 0) {
        beginNextStage();
      }
      return;
    }
    if (game.victoryTimer > 0) {
      game.victoryTimer -= dt;
      if (game.victoryTimer <= 0) {
        if (game.stage === 1) {
          game.stageClearTimer = 2.5;
          addFloater("第一关通过!", WIDTH / 2, 112, COLORS.gold, 2.2);
        } else {
          finishGame("boss");
        }
      }
      return;
    }
    if (game.enemies.length === 0) {
      const bossWave = game.stage === 1 ? STAGE1_BOSS_WAVE : BOSS_TRIGGER_WAVE;
      const stageWave = game.stage === 1 ? game.wave : game.wave - STAGE1_BOSS_WAVE;
      if (!game.bossStarted && stageWave >= bossWave) {
        if (!game.bossChoiceOffered) {
          beginUpgrade({ beforeBoss: true });
        } else {
          beginBossStage();
        }
      } else if (!game.bossDefeated) {
        beginUpgrade();
      }
    }
  }

  function updateScreenShake(dt) {
    if (state.shake.time <= 0) return;
    state.shake.time = Math.max(0, state.shake.time - dt);
  }

  function triggerScreenShake(magnitude, duration) {
    state.shake.magnitude = Math.max(state.shake.magnitude, magnitude);
    state.shake.duration = Math.max(state.shake.duration, duration);
    state.shake.time = Math.max(state.shake.time, duration);
  }

  function getScreenShakeOffset() {
    if (state.shake.time <= 0 || state.shake.duration <= 0) return { x: 0, y: 0 };
    const ratio = state.shake.time / state.shake.duration;
    const amount = state.shake.magnitude * ratio * ratio;
    return {
      x: (Math.random() - 0.5) * amount,
      y: (Math.random() - 0.5) * amount,
    };
  }

  function createGame(roleIndex) {
    const role = ROLES[roleIndex];
    const player = {
      x: WIDTH * 0.5,
      y: HEIGHT * 0.58,
      vx: 0,
      vy: 0,
      dirX: 1,
      dirY: 0,
      aimX: 1,
      aimY: 0,
      attackDirX: 1,
      attackDirY: 0,
      radius: 25,
      row: role.row,
      role,
      rank: role.rank,
      hp: role.maxHp,
      maxHp: role.maxHp,
      attackCooldown: 0,
      attackTimer: 0,
      attackStep: 0,
      comboWindow: 0,
      blockTimer: 0,
      blockCooldown: 0,
      blockJustStarted: 0,
      blockWasActive: false,
      specialCooldown: 0,
      specialMaxCooldown: 12,
      dashCharges: DASH_MAX_CHARGES,
      dashRecharge: 0,
      dashInputLock: 0,
      dashTime: 0,
      dashFromX: 0,
      dashFromY: 0,
      dashDirX: 1,
      dashDirY: 0,
      invuln: 0,
      hurt: 0,
      moving: false,
      shields: 0,
      speedBuff: 0,
    };

    const game = {
      player,
      role,
      score: 0,
      elapsed: 0,
      duration: 60,
      arena: "street",
      stage: 1,
      wave: 0,
      boss: null,
      bossStarted: false,
      bossDefeated: false,
      bossIntroTimer: 0,
      bossChoiceOffered: false,
      pendingBossChoice: false,
      victoryTimer: 0,
      stageClearTimer: 0,
      enemies: [],
      projectiles: [],
      bombs: [],
      drops: [],
      effects: [],
      floaters: [],
      shrines: [],
      attackMult: 1,
      rangeBonus: 0,
      speedBonus: 0,
      scoreMult: 1,
      rebelLevel: 0,
      damageTakenMult: 1,
      bestDefeatRank: role.rank,
      highestMultiplier: 1,
      kills: 0,
      pendingUpgrades: [],
      resultSaved: false,
      reason: "time",
    };
    state.game = game;
    state.pointer.active = false;
    state.pointer.down = false;
    spawnWave();
    state.scene = "playing";
    lastTime = performance.now();
  }

  function spawnWave() {
    const game = state.game;
    game.wave += 1;
    const stageWave = game.stage === 1 ? game.wave : game.wave - STAGE1_BOSS_WAVE;
    const count = game.stage === 1
      ? Math.min(5, 2 + stageWave)
      : Math.min(8, 3 + stageWave);
    let hasNinja = false;
    let hasDaimyo = false;
    for (let i = 0; i < count; i += 1) {
      const rank = pickWaveEnemyRank(game.wave, i, count, game.stage);
      hasNinja = hasNinja || rank === 4;
      hasDaimyo = hasDaimyo || rank === 5;
      game.enemies.push(createEnemy(rank));
    }
    const waveLabel = game.stage === 1 ? `第一关 · 第 ${stageWave} 波` : `第二关 · 第 ${stageWave} 波`;
    addFloater(waveLabel, WIDTH / 2, 112, COLORS.red, 1.3);
    if (hasDaimyo) {
      addFloater("大名进场", WIDTH / 2, 150, RANKS[4].color, 1.15);
    } else if (hasNinja) {
      addFloater("忍者参上", WIDTH / 2, 150, RANKS[3].color, 1.15);
    }
  }

  function pickWaveEnemyRank(wave, index, count, stage) {
    if (stage === 1) {
      if (wave === 2 && index === Math.floor(count / 2)) return 3;
      const rank = rollEnemyRank(wave, index);
      return Math.min(rank, STAGE1_MAX_RANK);
    }
    const stageWave = wave - STAGE1_BOSS_WAVE;
    if (stageWave === 2 && index === Math.floor(count / 2)) return 5;
    if (stageWave === 3 && index === Math.floor(count / 2)) return 4;
    const rank = rollEnemyRank(stageWave + 1, index);
    return stageWave <= BOSS_TRIGGER_WAVE ? Math.min(rank, 5) : rank;
  }

  function rollEnemyRank(wave, index) {
    const base = Math.min(6, 1 + Math.floor((wave + index * 0.4) / 2));
    const bonus = Math.random() < 0.25 + wave * 0.03 ? 1 : 0;
    const surprise = Math.random() < 0.08 ? 2 : 0;
    return Math.max(1, Math.min(6, base + bonus + surprise));
  }

  function beginBossStage() {
    const game = state.game;
    const player = game.player;
    game.bossStarted = true;
    game.projectiles = [];
    game.bombs = [];
    game.drops = [];
    game.floaters = [];
    player.vx = 0;
    player.vy = 0;

    if (game.stage === 1) {
      game.duration += 50;
      player.x = WIDTH * 0.5;
      player.y = HEIGHT - 88;
      player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.3));
      setPlayerAim(player, 0, -1);
      const boss = createMomongaBoss();
      game.boss = boss;
      game.enemies = [boss];
      game.shrines = [];
      game.bossIntroTimer = 2.0;
      addFloater("飞鼠大将", WIDTH / 2, 112, COLORS.gold, 1.35);
      addFloater("モモンガ参上!", boss.x, boss.y - 120, "#7b6bbd", 1.45);
      triggerScreenShake(16, 0.3);
    } else {
      game.arena = "castle";
      game.duration += 80;
      player.x = WIDTH * 0.5;
      player.y = HEIGHT - 88;
      player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.35));
      setPlayerAim(player, 0, -1);
      const boss = createBossEnemy();
      game.boss = boss;
      game.enemies = [boss];
      game.shrines = [createShrine()];
      game.bossIntroTimer = 2.2;
      addFloater("御殿决战", WIDTH / 2, 112, COLORS.gold, 1.35);
      addFloater("将军登场", boss.x, boss.y - 146, COLORS.red, 1.45);
      triggerScreenShake(20, 0.35);
    }
  }

  function beginNextStage() {
    const game = state.game;
    const player = game.player;
    game.stage += 1;
    game.bossStarted = false;
    game.bossDefeated = false;
    game.bossChoiceOffered = false;
    game.pendingBossChoice = false;
    game.boss = null;
    game.arena = "street";
    game.projectiles = [];
    game.bombs = [];
    game.drops = [];
    game.shrines = [];
    game.effects = [];
    game.floaters = [];
    game.duration += 80;
    player.x = WIDTH * 0.5;
    player.y = HEIGHT * 0.58;
    player.vx = 0;
    player.vy = 0;
    player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.5));
    player.attackCooldown = 0;
    player.attackTimer = 0;
    player.blockTimer = 0;
    player.blockCooldown = 0;
    player.invuln = 1.0;
    state.scene = "stageTransition";
  }

  function confirmNextStage() {
    const game = state.game;
    state.scene = "playing";
    spawnWave();
    addFloater(`第${game.stage}关 开始!`, WIDTH / 2, 112, COLORS.red, 1.4);
    triggerScreenShake(12, 0.2);
    lastTime = performance.now();
  }

  function createShrine() {
    const onLeft = Math.random() < 0.5;
    const x = onLeft ? 220 : WIDTH - 220;
    const y = 252;
    return {
      id: cryptoRandomId(),
      x,
      y,
      radius: 30,
      hp: 50,
      maxHp: 50,
      destroyed: false,
      hurt: 0,
    };
  }

  function createEnemy(rank) {
    const rankInfo = RANKS[rank - 1];
    const side = Math.floor(Math.random() * 4);
    const spawn = [
      { x: 80 + Math.random() * 200, y: 190 + Math.random() * 280 },
      { x: WIDTH - 80 - Math.random() * 200, y: 190 + Math.random() * 280 },
      { x: 120 + Math.random() * (WIDTH - 240), y: 185 },
      { x: 120 + Math.random() * (WIDTH - 240), y: HEIGHT - 70 },
    ][side];
    const row = rank <= 2 ? rank - 1 : (rank + 1) % 3;
    return {
      id: cryptoRandomId(),
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      row,
      rank,
      rankInfo,
      ranged: rankInfo.ranged === true,
      radius: 20 + rank * 3,
      hp: rankInfo.hp + state.game.wave * 7,
      maxHp: rankInfo.hp + state.game.wave * 7,
      speed: rankInfo.speed + Math.random() * 8,
      damage: rankInfo.damage,
      cooldown: getEnemyAttackProfile(rank).initialCooldown + Math.random() * 0.25,
      attackTimer: 0,
      attackHitDone: false,
      chargeState: "idle",
      chargeTimer: 0,
      chargeTargetX: 0,
      chargeTargetY: 0,
      chargeDirX: 0,
      chargeDirY: 0,
      chargeHitDone: false,
      recoveryTimer: 0,
      staggerTimer: 0,
      hurt: 0,
      moving: false,
      movePhase: Math.random() * Math.PI * 2,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      behaviorTimer: 0.8 + Math.random() * 1.4,
      dirX: Math.random() > 0.5 ? 1 : -1,
      dirY: 0,
    };
  }

  function createBossEnemy() {
    const rankInfo = RANKS[5];
    const phaseMaxHp = 320;
    return {
      id: cryptoRandomId(),
      x: WIDTH * 0.5,
      y: 306,
      vx: 0,
      vy: 0,
      row: 2,
      rank: 6,
      rankInfo,
      boss: true,
      bossPhase: 1,
      bossPhaseMax: 2,
      phaseMaxHp,
      radius: 58,
      hp: phaseMaxHp,
      maxHp: phaseMaxHp,
      speed: 68,
      damage: 20,
      cooldown: 1.25,
      attackTimer: 0,
      attackHitDone: false,
      attackKind: "ranged",
      recoveryTimer: 0,
      hurt: 0,
      moving: false,
      movePhase: Math.random() * Math.PI * 2,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      behaviorTimer: 0.9,
      dirX: 0,
      dirY: 1,
      bossChargeState: "idle",
      bossChargeTimer: 0,
      bossChargeCooldown: 5.5 + Math.random() * 2.5,
      bossChargeHitDone: false,
      bossStunTimer: 0,
      lineAttackActive: false,
      lineAttackTimer: 0,
      lineAttackHit: false,
      lineAttackDirX: 0,
      lineAttackDirY: 0,
      lineAttackOriginX: 0,
      lineAttackOriginY: 0,
    };
  }

  function createMomongaBoss() {
    const phaseMaxHp = 350;
    return {
      id: cryptoRandomId(),
      x: WIDTH * 0.5,
      y: 280,
      vx: 0,
      vy: 0,
      row: 0,
      rank: 7,
      rankInfo: { rank: 7, name: "飞鼠", jp: "鼯", spriteKey: "momonga", score: 600, hp: phaseMaxHp, speed: 88, damage: 14, color: "#7b6bbd" },
      boss: true,
      momongaBoss: true,
      bossPhase: 1,
      bossPhaseMax: 1,
      phaseMaxHp,
      radius: 44,
      hp: phaseMaxHp,
      maxHp: phaseMaxHp,
      speed: 88,
      damage: 14,
      cooldown: 1.0,
      attackTimer: 0,
      attackHitDone: false,
      attackKind: "ranged",
      recoveryTimer: 0,
      hurt: 0,
      moving: false,
      movePhase: Math.random() * Math.PI * 2,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
      behaviorTimer: 0.8,
      dirX: 0,
      dirY: 1,
      bossChargeState: "idle",
      bossChargeTimer: 0,
      bossChargeCooldown: 4.0 + Math.random() * 2,
      bossChargeHitDone: false,
      bossStunTimer: 0,
      glideTimer: 0,
      glideCooldown: 6 + Math.random() * 3,
      glideState: "idle",
      glideDirX: 0,
      glideDirY: 0,
    };
  }

  function cryptoRandomId() {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0].toString(36);
    }
    return Math.random().toString(36).slice(2);
  }

  function updatePlayer(dt) {
    const game = state.game;
    const player = game.player;
    const left = state.keys.has("a") || state.keys.has("arrowleft");
    const right = state.keys.has("d") || state.keys.has("arrowright");
    const up = state.keys.has("w") || state.keys.has("arrowup");
    const down = state.keys.has("s") || state.keys.has("arrowdown");
    let dx = (right ? 1 : 0) - (left ? 1 : 0);
    let dy = (down ? 1 : 0) - (up ? 1 : 0);
    const length = Math.hypot(dx, dy);
    player.moving = length > 0;
    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    const speedBuff = player.speedBuff > 0 ? 34 : 0;
    let speed = player.role.speed + game.speedBonus + speedBuff;
    if (player.blockTimer > 0) speed *= 0.35;
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
    keepActorInBounds(player, PLAYER_BOUNDS);

    const aimDx = state.pointer.x - player.x;
    const aimDy = state.pointer.y - player.y;
    const aimDistance = Math.hypot(aimDx, aimDy);
    if (state.pointer.active && aimDistance > 24) {
      setPlayerAim(player, aimDx / aimDistance, aimDy / aimDistance);
    } else if (length > 0) {
      setPlayerAim(player, dx, dy);
    }

    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.attackTimer = Math.max(0, player.attackTimer - dt);
    player.comboWindow = Math.max(0, player.comboWindow - dt);
    if (player.comboWindow <= 0 && player.attackTimer <= 0) {
      player.attackStep = 0;
    }
    if (player.blockTimer > 0) {
      player.blockTimer = Math.max(0, player.blockTimer - dt);
      player.blockJustStarted += dt;
      if (player.blockTimer <= 0 && player.blockWasActive) {
        player.blockCooldown = BLOCK_COOLDOWN;
        player.blockWasActive = false;
      }
    } else {
      player.blockCooldown = Math.max(0, player.blockCooldown - dt);
      player.blockWasActive = false;
    }
    player.specialCooldown = Math.max(0, player.specialCooldown - dt);
    player.dashTime = Math.max(0, player.dashTime - dt);
    player.dashInputLock = Math.max(0, player.dashInputLock - dt);
    updateDashRecharge(player, dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.hurt = Math.max(0, player.hurt - dt);
    player.speedBuff = Math.max(0, player.speedBuff - dt);
  }

  function updateDashRecharge(player, dt) {
    if (player.dashCharges >= DASH_MAX_CHARGES) {
      player.dashCharges = DASH_MAX_CHARGES;
      player.dashRecharge = 0;
      return;
    }
    const rechargeTime = player.role && player.role.id === "usagi" ? 10 : DASH_RECHARGE_TIME;
    player.dashRecharge += dt;
    while (player.dashRecharge >= rechargeTime && player.dashCharges < DASH_MAX_CHARGES) {
      player.dashCharges += 1;
      player.dashRecharge -= rechargeTime;
    }
    if (player.dashCharges >= DASH_MAX_CHARGES) {
      player.dashCharges = DASH_MAX_CHARGES;
      player.dashRecharge = 0;
    }
  }

  function setPlayerAim(player, x, y) {
    const length = Math.max(1, Math.hypot(x, y));
    player.aimX = x / length;
    player.aimY = y / length;
    player.dirX = player.aimX;
    player.dirY = player.aimY;
  }

  function updateEnemies(dt) {
    const game = state.game;
    const player = game.player;
    for (const enemy of game.enemies) {
      let attackProfile = getEnemyAttackProfile(enemy);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      const previousAttackTimer = enemy.attackTimer;
      enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
      enemy.recoveryTimer = Math.max(0, enemy.recoveryTimer - dt);
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      if (enemy.stunTimer && enemy.stunTimer > 0) {
        enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      }
      if (enemy.staggerTimer && enemy.staggerTimer > 0) {
        enemy.staggerTimer = Math.max(0, enemy.staggerTimer - dt);
      }
      if (previousAttackTimer > 0 && enemy.attackTimer <= 0) {
        enemy.recoveryTimer = Math.max(enemy.recoveryTimer, attackProfile.recovery);
      }
      enemy.behaviorTimer -= dt;
      if (enemy.behaviorTimer <= 0) {
        enemy.strafeDir *= -1;
        enemy.behaviorTimer = 0.75 + Math.random() * 1.35;
      }
      const toPlayerX = player.x - enemy.x;
      const toPlayerY = player.y - enemy.y;
      const distance = Math.max(1, Math.hypot(toPlayerX, toPlayerY));
      const nx = toPlayerX / distance;
      const ny = toPlayerY / distance;
      enemy.dirX = nx;
      enemy.dirY = ny;
      if (enemy.boss && game.bossIntroTimer > 0) {
        enemy.moving = false;
        continue;
      }

      if (updateDaimyoCharge(enemy, player, dt, nx, ny, distance)) {
        continue;
      }

      if (enemy.boss) {
        enemy.bossChargeCooldown = Math.max(0, (enemy.bossChargeCooldown || 0) - dt);
        enemy.bossStunTimer = Math.max(0, (enemy.bossStunTimer || 0) - dt);
        if (enemy.momongaBoss) {
          enemy.glideCooldown = Math.max(0, (enemy.glideCooldown || 0) - dt);
          if (updateMomongaGlide(enemy, player, dt, nx, ny, distance)) {
            continue;
          }
          if (shouldStartMomongaGlide(enemy, distance)) {
            startMomongaGlide(enemy, player, nx, ny);
            continue;
          }
        }
        if (updateBossCharge(enemy, player, dt, nx, ny, distance)) {
          continue;
        }
        if (!enemy.momongaBoss && shouldStartBossCharge(enemy, distance)) {
          startBossCharge(enemy, player, nx, ny);
          continue;
        }
      }

      resolveEnemyAttackHit(enemy, player, attackProfile);
      if (enemy.boss) updateLineAttack(enemy, player, dt);

      const behavior = getEnemyMovement(enemy, nx, ny, distance);
      enemy.moving = enemy.hurt <= 0 && enemy.attackTimer <= 0 && enemy.recoveryTimer <= 0 && behavior.intent > 0.02;
      if (enemy.moving) {
        enemy.vx += behavior.x * enemy.speed * behavior.accel * dt;
        enemy.vy += behavior.y * enemy.speed * behavior.accel * dt;
      }
      applyEnemySeparation(enemy, dt);
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      keepActorInBounds(enemy, enemy.boss ? BOSS_BOUNDS : ENEMY_BOUNDS);
      enemy.vx *= 0.88;
      enemy.vy *= 0.88;

      const nextAttackKind = enemy.boss ? chooseBossAttackKind(enemy, distance) : enemy.attackKind;
      const candidateProfile = enemy.boss ? getBossAttackProfile(nextAttackKind, enemy) : attackProfile;
      const attackIsRanged = isRangedAttack(enemy, candidateProfile);
      const inAttackRange = attackIsRanged
        ? distance < candidateProfile.range && distance > (candidateProfile.minRange || 0)
        : distance < player.radius + enemy.radius + candidateProfile.range;
      if (shouldStartDaimyoCharge(enemy, distance)) {
        startDaimyoCharge(enemy, player, nx, ny);
        continue;
      }
      if (inAttackRange && enemy.cooldown <= 0 && enemy.attackTimer <= 0 && enemy.recoveryTimer <= 0) {
        if (enemy.boss) {
          enemy.attackKind = nextAttackKind;
          attackProfile = candidateProfile;
        }
        enemy.cooldown = attackProfile.cooldown;
        enemy.attackDirX = nx;
        enemy.attackDirY = ny;
        enemy.attackDuration = attackProfile.duration;
        enemy.attackTimer = enemy.attackDuration;
        enemy.attackHitDone = false;
        enemy.vx *= 0.28;
        enemy.vy *= 0.28;
        addEffect(getEnemyAttackEffectType(enemy, attackProfile), enemy.x + nx * 28, enemy.y - 24 + ny * 16, enemy.rankInfo.color, Math.atan2(ny, nx));
      }
    }
    resolveActorOverlaps(game.enemies);
  }

  function shouldStartDaimyoCharge(enemy, distance) {
    if (!enemy || enemy.rank !== 5 || enemy.boss) return false;
    if (enemy.cooldown > 0 || enemy.attackTimer > 0 || enemy.recoveryTimer > 0 || enemy.hurt > 0) return false;
    if (enemy.chargeState && enemy.chargeState !== "idle") return false;
    return distance > 132 && distance < 340;
  }

  function startDaimyoCharge(enemy, player, nx, ny) {
    enemy.chargeState = "windup";
    enemy.chargeTimer = 0.62;
    enemy.chargeTargetX = player.x;
    enemy.chargeTargetY = player.y;
    enemy.chargeDirX = nx;
    enemy.chargeDirY = ny;
    enemy.chargeHitDone = false;
    enemy.cooldown = 1.85;
    enemy.vx *= 0.12;
    enemy.vy *= 0.12;
    enemy.moving = false;
    addFloater("锁定", player.x, player.y - 50, enemy.rankInfo.color, 0.55);
    addEffect("attackFlash", enemy.x + nx * 40, enemy.y - 24 + ny * 18, enemy.rankInfo.color, Math.atan2(ny, nx));
  }

  function updateDaimyoCharge(enemy, player, dt, nx, ny, distance) {
    if (!enemy || enemy.rank !== 5 || enemy.boss || !enemy.chargeState || enemy.chargeState === "idle") return false;
    enemy.moving = false;
    enemy.attackDirX = enemy.chargeDirX || nx;
    enemy.attackDirY = enemy.chargeDirY || ny;
    enemy.dirX = enemy.attackDirX;
    enemy.dirY = enemy.attackDirY;
    enemy.chargeTimer = Math.max(0, enemy.chargeTimer - dt);

    if (enemy.chargeState === "windup") {
      enemy.vx *= 0.18;
      enemy.vy *= 0.18;
      if (enemy.chargeTimer <= 0) {
        const dx = enemy.chargeTargetX - enemy.x;
        const dy = enemy.chargeTargetY - enemy.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        enemy.chargeDirX = dx / length;
        enemy.chargeDirY = dy / length;
        enemy.attackDirX = enemy.chargeDirX;
        enemy.attackDirY = enemy.chargeDirY;
        enemy.chargeState = "dash";
        enemy.chargeTimer = 0.34;
        addEffect("dashLine", enemy.x, enemy.y - 28, enemy.rankInfo.color, Math.atan2(enemy.chargeDirY, enemy.chargeDirX));
      }
      return true;
    }

    if (enemy.chargeState === "dash") {
      const speed = 520;
      enemy.x += enemy.chargeDirX * speed * dt;
      enemy.y += enemy.chargeDirY * speed * dt * 0.82;
      keepActorInBounds(enemy, ENEMY_BOUNDS);
      if (!enemy.chargeHitDone && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius + 10) {
        enemy.chargeHitDone = true;
        if (player.invuln > 0) {
          addFloater("闪避!", player.x, player.y - 58, COLORS.blue, 0.55);
          addEffect("guardFlash", player.x, player.y - 28, COLORS.blue);
        } else {
          damagePlayer(enemy.damage + 7, enemy);
          triggerScreenShake(18, 0.2);
        }
      }
      if (enemy.chargeTimer <= 0) {
        enemy.chargeState = "idle";
        enemy.recoveryTimer = Math.max(enemy.recoveryTimer, 0.28);
        enemy.vx = enemy.chargeDirX * 70;
        enemy.vy = enemy.chargeDirY * 44;
      }
      return true;
    }

    enemy.chargeState = "idle";
    return false;
  }

  function shouldStartBossCharge(enemy, distance) {
    if (!enemy.boss) return false;
    if (enemy.bossChargeState && enemy.bossChargeState !== "idle") return false;
    if (enemy.attackTimer > 0 || enemy.recoveryTimer > 0 || enemy.hurt > 0) return false;
    if ((enemy.bossChargeCooldown || 0) > 0) return false;
    if (state.game.bossIntroTimer > 0) return false;
    if (distance < 150 || distance > 620) return false;
    return Math.random() < 0.45;
  }

  function startBossCharge(enemy, player, nx, ny) {
    enemy.bossChargeState = "windup";
    enemy.bossChargeTimer = 0.7;
    enemy.bossChargeDirX = nx;
    enemy.bossChargeDirY = ny;
    enemy.bossChargeTargetX = player.x;
    enemy.bossChargeTargetY = player.y;
    enemy.bossChargeHitDone = false;
    enemy.attackDirX = nx;
    enemy.attackDirY = ny;
    enemy.dirX = nx;
    enemy.dirY = ny;
    enemy.cooldown = Math.max(enemy.cooldown, 1.4);
    enemy.vx *= 0.1;
    enemy.vy *= 0.1;
    enemy.moving = false;
    addFloater("将军突进！", enemy.x, enemy.y - 168, COLORS.red, 1.05);
    addEffect("attackFlash", enemy.x + nx * 56, enemy.y - 30 + ny * 22, COLORS.red, Math.atan2(ny, nx));
    addEffect("specialAura", enemy.x, enemy.y - 30, enemy.rankInfo.color);
  }

  function updateBossCharge(enemy, player, dt, nx, ny, distance) {
    if (!enemy.boss || !enemy.bossChargeState || enemy.bossChargeState === "idle") return false;
    enemy.bossChargeTimer = Math.max(0, enemy.bossChargeTimer - dt);

    if (enemy.bossChargeState === "windup") {
      enemy.moving = false;
      enemy.vx *= 0.16;
      enemy.vy *= 0.16;
      enemy.attackDirX = enemy.bossChargeDirX;
      enemy.attackDirY = enemy.bossChargeDirY;
      enemy.dirX = enemy.attackDirX;
      enemy.dirY = enemy.attackDirY;
      if (enemy.bossChargeTimer <= 0) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        enemy.bossChargeDirX = dx / length;
        enemy.bossChargeDirY = dy / length;
        enemy.attackDirX = enemy.bossChargeDirX;
        enemy.attackDirY = enemy.bossChargeDirY;
        enemy.bossChargeState = "dash";
        enemy.bossChargeTimer = 0.46;
        addEffect("dashLine", enemy.x, enemy.y - 30, enemy.rankInfo.color, Math.atan2(enemy.bossChargeDirY, enemy.bossChargeDirX));
        triggerScreenShake(10, 0.12);
      }
      return true;
    }

    if (enemy.bossChargeState === "dash") {
      enemy.moving = true;
      const speed = 620;
      enemy.x += enemy.bossChargeDirX * speed * dt;
      enemy.y += enemy.bossChargeDirY * speed * dt * 0.78;
      keepActorInBounds(enemy, BOSS_BOUNDS);
      if (!enemy.bossChargeHitDone && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius + 12) {
        enemy.bossChargeHitDone = true;
        if (player.invuln > 0) {
          addFloater("闪避!", player.x, player.y - 58, COLORS.blue, 0.55);
          addEffect("guardFlash", player.x, player.y - 28, COLORS.blue);
        } else {
          damagePlayer(enemy.damage + 12, enemy);
          addEffect("bossShockwave", player.x, player.y - 20, COLORS.red, Math.atan2(enemy.bossChargeDirY, enemy.bossChargeDirX));
          addEffect("burst", player.x, player.y - 18, COLORS.gold);
          triggerScreenShake(24, 0.28);
        }
      }
      if (enemy.bossChargeTimer <= 0) {
        enemy.bossChargeState = "stun";
        enemy.bossChargeTimer = 3;
        enemy.bossStunTimer = 3;
        enemy.recoveryTimer = Math.max(enemy.recoveryTimer, 3);
        enemy.cooldown = Math.max(enemy.cooldown, 3);
        enemy.attackTimer = 0;
        enemy.vx = enemy.bossChargeDirX * 60;
        enemy.vy = enemy.bossChargeDirY * 38;
        addEffect("specialAura", enemy.x, enemy.y - 30, COLORS.gold);
        addEffect("burst", enemy.x, enemy.y - 30, COLORS.gold);
        triggerScreenShake(14, 0.18);
      }
      return true;
    }

    if (enemy.bossChargeState === "stun") {
      enemy.moving = false;
      enemy.vx *= 0.82;
      enemy.vy *= 0.82;
      enemy.attackTimer = 0;
      enemy.recoveryTimer = Math.max(enemy.recoveryTimer, enemy.bossChargeTimer);
      if (enemy.bossChargeTimer <= 0) {
        enemy.bossChargeState = "idle";
        enemy.bossStunTimer = 0;
        enemy.bossChargeCooldown = 7 + Math.random() * 4;
      }
      return true;
    }

    enemy.bossChargeState = "idle";
    return false;
  }

  function shouldStartMomongaGlide(enemy, distance) {
    if (!enemy.momongaBoss) return false;
    if (enemy.glideState && enemy.glideState !== "idle") return false;
    if (enemy.attackTimer > 0 || enemy.recoveryTimer > 0 || enemy.hurt > 0) return false;
    if ((enemy.glideCooldown || 0) > 0) return false;
    if (state.game.bossIntroTimer > 0) return false;
    if (enemy.bossChargeState && enemy.bossChargeState !== "idle") return false;
    if (distance < 120 || distance > 580) return false;
    return Math.random() < 0.5;
  }

  function startMomongaGlide(enemy, player, nx, ny) {
    enemy.glideState = "rise";
    enemy.glideTimer = 0.5;
    enemy.glideDirX = nx;
    enemy.glideDirY = ny;
    enemy.glideTargetX = player.x;
    enemy.glideTargetY = player.y;
    enemy.bossChargeHitDone = false;
    enemy.cooldown = Math.max(enemy.cooldown, 1.2);
    enemy.vx *= 0.1;
    enemy.vy *= 0.1;
    enemy.moving = false;
    addFloater("滑翔突击!", enemy.x, enemy.y - 140, "#7b6bbd", 1.0);
    addEffect("specialAura", enemy.x, enemy.y - 30, "#7b6bbd");
  }

  function updateMomongaGlide(enemy, player, dt, nx, ny, distance) {
    if (!enemy.momongaBoss || !enemy.glideState || enemy.glideState === "idle") return false;
    enemy.glideTimer = Math.max(0, enemy.glideTimer - dt);

    if (enemy.glideState === "rise") {
      enemy.moving = false;
      enemy.vx *= 0.1;
      enemy.vy *= 0.1;
      if (enemy.glideTimer <= 0) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        enemy.glideDirX = dx / length;
        enemy.glideDirY = dy / length;
        enemy.glideState = "swoop";
        enemy.glideTimer = 0.55;
        addEffect("dashLine", enemy.x, enemy.y - 28, "#7b6bbd", Math.atan2(enemy.glideDirY, enemy.glideDirX));
        triggerScreenShake(8, 0.1);
      }
      return true;
    }

    if (enemy.glideState === "swoop") {
      enemy.moving = true;
      const speed = 560;
      enemy.x += enemy.glideDirX * speed * dt;
      enemy.y += enemy.glideDirY * speed * dt * 0.8;
      keepActorInBounds(enemy, BOSS_BOUNDS);
      if (!enemy.bossChargeHitDone && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius + 14) {
        enemy.bossChargeHitDone = true;
        if (player.invuln > 0) {
          addFloater("闪避!", player.x, player.y - 58, COLORS.blue, 0.55);
          addEffect("guardFlash", player.x, player.y - 28, COLORS.blue);
        } else {
          damagePlayer(enemy.damage + 8, enemy);
          addEffect("bossShockwave", player.x, player.y - 20, "#7b6bbd", Math.atan2(enemy.glideDirY, enemy.glideDirX));
          triggerScreenShake(18, 0.22);
        }
      }
      if (enemy.glideTimer <= 0) {
        enemy.glideState = "land";
        enemy.glideTimer = 1.8;
        enemy.recoveryTimer = Math.max(enemy.recoveryTimer, 1.8);
        enemy.cooldown = Math.max(enemy.cooldown, 1.8);
        enemy.vx = enemy.glideDirX * 50;
        enemy.vy = enemy.glideDirY * 30;
        addEffect("burst", enemy.x, enemy.y - 20, "#7b6bbd");
        triggerScreenShake(12, 0.15);
      }
      return true;
    }

    if (enemy.glideState === "land") {
      enemy.moving = false;
      enemy.vx *= 0.85;
      enemy.vy *= 0.85;
      enemy.attackTimer = 0;
      enemy.recoveryTimer = Math.max(enemy.recoveryTimer, enemy.glideTimer);
      if (enemy.glideTimer <= 0) {
        enemy.glideState = "idle";
        enemy.glideCooldown = 5 + Math.random() * 3;
      }
      return true;
    }

    enemy.glideState = "idle";
    return false;
  }

  function resolveEnemyAttackHit(enemy, player, profile) {
    if (enemy.attackTimer <= 0 || enemy.attackHitDone) return;
    const progress = 1 - enemy.attackTimer / (enemy.attackDuration || profile.duration);
    if (progress < profile.hitAt) return;
    enemy.attackHitDone = true;
    if (profile.bombAttack) {
      throwBombs(enemy, profile);
      return;
    }
    if (profile.lineAttack) {
      startLineAttack(enemy, profile);
      return;
    }
    if (isRangedAttack(enemy, profile)) {
      throwEnemyProjectile(enemy, profile);
      return;
    }
    if (isPlayerInEnemyAttack(enemy, player, profile)) {
      damagePlayer(enemy.damage, enemy);
      addEffect("hit", player.x, player.y - 20, enemy.rankInfo.color);
      addEffect("enemySpark", player.x, player.y - 28, enemy.rankInfo.color, Math.atan2(enemy.attackDirY, enemy.attackDirX));
      if (enemy.boss) {
        addEffect("bossShockwave", player.x, player.y - 20, enemy.rankInfo.color, Math.atan2(enemy.attackDirY, enemy.attackDirX));
        addEffect("bossSmash", player.x, player.y - 12, COLORS.red, Math.atan2(enemy.attackDirY, enemy.attackDirX));
        addEffect("burst", player.x, player.y - 16, COLORS.gold);
        triggerScreenShake(26, 0.32);
      }
    } else {
      addEffect("swing", enemy.x + enemy.attackDirX * 38, enemy.y - 26 + enemy.attackDirY * 20, enemy.rankInfo.color, Math.atan2(enemy.attackDirY, enemy.attackDirX));
      addEffect("enemySpark", enemy.x + enemy.attackDirX * 54, enemy.y - 28 + enemy.attackDirY * 28, enemy.rankInfo.color, Math.atan2(enemy.attackDirY, enemy.attackDirX));
      if (enemy.boss) {
        const slamX = enemy.x + enemy.attackDirX * 92;
        const slamY = enemy.y - 18 + enemy.attackDirY * 52;
        addEffect("bossShockwave", slamX, slamY, enemy.rankInfo.color, Math.atan2(enemy.attackDirY, enemy.attackDirX));
        addEffect("bossSmash", slamX, slamY, COLORS.gold, Math.atan2(enemy.attackDirY, enemy.attackDirX));
        addEffect("burst", slamX, slamY, enemy.rankInfo.color);
        triggerScreenShake(20, 0.26);
      }
    }
  }

  function isPlayerInEnemyAttack(enemy, player, profile) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const dot = (dx * enemy.attackDirX + dy * enemy.attackDirY) / distance;
    return distance < player.radius + enemy.radius + profile.range && dot > profile.cone;
  }

  function getEnemyAttackProfile(enemyOrRank) {
    const enemy = typeof enemyOrRank === "object" ? enemyOrRank : null;
    if (enemy && enemy.boss) return getBossAttackProfile(enemy.attackKind || "ranged", enemy);
    const rank = enemy ? enemy.rank : enemyOrRank;
    if (rank >= 6) return { range: 64, cooldown: 0.42, duration: 0.64, initialCooldown: 0.28, hitAt: 0.52, recovery: 0.78, cone: 0.16 };
    if (rank === 5) return { range: 52, cooldown: 0.54, duration: 0.60, initialCooldown: 0.36, hitAt: 0.54, recovery: 0.66, cone: 0.12 };
    if (rank === 4) return { range: 330, minRange: 64, cooldown: 1.08, duration: 0.70, initialCooldown: 0.58, hitAt: 0.58, recovery: 0.46, cone: -1, projectileSpeed: 330, projectileLife: 1.75 };
    if (rank === 3) return { range: 40, cooldown: 0.68, duration: 0.56, initialCooldown: 0.44, hitAt: 0.54, recovery: 0.5, cone: 0.08 };
    if (rank === 2) return { range: 30, cooldown: 0.72, duration: 0.58, initialCooldown: 0.48, hitAt: 0.56, recovery: 0.38, cone: 0.05 };
    return { range: 22, cooldown: 0.78, duration: 0.60, initialCooldown: 0.55, hitAt: 0.58, recovery: 0.3, cone: 0.02 };
  }

  function getBossAttackProfile(kind, enemy) {
    if (enemy && enemy.momongaBoss) {
      if (kind === "ranged") {
        return {
          range: 380,
          minRange: 80,
          cooldown: 1.2,
          duration: 0.68,
          initialCooldown: 0.85,
          hitAt: 0.52,
          recovery: 0.7,
          cone: -1,
          projectileKind: "bossAxe",
          projectileSpeed: 340,
          projectileLife: 1.9,
          projectileRadius: 16,
        };
      }
      if (kind === "bomb") {
        return {
          range: 500,
          cooldown: 2.0,
          duration: 0.6,
          initialCooldown: 1.0,
          hitAt: 0.5,
          recovery: 1.0,
          cone: -1,
          bombAttack: true,
          bombCount: 3,
          bombFuseTime: 1.5,
          bombBlastRadius: 52,
          bombDamage: 18,
        };
      }
      return { range: 72, cooldown: 0.95, duration: 0.58, initialCooldown: 0.7, hitAt: 0.5, recovery: 0.42, cone: -0.1, bossMelee: true };
    }
    if (kind === "ranged") {
      return {
        range: 520,
        minRange: 96,
        cooldown: 1.5,
        duration: 0.95,
        initialCooldown: 1.2,
        hitAt: 0.58,
        recovery: 0.9,
        cone: -1,
        lineAttack: true,
        lineAttackDuration: 0.55,
        lineAttackRange: 540,
        lineAttackWidth: 29,
        lineAttackDamage: 22,
      };
    }
    return { range: 96, cooldown: 1.18, duration: 0.74, initialCooldown: 0.8, hitAt: 0.55, recovery: 0, cone: -0.08, bossMelee: true };
  }

  function chooseBossAttackKind(enemy, distance) {
    if (enemy.momongaBoss) {
      if (distance < 140) return "melee";
      if (enemy.hp < enemy.maxHp * 0.5 && Math.random() < 0.3) return "melee";
      const bombChance = enemy.hp < enemy.maxHp * 0.5 ? 0.4 : 0.25;
      if (Math.random() < bombChance) return "bomb";
      return "ranged";
    }
    if (distance < 170) return "melee";
    if (enemy.hp < enemy.maxHp * 0.42 && Math.random() < 0.24) return "melee";
    return "ranged";
  }

  function isRangedEnemy(enemy) {
    return enemy && (enemy.ranged === true || (enemy.rankInfo && enemy.rankInfo.ranged === true));
  }

  function isRangedAttack(enemy, profile) {
    return isRangedEnemy(enemy) || Boolean(profile && (profile.projectileKind || profile.lineAttack || profile.bombAttack));
  }

  function getEnemyAttackEffectType(enemy, profile) {
    if (enemy.boss && profile.bombAttack) return "bossSmash";
    if (enemy.boss && profile.lineAttack) return "bossSmash";
    if (enemy.boss && profile.projectileKind) return "bossAxeThrow";
    if (enemy.boss) return "bossSmash";
    return isRangedAttack(enemy, profile) ? "shurikenThrow" : "attackFlash";
  }

  function throwEnemyProjectile(enemy, profile) {
    const game = state.game;
    const speed = profile.projectileSpeed || 300;
    const dirX = enemy.attackDirX || enemy.dirX || 1;
    const dirY = enemy.attackDirY || enemy.dirY || 0;
    const startX = enemy.x + dirX * (enemy.boss ? 58 : 30);
    const startY = enemy.y - (enemy.boss ? 84 : 28) + dirY * (enemy.boss ? 28 : 18);
    game.projectiles.push({
      id: cryptoRandomId(),
      kind: profile.projectileKind || "shuriken",
      x: startX,
      y: startY,
      vx: dirX * speed,
      vy: dirY * speed * 0.76,
      dirX,
      dirY,
      radius: profile.projectileRadius || 11,
      damage: enemy.damage,
      color: enemy.rankInfo.color,
      age: 0,
      life: profile.projectileLife || 1.6,
      maxLife: profile.projectileLife || 1.6,
      spin: Math.atan2(dirY, dirX),
      spinSpeed: 18 + Math.random() * 8,
      hit: false,
    });
    addEffect(enemy.boss ? "bossAxeThrow" : "shurikenThrow", startX, startY, enemy.rankInfo.color, Math.atan2(dirY, dirX));
  }

  function startLineAttack(enemy, profile) {
    const dirX = enemy.attackDirX || enemy.dirX || 1;
    const dirY = enemy.attackDirY || enemy.dirY || 0;
    const len = Math.hypot(dirX, dirY) || 1;
    enemy.lineAttackActive = true;
    enemy.lineAttackTimer = profile.lineAttackDuration || 0.45;
    enemy.lineAttackMaxTimer = enemy.lineAttackTimer;
    enemy.lineAttackHit = false;
    enemy.lineAttackDirX = dirX / len;
    enemy.lineAttackDirY = dirY / len;
    enemy.lineAttackOriginX = enemy.x + enemy.lineAttackDirX * 42;
    enemy.lineAttackOriginY = enemy.y - 60 + enemy.lineAttackDirY * 20;
    enemy.lineAttackRange = profile.lineAttackRange || 420;
    enemy.lineAttackWidth = profile.lineAttackWidth || 32;
    enemy.lineAttackDamage = profile.lineAttackDamage || enemy.damage;
    addEffect("bossShockwave", enemy.lineAttackOriginX, enemy.lineAttackOriginY, enemy.rankInfo.color, Math.atan2(dirY, dirX));
    triggerScreenShake(14, 0.2);
  }

  function updateLineAttack(enemy, player, dt) {
    if (!enemy.lineAttackActive) return;
    enemy.lineAttackTimer -= dt;
    if (enemy.lineAttackTimer <= 0) {
      enemy.lineAttackActive = false;
      return;
    }
    if (enemy.lineAttackHit) return;
    const ox = enemy.lineAttackOriginX;
    const oy = enemy.lineAttackOriginY;
    const dx = enemy.lineAttackDirX;
    const dy = enemy.lineAttackDirY;
    const px = player.x - ox;
    const py = player.y - 20 - oy;
    const dot = px * dx + py * dy;
    if (dot < 0 || dot > enemy.lineAttackRange) return;
    const cross = Math.abs(px * dy - py * dx);
    if (cross > enemy.lineAttackWidth + player.radius) return;
    enemy.lineAttackHit = true;
    damagePlayer(enemy.lineAttackDamage, enemy);
    addEffect("hit", player.x, player.y - 20, enemy.rankInfo.color);
    addEffect("bossSmash", player.x, player.y - 12, COLORS.red, Math.atan2(dy, dx));
    triggerScreenShake(18, 0.25);
  }

  function throwBombs(enemy, profile) {
    const game = state.game;
    const player = game.player;
    const count = profile.bombCount || 3;
    const fuseTime = profile.bombFuseTime || 1.5;
    const blastRadius = profile.bombBlastRadius || 52;
    const damage = profile.bombDamage || enemy.damage;
    const originX = enemy.x;
    const originY = enemy.y - 60;
    for (let i = 0; i < count; i++) {
      const spread = 60 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      const targetX = clamp(player.x + Math.cos(angle) * spread, BOSS_BOUNDS.left + 30, BOSS_BOUNDS.right - 30);
      const targetY = clamp(player.y + Math.sin(angle) * spread * 0.6, BOSS_BOUNDS.top + 20, BOSS_BOUNDS.bottom - 20);
      game.bombs.push({
        id: cryptoRandomId(),
        originX, originY,
        targetX, targetY,
        x: originX, y: originY,
        flyTime: 0,
        flyDuration: 0.35 + i * 0.1,
        landed: false,
        fuseTimer: fuseTime + i * 0.2,
        blastRadius,
        damage,
        color: enemy.rankInfo.color,
        exploded: false,
      });
    }
    addEffect("bossSmash", originX, originY, enemy.rankInfo.color, 0);
  }

  function updateBombs(dt) {
    const game = state.game;
    const player = game.player;
    for (const bomb of game.bombs) {
      if (bomb.exploded) continue;
      if (!bomb.landed) {
        bomb.flyTime += dt;
        const t = clamp(bomb.flyTime / bomb.flyDuration, 0, 1);
        bomb.x = bomb.originX + (bomb.targetX - bomb.originX) * t;
        bomb.y = bomb.originY + (bomb.targetY - bomb.originY) * t - Math.sin(t * Math.PI) * 120;
        if (t >= 1) {
          bomb.landed = true;
          bomb.x = bomb.targetX;
          bomb.y = bomb.targetY;
          addEffect("burst", bomb.x, bomb.y, bomb.color);
          triggerScreenShake(6, 0.08);
        }
        continue;
      }
      bomb.fuseTimer -= dt;
      if (bomb.fuseTimer <= 0) {
        bomb.exploded = true;
        const dx = player.x - bomb.x;
        const dy = (player.y - 20) - bomb.y;
        const dist = Math.hypot(dx, dy);
        if (dist < bomb.blastRadius + player.radius) {
          damagePlayer(bomb.damage, { x: bomb.x, y: bomb.y });
          addEffect("hit", player.x, player.y - 20, COLORS.red);
          triggerScreenShake(20, 0.25);
        }
        addEffect("bossShockwave", bomb.x, bomb.y, bomb.color, 0);
        addEffect("burst", bomb.x, bomb.y, COLORS.red);
        addEffect("burst", bomb.x, bomb.y - 8, bomb.color);
      }
    }
    game.bombs = game.bombs.filter(b => !b.exploded);
  }

  function getEnemyMovement(enemy, nx, ny, distance) {
    const tangentX = -ny * enemy.strafeDir;
    const tangentY = nx * enemy.strafeDir;
    const pulse = Math.sin(performance.now() / 420 + enemy.movePhase);
    const stopDistance = 44 + enemy.rank * 5;
    let x = nx;
    let y = ny;
    let accel = 2.5;
    let intent = distance > stopDistance ? 1 : 0;

    if (enemy.boss) {
      const keepRange = enemy.attackKind === "melee" ? 132 : 220;
      const tooClose = distance < 92;
      x = tooClose ? -nx * 0.45 + tangentX * 0.28 : distance > keepRange ? nx * 0.74 + tangentX * 0.18 : tangentX * 0.32 + nx * 0.08 * pulse;
      y = tooClose ? -ny * 0.45 + tangentY * 0.28 : distance > keepRange ? ny * 0.74 + tangentY * 0.18 : tangentY * 0.32 + ny * 0.08 * pulse;
      accel = distance > 260 ? 2.25 : 1.45;
      intent = distance > keepRange + 18 || tooClose ? 1 : 0.32;
    } else if (isRangedEnemy(enemy)) {
      const keepRange = 236;
      const tooClose = distance < 132;
      x = tooClose ? -nx * 0.95 + tangentX * 0.35 : distance > keepRange ? nx * 0.48 + tangentX * 0.46 : tangentX * 0.78 + nx * 0.12 * pulse;
      y = tooClose ? -ny * 0.95 + tangentY * 0.35 : distance > keepRange ? ny * 0.48 + tangentY * 0.46 : tangentY * 0.78 + ny * 0.12 * pulse;
      accel = tooClose ? 3.05 : 2.45;
      intent = tooClose || distance > keepRange + 24 ? 1 : 0.46;
    } else if (enemy.rank === 1) {
      x = nx * 0.82 + tangentX * 0.28 * pulse;
      y = ny * 0.82 + tangentY * 0.28 * pulse;
      accel = 1.9;
      intent = distance > stopDistance + 10 ? 1 : 0.25;
    } else if (enemy.rank === 2) {
      const keepRange = 78;
      x = distance > keepRange ? nx : -nx * 0.25;
      y = distance > keepRange ? ny : -ny * 0.25;
      x += tangentX * 0.24;
      y += tangentY * 0.24;
      accel = 2.2;
      intent = distance > stopDistance ? 1 : 0.38;
    } else if (enemy.rank === 3) {
      x = nx * 0.72 + tangentX * 0.62;
      y = ny * 0.72 + tangentY * 0.62;
      accel = 2.65;
      intent = distance > stopDistance ? 1 : 0.6;
    } else if (enemy.rank === 5) {
      x = nx * 0.5 + tangentX * 0.42 * Math.sign(pulse || 1);
      y = ny * 0.5 + tangentY * 0.42 * Math.sign(pulse || 1);
      accel = 1.75;
      intent = distance > stopDistance + 14 ? 1 : 0.3;
    } else {
      x = nx * 0.88 + tangentX * 0.2 * pulse;
      y = ny * 0.88 + tangentY * 0.2 * pulse;
      accel = 2.05;
      intent = distance > stopDistance + 4 ? 1 : 0.45;
    }

    const length = Math.max(1, Math.hypot(x, y));
    return { x: x / length, y: y / length, accel, intent };
  }

  function applyEnemySeparation(enemy, dt) {
    for (const other of state.game.enemies) {
      if (other === enemy) continue;
      const dx = enemy.x - other.x;
      const dy = enemy.y - other.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const minDistance = enemy.radius + other.radius + 8;
      if (distance >= minDistance) continue;
      const force = (minDistance - distance) / minDistance;
      enemy.vx += (dx / distance) * force * 260 * dt;
      enemy.vy += (dy / distance) * force * 180 * dt;
    }
  }

  function resolveActorOverlaps(actors) {
    for (let i = 0; i < actors.length; i += 1) {
      for (let j = i + 1; j < actors.length; j += 1) {
        const a = actors[i];
        const b = actors[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const minDistance = a.radius + b.radius + 6;
        if (distance >= minDistance) continue;
        const push = (minDistance - distance) * 0.5;
        const px = (dx / distance) * push;
        const py = (dy / distance) * push;
        a.x -= px;
        a.y -= py;
        b.x += px;
        b.y += py;
        keepActorInBounds(a, a.boss ? BOSS_BOUNDS : ENEMY_BOUNDS);
        keepActorInBounds(b, b.boss ? BOSS_BOUNDS : ENEMY_BOUNDS);
      }
    }
  }

  function keepActorInBounds(actor, bounds) {
    const nextX = clamp(actor.x, bounds.minX, bounds.maxX);
    const nextY = clamp(actor.y, bounds.minY, bounds.maxY);
    if (nextX !== actor.x) {
      actor.x = nextX;
      if (Number.isFinite(actor.vx)) actor.vx = 0;
    }
    if (nextY !== actor.y) {
      actor.y = nextY;
      if (Number.isFinite(actor.vy)) actor.vy = 0;
    }
  }

  function updateProjectiles(dt) {
    const game = state.game;
    const player = game.player;
    for (const projectile of game.projectiles) {
      projectile.age += dt;
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.spin += projectile.spinSpeed * dt;
      if (projectile.fromPlayer) {
        for (const enemy of game.enemies) {
          if (enemy.hp <= 0) continue;
          const eDist = Math.hypot(projectile.x - enemy.x, projectile.y - (enemy.y - 22));
          if (eDist < enemy.radius + projectile.radius) {
            const dmg = Math.max(1, Math.round(projectile.damage));
            enemy.hp -= dmg;
            enemy.hurt = enemy.boss ? 0.18 : 0.32;
            enemy.vx += projectile.dirX * (enemy.boss ? 90 : 220);
            enemy.vy += projectile.dirY * (enemy.boss ? 60 : 140);
            addFloater(`-${dmg}`, enemy.x, enemy.y - 46, COLORS.gold, 0.6);
            addEffect("playerSlashImpact", enemy.x, enemy.y - 28, COLORS.gold, Math.atan2(projectile.dirY, projectile.dirX));
            addEffect("burst", enemy.x, enemy.y - 22, COLORS.gold);
            projectile.hit = true;
            if (enemy.hp <= 0) defeatEnemy(enemy);
            break;
          }
        }
        continue;
      }
      const bodyY = player.y - 22;
      const distance = Math.hypot(projectile.x - player.x, projectile.y - bodyY);
      if (distance < player.radius + projectile.radius) {
        if (player.blockTimer > 0 && player.blockJustStarted <= BLOCK_PERFECT_WINDOW && player.invuln <= 0) {
          // Perfect-block reflect: reverse velocity, mark as player-owned, boost damage.
          projectile.vx = -projectile.vx * 1.4;
          projectile.vy = -projectile.vy * 1.4;
          projectile.dirX = -projectile.dirX;
          projectile.dirY = -projectile.dirY;
          projectile.fromPlayer = true;
          projectile.damage = Math.round(projectile.damage * 1.6);
          addFloater("反弹!", player.x, player.y - 58, COLORS.gold, 0.9);
          addEffect("guardFlash", player.x, player.y - 28, COLORS.gold);
          addEffect("burst", player.x, player.y - 24, COLORS.gold);
          triggerScreenShake(8, 0.12);
          player.invuln = 0.3;
          player.blockCooldown = 0;
          player.blockTimer = 0;
          player.blockWasActive = false;
          continue;
        }
        projectile.hit = true;
        damagePlayer(projectile.damage, {
          x: projectile.x - projectile.dirX * 46,
          y: projectile.y - projectile.dirY * 34,
        });
        const isBossProjectile = projectile.kind === "bossAxe" || projectile.kind === "swordWave";
        addEffect(isBossProjectile ? "bossShockwave" : "shurikenHit", player.x, bodyY, projectile.color, Math.atan2(projectile.dirY, projectile.dirX));
        if (isBossProjectile) {
          triggerScreenShake(16, 0.2);
        }
      }
    }
    game.projectiles = game.projectiles.filter((projectile) => (
      !projectile.hit
      && projectile.life > 0
      && projectile.x > -90
      && projectile.x < WIDTH + 90
      && projectile.y > 110
      && projectile.y < HEIGHT + 50
    ));
  }

  function updateDrops(dt) {
    const game = state.game;
    const player = game.player;
    for (const drop of game.drops) {
      drop.life -= dt;
      drop.bob += dt * 5;
      if (Math.hypot(drop.x - player.x, drop.y - player.y) < player.radius + 18) {
        collectDrop(drop);
        drop.collected = true;
      }
    }
    game.drops = game.drops.filter((drop) => !drop.collected && drop.life > 0);
  }

  function updateShrines(dt) {
    const game = state.game;
    if (!game.shrines || game.shrines.length === 0) return;
    for (const shrine of game.shrines) {
      shrine.hurt = Math.max(0, shrine.hurt - dt);
    }
  }

  function damageShrine(shrine, damage) {
    if (!shrine || shrine.destroyed) return;
    const dealt = Math.max(1, Math.round(damage));
    shrine.hp -= dealt;
    shrine.hurt = 0.32;
    addFloater(`-${dealt}`, shrine.x, shrine.y - 36, "#a3aabe", 0.5);
    addEffect("hit", shrine.x, shrine.y - 6, "#caa473");
    if (shrine.hp <= 0) {
      breakShrine(shrine);
    }
  }

  function breakShrine(shrine) {
    const game = state.game;
    shrine.destroyed = true;
    shrine.hurt = 0;
    addFloater("神龛破！", shrine.x, shrine.y - 60, COLORS.gold, 1);
    addEffect("burst", shrine.x, shrine.y - 8, "#dcc88f");
    addEffect("specialAura", shrine.x, shrine.y - 8, COLORS.gold);
    triggerScreenShake(14, 0.22);
    game.drops.push({ type: "dango", x: shrine.x, y: shrine.y, life: 14, bob: 0 });
    addFloater("回血!", shrine.x, shrine.y - 80, COLORS.green, 0.85);
  }

  function damagePlayer(amount, enemy) {
    const game = state.game;
    const player = game.player;
    if (player.invuln > 0) return;
    if (player.shields > 0) {
      player.shields -= 1;
      player.invuln = 0.4;
      addFloater("御守", player.x, player.y - 58, COLORS.blue, 0.8);
      addEffect("guardFlash", player.x, player.y - 28, COLORS.blue);
      return;
    }
    let blockMult = 1;
    let blockKnock = 1;
    if (player.blockTimer > 0) {
      const perfect = player.blockJustStarted <= BLOCK_PERFECT_WINDOW;
      if (perfect) {
        addFloater("完美格挡!", player.x, player.y - 58, COLORS.gold, 0.95);
        addEffect("guardFlash", player.x, player.y - 28, COLORS.gold);
        addEffect("burst", player.x, player.y - 24, COLORS.gold);
        triggerScreenShake(8, 0.12);
        player.invuln = 0.3;
        player.blockCooldown = 0;
        player.blockTimer = 0;
        player.blockWasActive = false;
        applyBlockStagger(enemy, 0.9);
        return;
      }
      blockMult = 0.5;
      blockKnock = 0.5;
      addFloater("格挡", player.x, player.y - 58, COLORS.blue, 0.7);
      addEffect("guardFlash", player.x, player.y - 28, COLORS.blue);
      applyBlockStagger(enemy, 0.35);
    }
    const damage = Math.max(1, Math.ceil(amount * game.damageTakenMult * blockMult));
    player.hp -= damage;
    player.hurt = 0.38;
    player.invuln = 0.55;
    const ex = enemy && Number.isFinite(enemy.x) ? enemy.x : player.x;
    const ey = enemy && Number.isFinite(enemy.y) ? enemy.y : player.y;
    const pushDistance = Math.max(1, Math.hypot(player.x - ex, player.y - ey));
    const pushX = (player.x - ex) / pushDistance;
    const pushY = (player.y - ey) / pushDistance;
    player.x += pushX * 16 * blockKnock;
    player.y += pushY * 10 * blockKnock;
    keepActorInBounds(player, PLAYER_BOUNDS);
    triggerScreenShake(blockMult < 1 ? 9 : 15, 0.18);
    addEffect("playerHit", player.x, player.y - 32, blockMult < 1 ? COLORS.blue : COLORS.red, Math.atan2(pushY, pushX));
    addEffect("impactRing", player.x, player.y - 26, blockMult < 1 ? COLORS.blue : COLORS.red);
    addFloater(`-${damage}`, player.x, player.y - 52, blockMult < 1 ? COLORS.blue : COLORS.red, 0.65);
  }

  function attackWithPlayer(target) {
    const game = state.game;
    if (!game || state.scene !== "playing") return;
    const player = game.player;
    if (player.attackCooldown > 0) return;
    if (player.blockTimer > 0) return;
    if (player.comboWindow <= 0) player.attackStep = 0;
    const combo = ATTACK_COMBO[player.attackStep];
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      setPlayerAim(player, dx / distance, dy / distance);
    } else if (!state.pointer.active) {
      const nearest = findNearestEnemy(player, 190);
      if (nearest) {
        setPlayerAim(player, nearest.x - player.x, nearest.y - player.y);
      }
    }
    const baseCd = Math.max(0.18, player.role.cooldown - game.rebelLevel * 0.015);
    player.attackCooldown = baseCd * combo.cooldownMult;
    player.attackDirX = player.aimX;
    player.attackDirY = player.aimY;
    player.attackDuration = combo.duration;
    player.attackTimer = combo.duration;
    player.attackComboStep = player.attackStep;
    const range = (player.role.range + game.rangeBonus) * combo.rangeMult;
    const damageMult = combo.damageMult;
    let hitCount = 0;
    for (const enemy of game.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      const dot = (dx * player.aimX + dy * player.aimY) / Math.max(1, distance);
      if (distance <= range + enemy.radius && dot > combo.cone) {
        hitEnemy(enemy, player, distance, damageMult);
        hitCount += 1;
      }
    }
    if (game.shrines) {
      for (const shrine of game.shrines) {
        if (shrine.destroyed) continue;
        const dx = shrine.x - player.x;
        const dy = shrine.y - player.y;
        const distance = Math.hypot(dx, dy);
        const dot = (dx * player.aimX + dy * player.aimY) / Math.max(1, distance);
        if (distance <= range + shrine.radius && dot > combo.cone) {
          damageShrine(shrine, player.role.attack * game.attackMult * damageMult * 0.6);
          hitCount += 1;
        }
      }
    }
    const sx = player.x + player.attackDirX * 45;
    const sy = player.y + player.attackDirY * 28 - 18;
    addEffect(hitCount > 0 ? "slash" : "swing", sx, sy, player.role.color, Math.atan2(player.attackDirY, player.attackDirX));

    if (player.attackStep === ATTACK_COMBO.length - 1) {
      // Finisher: forward lunge + extra screen shake + burst flourish
      player.x += player.attackDirX * 14;
      player.y += player.attackDirY * 8;
      keepActorInBounds(player, PLAYER_BOUNDS);
      addEffect("burst", sx, sy, COLORS.gold);
      addEffect("impactRing", player.x, player.y - 22, player.role.color);
      triggerScreenShake(12, 0.18);
      player.comboWindow = 0;
      player.attackStep = 0;
    } else {
      player.comboWindow = COMBO_WINDOW;
      player.attackStep += 1;
    }
  }

  function useSpecialSkill() {
    const game = state.game;
    if (!game || state.scene !== "playing") return;
    const player = game.player;
    if (player.specialCooldown > 0 || player.hp <= 0 || game.bossIntroTimer > 0) return;
    player.specialCooldown = player.specialMaxCooldown;
    if (player.role.id === "chiikawa") {
      useChiikawaSpecial(game, player);
    } else if (player.role.id === "hachiware") {
      useHachiwareSpecial(game, player);
    } else {
      useUsagiSpecial(game, player);
    }
  }

  function useChiikawaSpecial(game, player) {
    player.hp = Math.min(player.maxHp, player.hp + 28);
    player.invuln = Math.max(player.invuln, 1.1);
    player.shields += 1;
    addFloater("勇气护身", player.x, player.y - 74, player.role.color, 0.95);
    addEffect("guardFlash", player.x, player.y - 26, player.role.color);
    addEffect("impactRing", player.x, player.y - 20, player.role.color);
    addEffect("chiikawaGuard", player.x, player.y - 28, player.role.color);
    addEffect("specialAura", player.x, player.y - 28, player.role.color);
    triggerScreenShake(10, 0.16);
  }

  function useHachiwareSpecial(game, player) {
    let hitCount = 0;
    const radius = 210 + game.rangeBonus * 0.9;
    const stunDuration = 1.8;
    for (const enemy of [...game.enemies]) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > radius + enemy.radius) continue;
      const damage = Math.round((22 + player.role.attack * 0.72) * game.attackMult);
      enemy.hp -= damage;
      enemy.hurt = 0.5;
      const dist = Math.max(1, distance);
      const knockX = (dx / dist);
      const knockY = (dy / dist);
      if (enemy.boss) {
        enemy.recoveryTimer = Math.max(enemy.recoveryTimer || 0, 0.55);
        enemy.bossStunTimer = Math.max(enemy.bossStunTimer || 0, 0.6);
        enemy.vx += knockX * 140;
        enemy.vy += knockY * 90;
      } else {
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, stunDuration);
        enemy.recoveryTimer = Math.max(enemy.recoveryTimer || 0, stunDuration);
        enemy.attackTimer = 0;
        enemy.attackHitDone = true;
        enemy.cooldown = Math.max(enemy.cooldown || 0, stunDuration + 0.3);
        if (enemy.chargeState && enemy.chargeState !== "idle") {
          enemy.chargeState = "idle";
          enemy.chargeTimer = 0;
        }
        enemy.vx += knockX * 320;
        enemy.vy += knockY * 200;
      }
      hitCount += 1;
      addFloater(`-${damage}`, enemy.x, enemy.y - 48, COLORS.blue, 0.6);
      addEffect("hit", enemy.x, enemy.y - 30, COLORS.blue);
      if (enemy.hp <= 0) defeatEnemy(enemy);
    }
    if (game.shrines) {
      for (const shrine of [...game.shrines]) {
        if (shrine.destroyed) continue;
        const dx = shrine.x - player.x;
        const dy = shrine.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius + shrine.radius) continue;
        const damage = Math.round((22 + player.role.attack * 0.72) * game.attackMult * 0.7);
        damageShrine(shrine, damage);
      }
    }
    addFloater(hitCount > 0 ? "友情震波!" : "友情鼓舞", player.x, player.y - 74, COLORS.blue, 0.9);
    addEffect("hachiwareBlast", player.x, player.y - 28, COLORS.blue);
    addEffect("hachiwareChord", player.x, player.y - 30, COLORS.blue);
    addEffect("specialAura", player.x, player.y - 26, COLORS.blue);
    addEffect("bossShockwave", player.x, player.y - 24, COLORS.blue);
    addEffect("impactRing", player.x, player.y - 18, COLORS.blue);
    addEffect("burst", player.x, player.y - 24, COLORS.gold);
    triggerScreenShake(hitCount > 0 ? 22 : 10, 0.28);
  }

  function useUsagiSpecial(game, player) {
    const dashDistance = 108;
    player.x += player.aimX * dashDistance;
    player.y += player.aimY * dashDistance * 0.72;
    keepActorInBounds(player, PLAYER_BOUNDS);
    let hitCount = 0;
    const radius = 116 + game.rangeBonus;
    for (const enemy of [...game.enemies]) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > radius + enemy.radius) continue;
      const damage = Math.round((34 + player.role.attack * 0.88) * game.attackMult);
      enemy.hp -= damage;
      enemy.hurt = 0.38;
      enemy.vx += dx / Math.max(1, distance) * 340;
      enemy.vy += dy / Math.max(1, distance) * 210;
      hitCount += 1;
      addFloater(`-${damage}`, enemy.x, enemy.y - 48, COLORS.gold, 0.62);
      addEffect("slash", enemy.x, enemy.y - 32, COLORS.gold, Math.atan2(dy, dx));
      if (enemy.hp <= 0) defeatEnemy(enemy);
    }
    addFloater("YA-HA-!!", player.x, player.y - 74, COLORS.gold, 0.95);
    addEffect("usagiBurst", player.x, player.y - 28, COLORS.gold, Math.atan2(player.aimY, player.aimX));
    addEffect("specialAura", player.x, player.y - 24, COLORS.gold);
    addEffect("bossShockwave", player.x, player.y - 22, COLORS.gold);
    triggerScreenShake(hitCount > 0 ? 18 : 10, 0.2);
  }

  function findNearestEnemy(player, maxDistance) {
    let nearest = null;
    let bestDistance = maxDistance;
    for (const enemy of state.game.enemies) {
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = enemy;
      }
    }
    return nearest;
  }

  function hitEnemy(enemy, player, distance, comboMult = 1) {
    const game = state.game;
    const highRankBonus = enemy.rank > player.rank ? 1 + game.rebelLevel * 0.16 + (enemy.rank - player.rank) * 0.06 : 1;
    const openingBonus = getEnemyOpeningDamageMultiplier(enemy);
    const damage = Math.round(player.role.attack * game.attackMult * highRankBonus * openingBonus * comboMult);
    enemy.hp -= damage;
    enemy.hurt = enemy.boss ? 0.18 : 0.25;
    const knockback = enemy.boss ? 0.22 : 1;
    enemy.vx += (enemy.x - player.x) / Math.max(1, distance) * 260 * knockback;
    enemy.vy += (enemy.y - player.y) / Math.max(1, distance) * 160 * knockback;
    if (openingBonus > 1.1 && !enemy.boss) {
      addFloater("破绽!", enemy.x, enemy.y - 68, COLORS.red, 0.7);
    }
    addFloater(`-${damage}`, enemy.x, enemy.y - 46, COLORS.ink, 0.55);
    addEffect("playerSlashImpact", enemy.x, enemy.y - 32, player.role.color, Math.atan2(enemy.y - player.y, enemy.x - player.x));
    if (enemy.hp > 0) {
      triggerScreenShake(openingBonus > 1.1 ? 9 : 5, 0.08);
    }
    if (enemy.hp <= 0) {
      defeatEnemy(enemy);
    }
  }

  function getEnemyOpeningDamageMultiplier(enemy) {
    const vulnerable = (enemy.staggerTimer || 0) > 0;
    if (enemy.boss) return vulnerable ? 1.9 : 0.85;
    if (vulnerable) return enemy.rank >= 4 ? 1.65 : enemy.rank >= 3 ? 1.42 : 1.18;
    if (enemy.rank >= 4) return 0.92;
    if (enemy.rank === 3) return 0.96;
    return 1;
  }

  function applyBlockStagger(enemy, duration) {
    if (!enemy || enemy.recoveryTimer === undefined) return;
    enemy.staggerTimer = Math.max(enemy.staggerTimer || 0, duration);
    enemy.recoveryTimer = Math.max(enemy.recoveryTimer || 0, duration);
    enemy.attackTimer = 0;
    enemy.attackHitDone = true;
    if (enemy.chargeState && enemy.chargeState !== "idle") {
      enemy.chargeState = "idle";
      enemy.chargeTimer = 0;
    }
    addFloater("破绽!", enemy.x, enemy.y - 60, COLORS.red, 0.65);
  }

  function defeatEnemy(enemy) {
    const game = state.game;
    if (enemy.boss && enemy.bossPhase < enemy.bossPhaseMax) {
      enterBossNextPhase(enemy);
      return;
    }
    const player = game.player;
    const multiplier = calculateMultiplier(player.rank, enemy.rank);
    const points = Math.round(enemy.rankInfo.score * multiplier * game.scoreMult);
    game.score += points;
    game.kills += 1;
    game.bestDefeatRank = Math.max(game.bestDefeatRank, enemy.rank);
    game.highestMultiplier = Math.max(game.highestMultiplier, multiplier);
    game.enemies = game.enemies.filter((item) => item.id !== enemy.id);
    addFloater(`+${points}`, enemy.x, enemy.y - 62, enemy.rankInfo.color, 0.85);
    addEffect("burst", enemy.x, enemy.y - 18, enemy.rankInfo.color);
    if (enemy.boss) {
      game.bossDefeated = true;
      game.victoryTimer = 1.45;
      game.projectiles = [];
      game.bombs = [];
      const defeatLabel = enemy.momongaBoss ? "飞鼠讨伐!" : "大将讨取";
      addFloater(defeatLabel, enemy.x, enemy.y - 132, COLORS.gold, 1.25);
      addEffect("bossDefeat", enemy.x, enemy.y - 74, COLORS.gold);
      triggerScreenShake(28, 0.5);
      return;
    }
    maybeDropItem(enemy);
  }

  function enterBossNextPhase(boss) {
    boss.bossPhase += 1;
    boss.hp = boss.phaseMaxHp;
    boss.attackTimer = 0;
    boss.attackHitDone = true;
    boss.recoveryTimer = 1.1;
    boss.cooldown = Math.max(boss.cooldown, 1.5);
    boss.hurt = 0.4;
    boss.chargeState = "idle";
    boss.bossChargeState = "idle";
    boss.bossChargeTimer = 0;
    boss.bossStunTimer = 0;
    boss.bossChargeCooldown = 4 + Math.random() * 2.5;
    boss.vx = 0;
    boss.vy = 0;
    if (boss.momongaBoss) {
      boss.glideState = "idle";
      boss.glideTimer = 0;
      boss.glideCooldown = 3 + Math.random() * 2;
      boss.speed += 12;
      boss.damage += 3;
      addFloater("第二段！", boss.x, boss.y - 130, "#7b6bbd", 1.4);
      addEffect("bossShockwave", boss.x, boss.y - 36, "#7b6bbd");
      addEffect("burst", boss.x, boss.y - 24, COLORS.gold);
      addEffect("specialAura", boss.x, boss.y - 30, "#7b6bbd");
      triggerScreenShake(20, 0.35);
      spawnMomongaMinions();
    } else {
      boss.lineAttackActive = false;
      addFloater("第二段！", boss.x, boss.y - 158, COLORS.red, 1.4);
      addEffect("bossShockwave", boss.x, boss.y - 36, COLORS.red);
      addEffect("burst", boss.x, boss.y - 24, COLORS.gold);
      addEffect("specialAura", boss.x, boss.y - 30, COLORS.red);
      triggerScreenShake(24, 0.42);
      spawnShogunSwordWave(boss);
      spawnBossMinions();
    }
  }

  function spawnShogunSwordWave(boss) {
    const game = state.game;
    const ox = boss.x;
    const oy = boss.y - 70;
    const speed = 280;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      game.projectiles.push({
        id: cryptoRandomId(),
        kind: "swordWave",
        x: ox + dx * 40,
        y: oy + dy * 30,
        vx: dx * speed,
        vy: dy * speed * 0.76,
        dirX: dx,
        dirY: dy,
        radius: 18,
        damage: boss.damage + 6,
        color: COLORS.red,
        age: 0,
        life: 2.2,
        maxLife: 2.2,
        spin: angle,
        spinSpeed: 12,
        hit: false,
      });
    }
    addEffect("bossShockwave", ox, oy, COLORS.red, 0);
    addEffect("burst", ox, oy, COLORS.gold);
    triggerScreenShake(18, 0.3);
  }

  const BOSS_MINION_RANK_POOL = [2, 3, 4];

  function spawnBossMinions() {
    const game = state.game;
    const guaranteedIndex = Math.random() < 0.5 ? 0 : 1;
    const boss = game.boss;
    const anchorX = boss ? boss.x : WIDTH / 2;
    const anchorY = boss ? boss.y : 320;
    const sideOffset = 130 + Math.random() * 30;
    const positions = [
      { x: anchorX - sideOffset, y: anchorY + (Math.random() * 60 - 30) },
      { x: anchorX + sideOffset, y: anchorY + (Math.random() * 60 - 30) },
    ];
    positions.forEach((pos, i) => {
      const rank = BOSS_MINION_RANK_POOL[Math.floor(Math.random() * BOSS_MINION_RANK_POOL.length)];
      const minion = createEnemy(rank);
      minion.x = clamp(pos.x, ENEMY_BOUNDS.minX + 24, ENEMY_BOUNDS.maxX - 24);
      minion.y = clamp(pos.y, ENEMY_BOUNDS.minY, ENEMY_BOUNDS.maxY);
      minion.vx = 0;
      minion.vy = 0;
      minion.bossMinion = true;
      minion.guaranteedHealDrop = i === guaranteedIndex;
      game.enemies.push(minion);
      addEffect("burst", minion.x, minion.y - 20, minion.rankInfo.color);
    });
    addFloater("援军参上！", WIDTH / 2, 188, RANKS[2].color, 1.1);
  }

  function spawnMomongaMinions() {
    const game = state.game;
    const boss = game.boss;
    const anchorX = boss ? boss.x : WIDTH / 2;
    const anchorY = boss ? boss.y : 300;
    const positions = [
      { x: anchorX - 120, y: anchorY + 40 },
      { x: anchorX + 120, y: anchorY + 40 },
    ];
    positions.forEach((pos, i) => {
      const rank = i === 0 ? 1 : 2;
      const minion = createEnemy(rank);
      minion.x = clamp(pos.x, ENEMY_BOUNDS.minX + 24, ENEMY_BOUNDS.maxX - 24);
      minion.y = clamp(pos.y, ENEMY_BOUNDS.minY, ENEMY_BOUNDS.maxY);
      minion.vx = 0;
      minion.vy = 0;
      minion.bossMinion = true;
      minion.guaranteedHealDrop = i === 0;
      game.enemies.push(minion);
      addEffect("burst", minion.x, minion.y - 20, minion.rankInfo.color);
    });
    addFloater("手下参上！", WIDTH / 2, 188, RANKS[0].color, 1.0);
  }

  function calculateMultiplier(playerRank, enemyRank) {
    if (enemyRank > playerRank) {
      return 1 + (enemyRank - playerRank) * 0.72 + state.game.rebelLevel * 0.18;
    }
    if (enemyRank === playerRank) return 1;
    return 0.42;
  }

  function maybeDropItem(enemy) {
    const game = state.game;
    if (enemy.guaranteedHealDrop) {
      game.drops.push({ type: "dango", x: enemy.x, y: enemy.y, life: 12, bob: Math.random() * 10 });
      addFloater("回血!", enemy.x, enemy.y - 70, COLORS.green, 0.85);
      return;
    }
    const chance = 0.42 + Math.min(0.25, enemy.rank * 0.05);
    if (Math.random() > chance) return;
    const table = [
      { type: "dango", weight: 22 },
      { type: "coin", weight: 34 },
      { type: "sandal", weight: 16 },
      { type: "guard", weight: 14 },
      { type: "rebel", weight: 10 + enemy.rank * 2 },
    ];
    const type = weightedPick(table);
    game.drops.push({ type, x: enemy.x, y: enemy.y, life: 10, bob: Math.random() * 10 });
  }

  function collectDrop(drop) {
    const game = state.game;
    const player = game.player;
    if (drop.type === "dango") {
      player.hp = Math.min(player.maxHp, player.hp + 24);
      addFloater("团子", player.x, player.y - 56, COLORS.green, 0.75);
    }
    if (drop.type === "coin") {
      game.score += Math.round(120 * game.scoreMult);
      addFloater("小判 +120", player.x, player.y - 56, COLORS.gold, 0.75);
    }
    if (drop.type === "sandal") {
      player.speedBuff = 4.5;
      addFloater("草鞋", player.x, player.y - 56, COLORS.blue, 0.75);
    }
    if (drop.type === "guard") {
      player.shields += 1;
      addFloater("御守", player.x, player.y - 56, COLORS.blue, 0.75);
    }
    if (drop.type === "rebel") {
      game.rebelLevel += 1;
      addFloater("反骨", player.x, player.y - 56, COLORS.red, 0.75);
    }
  }

  function weightedPick(items) {
    const sum = items.reduce((total, item) => total + item.weight, 0);
    let roll = Math.random() * sum;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item.type;
    }
    return items[0].type;
  }

  function tryStartBlock() {
    const game = state.game;
    if (!game || state.scene !== "playing") return;
    const player = game.player;
    if (player.hp <= 0 || game.bossIntroTimer > 0) return;
    if (player.blockTimer > 0 || player.blockCooldown > 0) return;
    if (player.dashTime > 0 || player.attackTimer > 0) return;
    player.blockTimer = BLOCK_DURATION;
    player.blockJustStarted = 0;
    player.blockWasActive = true;
    addEffect("guardFlash", player.x, player.y - 28, COLORS.blue);
  }

  function dashPlayer() {
    const game = state.game;
    if (!game || state.scene !== "playing") return;
    const player = game.player;
    if (player.dashCharges <= 0 || player.dashInputLock > 0) return;
    if (player.blockTimer > 0) return;
    const left = state.keys.has("a") || state.keys.has("arrowleft");
    const right = state.keys.has("d") || state.keys.has("arrowright");
    const up = state.keys.has("w") || state.keys.has("arrowup");
    const down = state.keys.has("s") || state.keys.has("arrowdown");
    let dx = (right ? 1 : 0) - (left ? 1 : 0);
    let dy = (down ? 1 : 0) - (up ? 1 : 0);
    if (Math.hypot(dx, dy) < 0.1) {
      dx = player.aimX || player.dirX || 1;
      dy = player.aimY || player.dirY || 0;
    }
    const length = Math.max(1, Math.hypot(dx, dy));
    dx /= length;
    dy /= length;

    player.dashCharges -= 1;
    player.dashInputLock = DASH_INPUT_LOCK;
    player.dashFromX = player.x;
    player.dashFromY = player.y;
    player.dashDirX = dx;
    player.dashDirY = dy;
    addEffect("dashLine", player.x - dx * 20, player.y - 10 - dy * 8, COLORS.blue, Math.atan2(dy, dx));
    player.x += dx * 92;
    player.y += dy * 58;
    keepActorInBounds(player, PLAYER_BOUNDS);
    setPlayerAim(player, dx, dy);
    player.dashTime = DASH_ANIMATION_TIME;
    player.invuln = Math.max(player.invuln, 0.32);
    addEffect("dashLine", player.x - dx * 16, player.y - 10 - dy * 6, COLORS.blue, Math.atan2(dy, dx));
  }

  function beginUpgrade(options = {}) {
    const game = state.game;
    if (game.elapsed >= game.duration) {
      finishGame("time");
      return;
    }
    const beforeBoss = Boolean(options.beforeBoss);
    game.pendingBossChoice = beforeBoss;
    if (beforeBoss) {
      game.bossChoiceOffered = true;
      const bossLabel = game.stage === 1 ? "BOSS战前抽卡" : "决战前抽卡";
      addFloater(bossLabel, WIDTH / 2, 88, COLORS.gold, 1.2);
    } else {
      const timeBonus = game.stage === 1 ? 30 : 40;
      game.duration += timeBonus;
      addFloater(`+${timeBonus}秒`, WIDTH / 2, 88, COLORS.blue, 1.2);
    }
    game.projectiles = [];
    game.bombs = [];
    state.scene = "upgrade";
    game.pendingUpgrades = pickUpgrades();
  }

  function pickUpgrades() {
    const pool = [...upgradePool];
    const picks = [];
    while (picks.length < 3 && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(index, 1)[0]);
    }
    return picks;
  }

  function chooseUpgrade(index) {
    const game = state.game;
    if (!game || state.scene !== "upgrade") return;
    const upgrade = game.pendingUpgrades[index];
    if (!upgrade) return;
    upgrade.apply(game);
    addFloater(upgrade.name, WIDTH / 2, 122, COLORS.red, 1);
    const shouldStartBoss = game.pendingBossChoice;
    game.pendingBossChoice = false;
    state.scene = "playing";
    if (shouldStartBoss) {
      beginBossStage();
    } else {
      spawnWave();
    }
    lastTime = performance.now();
  }

  function finishGame(reason) {
    const game = state.game;
    if (!game || game.resultSaved) return;
    game.reason = reason;
    game.resultSaved = true;
    const result = makeResult(game);
    if (reason === "lose") {
      result.rankingRevealAt = performance.now() + 1600;
    }
    saveRanking(result.entry);
    result.rank = getCombinedRankings().findIndex((item) => item.createdAt === result.entry.createdAt) + 1;
    state.result = result;
    state.scene = "result";
  }

  function makeResult(game) {
    const score = Math.round(game.score);
    const bestRank = game.bestDefeatRank >= 7
      ? { rank: 7, name: "飞鼠", color: "#7b6bbd" }
      : RANKS[game.bestDefeatRank - 1] || RANKS[RANKS.length - 1];
    const title = deriveTitle(game, score);
    const entry = {
      name: `${game.role.name}玩家-${String(Math.floor(Math.random() * 900) + 100)}`,
      score,
      title,
      bestDefeatRank: bestRank.name,
      createdAt: new Date().toISOString(),
    };
    return {
      entry,
      score,
      title,
      bestRank,
      highestMultiplier: game.highestMultiplier,
      kills: game.kills,
      reason: game.reason,
      rankingRevealAt: 0,
      rank: 0,
    };
  }

  function deriveTitle(game, score) {
    if (game.reason === "lose" && score < 800) return "下克上失败";
    if (game.reason === "boss") return "御殿制霸";
    if (game.bestDefeatRank >= 7) return "飞鼠猎人";
    if (game.bestDefeatRank >= 6 && game.role.rank <= 2) return "传说下克上";
    if (score >= 5600) return "天下级";
    if (game.bestDefeatRank >= 6) return "将军克星";
    if (game.bestDefeatRank >= 5) return "大名克星";
    if (game.bestDefeatRank >= 4) return "忍术破法";
    if (game.highestMultiplier >= 2.2) return "反骨达人";
    if (score >= 2200) return "御前新星";
    return "一揆见习";
  }

  function getLocalRankings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(RANKING_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter((item) => Number.isFinite(item.score)) : [];
    } catch {
      return [];
    }
  }

  function saveRanking(entry) {
    const local = getLocalRankings();
    local.push(entry);
    local.sort((a, b) => b.score - a.score);
    localStorage.setItem(RANKING_KEY, JSON.stringify(local.slice(0, 30)));
  }

  function getCombinedRankings() {
    return [...FAKE_RANKINGS, ...getLocalRankings()].sort((a, b) => b.score - a.score).slice(0, 10);
  }

  function addFloater(text, x, y, color = COLORS.ink, life = 0.7) {
    state.game.floaters.push({ text, x, y, color, life, maxLife: life });
  }

  function addEffect(type, x, y, color = COLORS.red, angle = 0) {
    const life = type === "burst" ? 0.48
      : type === "slash" || type === "swing" ? 0.7
        : type === "playerHit" || type === "impactRing" ? 0.38
          : type === "bossDefeat" ? 0.9
            : type === "bossSmash" || type === "bossShockwave" ? 0.52
              : type === "bossAxeThrow" ? 0.46
                : type === "specialAura" ? 0.86
                  : type === "usagiBurst" ? 0.58
                    : type === "hachiwareBlast" ? 0.95
                      : type === "hachiwareChord" ? 0.72
                        : type === "chiikawaGuard" ? 0.82
                        : type === "attackFlash" || type === "enemySpark" ? 0.34
                          : type === "shurikenThrow" || type === "shurikenHit" || type === "playerSlashImpact" ? 0.36
                            : 0.32;
    state.game.effects.push({ type, x, y, color, angle, age: 0, life });
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    state.buttons = [];
    if (state.scene === "loading") drawLoading();
    if (state.scene === "error") drawError();
    if (state.scene === "start") drawStart();
    if (state.scene === "select") drawSelect();
    if (state.scene === "playing") drawPlaying();
    if (state.scene === "upgrade") {
      drawPlaying();
      drawUpgrade();
    }
    if (state.scene === "stageTransition") drawStageTransition();
    if (state.scene === "result") drawResult();
    if (state.scene === "ranking") drawRanking();
  }

  function drawLoading() {
    drawSoftBackground();
    drawText("読み込み中", WIDTH / 2, HEIGHT / 2, 34, COLORS.ink, "center", "bold");
  }

  function drawError() {
    drawSoftBackground();
    drawText("素材加载失败", WIDTH / 2, HEIGHT / 2 - 22, 34, COLORS.red, "center", "bold");
    drawText(state.loadError, WIDTH / 2, HEIGHT / 2 + 24, 20, COLORS.ink, "center");
  }

  function drawSoftBackground(showEdo = false) {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#d9eef3");
    sky.addColorStop(0.52, "#fff4dd");
    sky.addColorStop(1, "#f7dccf");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(141,181,198,0.38)";
    drawHill(470, 188, 380, 115);
    drawHill(705, 184, 360, 120);
    if (showEdo) {
      drawEdoSkyline();
    }
    ctx.fillStyle = "#e8d7c9";
    ctx.fillRect(0, 168, WIDTH, HEIGHT - 168);
    ctx.fillStyle = "rgba(255,250,240,0.46)";
    ctx.fillRect(0, 160, WIDTH, 20);
    drawGroundMarks();
  }

  function drawWorldBackground() {
    if (state.game && state.game.arena === "castle") {
      if (state.images.castleInterior) {
        drawCoverImage(state.images.castleInterior);
        return;
      }
      drawCastleFallbackBackground();
      return;
    }
    if (state.game && state.game.stage === 1 && state.images.battleLevel1) {
      drawCoverImage(state.images.battleLevel1);
      return;
    }
    if (state.images.battleBackground) {
      drawCoverImage(state.images.battleBackground);
      return;
    }
    drawSoftBackground(true);
    drawBridge();
    drawStonePath();
    drawEdoStreetProps();
    drawImageAsset("house", 88, 46, 0.66);
    drawImageAsset("tree", 46, 56, 0.62);
    drawImageAsset("tree", WIDTH - 200, 54, 0.58);
    drawImageAsset("bush", 283, 143, 0.52);
    drawImageAsset("sign", WIDTH - 245, 214, 0.56);
    drawImageAsset("fence", WIDTH - 305, 294, 0.58);
  }

  function drawCoverImage(image) {
    const targetRatio = WIDTH / HEIGHT;
    const sourceRatio = image.width / image.height;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceRatio > targetRatio) {
      sw = image.height * targetRatio;
      sx = (image.width - sw) / 2;
    } else if (sourceRatio < targetRatio) {
      sh = image.width / targetRatio;
      sy = (image.height - sh) / 2;
    }

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
  }

  function drawCastleFallbackBackground() {
    const wood = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    wood.addColorStop(0, "#7b513c");
    wood.addColorStop(0.45, "#c38a57");
    wood.addColorStop(1, "#d6a16a");
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(67,54,56,0.24)";
    for (let x = 0; x < WIDTH; x += 84) {
      ctx.fillRect(x, 0, 6, HEIGHT);
    }
    ctx.fillStyle = "rgba(255,242,204,0.18)";
    ctx.fillRect(0, 170, WIDTH, 28);
    ctx.fillStyle = "rgba(96,58,42,0.32)";
    for (let y = 320; y < HEIGHT; y += 34) {
      ctx.fillRect(0, y, WIDTH, 3);
    }
  }

  function drawEdoSkyline() {
    ctx.save();
    ctx.globalAlpha = 0.2;
    drawCastleTower(846, 72, 0.66);
    drawCastleTower(702, 104, 0.38);
    drawPagoda(235, 103, 0.42);
    drawRoofRow(88, 139, 300, 0.42);
    drawRoofRow(792, 141, 260, 0.38);
    ctx.restore();
  }

  function drawCastleTower(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#aac6cf";
    ctx.strokeStyle = "rgba(67,54,56,0.2)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const w = 156 - i * 34;
      const h = 35;
      const yy = i * 38;
      ctx.fillRect(-w / 2, yy, w, h);
      ctx.strokeRect(-w / 2, yy, w, h);
      drawEdoRoof(-w / 2 - 20, yy - 12, w + 40, 25, "#7ea7b5");
    }
    ctx.restore();
  }

  function drawPagoda(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#b9cfd4";
    for (let i = 0; i < 4; i += 1) {
      const w = 118 - i * 18;
      const yy = i * 26;
      ctx.fillRect(-w / 2, yy, w, 20);
      drawEdoRoof(-w / 2 - 16, yy - 10, w + 32, 18, "#87acb8");
    }
    ctx.restore();
  }

  function drawRoofRow(x, y, width, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    for (let i = 0; i < 5; i += 1) {
      const rx = i * 72;
      ctx.fillStyle = "rgba(185,145,116,0.42)";
      ctx.fillRect(rx, 12, 62, 24);
      drawEdoRoof(rx - 8, 0, 78, 20, "rgba(114,142,148,0.66)");
    }
    ctx.restore();
  }

  function drawEdoRoof(x, y, w, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.6, x + w, y + h);
    ctx.lineTo(x + w - 10, y + h + 7);
    ctx.lineTo(x + 10, y + h + 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEdoStreetProps() {
    ctx.save();
    ctx.globalAlpha = 0.64;
    drawTorii(1062, 232, 0.56);
    drawMarketStall(900, 222, 0.48);
    drawMarketStall(310, 232, 0.42);
    drawNobori(958, 214, "下剋", "#b95145");
    drawNobori(1004, 224, "番付", "#5d8aa1");
    drawNobori(188, 222, "一揆", "#8aa879");
    drawLanternString(500, 184, 770, 174);
    drawLantern(576, 178, 0.36, "祭");
    drawLantern(636, 176, 0.34, "小");
    drawLantern(696, 176, 0.35, "判");
    ctx.restore();
  }

  function drawTorii(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(96,56,52,0.18)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-68, -54);
    ctx.lineTo(68, -54);
    ctx.moveTo(-52, -35);
    ctx.lineTo(52, -35);
    ctx.moveTo(-43, -35);
    ctx.lineTo(-43, 48);
    ctx.moveTo(43, -35);
    ctx.lineTo(43, 48);
    ctx.stroke();
    ctx.restore();
  }

  function drawMarketStall(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,248,226,0.34)";
    ctx.fillRect(-58, -6, 116, 58);
    drawEdoRoof(-72, -32, 144, 32, "rgba(185,77,69,0.34)");
    ctx.fillStyle = "rgba(255,255,255,0.34)";
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(-50 + i * 25, -6, 12, 24);
    }
    ctx.restore();
  }

  function drawNobori(x, y, text, color) {
    ctx.save();
    ctx.strokeStyle = "rgba(67,54,56,0.24)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 42);
    ctx.lineTo(x, y + 56);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.36;
    roundRect(x + 4, y - 40, 36, 74, 4);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    drawText(text, x + 22, y - 2, 15, "#fffaf0", "center", "bold");
    ctx.restore();
  }

  function drawLanternString(x1, y1, x2, y2) {
    ctx.save();
    ctx.strokeStyle = "rgba(67,54,56,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 26, x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLantern(x, y, scale, text) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(246,210,120,0.58)";
    ctx.strokeStyle = "rgba(128,75,58,0.28)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 31, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(128,75,58,0.28)";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 9, -27);
      ctx.lineTo(i * 9, 27);
      ctx.stroke();
    }
    drawText(text, 0, 3, 18, "#8c4f45", "center", "bold");
    ctx.restore();
  }

  function drawStonePath() {
    ctx.save();
    ctx.fillStyle = "rgba(255,245,226,0.14)";
    for (let i = 0; i < 14; i += 1) {
      const x = 92 + (i * 86) % 960;
      const y = 386 + ((i * 43) % 92);
      roundRect(x, y, 44 + (i % 3) * 11, 22, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHill(x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, Math.PI, 0);
    ctx.fill();
  }

  function drawGroundMarks() {
    ctx.save();
    ctx.strokeStyle = "rgba(103,72,69,0.18)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 46; i += 1) {
      const x = (i * 157) % WIDTH;
      const y = 185 + ((i * 79) % 325);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y + (i % 2) * 3);
      ctx.moveTo(x + 18, y + 2);
      ctx.lineTo(x + 31, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(114,159,89,0.25)";
    for (let i = 0; i < 24; i += 1) {
      const x = (i * 211 + 47) % WIDTH;
      const y = 180 + ((i * 103) % 330);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y - 9);
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 8, y - 11);
      ctx.moveTo(x + 15, y);
      ctx.lineTo(x + 12, y - 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBridge() {
    ctx.save();
    ctx.strokeStyle = "rgba(160,96,90,0.13)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(WIDTH * 0.64, 320, 210, Math.PI * 1.05, Math.PI * 1.94);
    ctx.stroke();
    ctx.strokeStyle = "rgba(160,96,90,0.09)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const x = WIDTH * 0.47 + i * 48;
      ctx.beginPath();
      ctx.moveTo(x, 222);
      ctx.lineTo(x, 258);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStart() {
    if (state.images.opening) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(state.images.opening, 0, 0, WIDTH, HEIGHT);
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
      drawOpeningStartButton();
      state.buttons.push({
        x: 440,
        y: 452,
        w: 300,
        h: 76,
        onClick: () => {
          state.scene = "select";
        },
      });
      return;
    }

    drawSoftBackground();
    drawImageAsset("house", WIDTH / 2 + 220, 238, 0.42);
    drawImageAsset("tree", 120, 230, 0.52);
    drawImageAsset("tree", WIDTH - 260, 218, 0.48);
    drawText("下克上御前乱斗", WIDTH / 2, 76, 50, COLORS.ink, "center", "bold");
    drawText("下剋上オンライン", WIDTH / 2, 121, 28, COLORS.red, "center", "bold");
    drawPaperPanel(WIDTH / 2 - 300, 158, 600, 112);
    drawText("一揆に参加する？", WIDTH / 2, 226, 44, COLORS.ink, "center", "bold");
    drawRoleSprite(ROLES[0], "front", 0, WIDTH / 2, 378, 0.45, false);
    drawButton(390, 396, 152, 66, "はい", "参戦", () => {
      state.scene = "select";
    });
    drawButton(636, 396, 152, 66, "いいえ", "番付", () => {
      state.scene = "ranking";
    }, "quiet");
  }

  function drawOpeningStartButton() {
    // START in the generated 2048x1152 image is approx [803,977]-[1258,1104].
    // The canvas stretches that image to 1179x543, so the matching canvas box is below.
    const x = 462;
    const y = 460;
    const w = 262;
    const h = 60;
    const hover = pointInRect(state.pointer, { x: 440, y: 452, w: 300, h: 76 });
    const down = hover && state.pointer.down;
    const pulse = (Math.sin(performance.now() / 360) + 1) / 2;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = hover ? "rgba(255,232,136,0.86)" : `rgba(255,232,136,${0.28 + pulse * 0.22})`;
    ctx.shadowBlur = hover ? 24 : 12 + pulse * 8;
    ctx.strokeStyle = hover ? "rgba(255,244,178,0.86)" : `rgba(255,244,178,${0.38 + pulse * 0.22})`;
    ctx.lineWidth = hover ? 5 : 3;
    roundRect(x - 8, y - 6, w + 16, h + 12, 22);
    ctx.stroke();

    ctx.globalAlpha = hover ? 0.22 : 0.11 + pulse * 0.06;
    ctx.fillStyle = down ? "rgba(255,214,104,0.42)" : "rgba(255,248,200,0.5)";
    roundRect(x - 2, y, w + 4, h, 18);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = hover ? 0.95 : 0.62 + pulse * 0.18;
    ctx.fillStyle = "rgba(255,238,145,0.94)";
    star(x - 26 - pulse * 4, y + h / 2, hover ? 9 : 7, 4);
    star(x + w + 26 + pulse * 4, y + h / 2, hover ? 9 : 7, 4);

    if (hover) {
      drawText("▶", x - 48, y + h / 2, 28, "rgba(255,239,151,0.95)", "center", "bold");
      drawText("◀", x + w + 48, y + h / 2, 28, "rgba(255,239,151,0.95)", "center", "bold");
    }
    ctx.restore();
  }

  function drawSelect() {
    drawSoftBackground();
    drawText("角色选择", WIDTH / 2, 62, 40, COLORS.ink, "center", "bold");
    drawText("身分を選べ", WIDTH / 2, 101, 22, COLORS.red, "center", "bold");
    ROLES.forEach((role, index) => {
      const x = 158 + index * 306;
      const y = 142;
      const selected = state.selectedRole === index;
      drawCard(x, y, 250, 276, "#fff8ec", selected, role.color);
      if (selected) {
        drawSelectedCorner(x, y, role.color);
      }
      drawText(role.name, x + 125, y + 44, 31, COLORS.ink, "center", "bold");
      drawText(role.jp, x + 125, y + 78, 20, COLORS.red, "center", "bold");
      drawRoleSprite(role, "attack", 4, x + 125, y + 195, 0.39, false);
      drawText(role.title, x + 125, y + 222, 20, COLORS.ink, "center", "bold");
      drawText(role.trait, x + 125, y + 252, 15, COLORS.muted, "center");
      state.buttons.push({
        x,
        y,
        w: 250,
        h: 276,
        onClick: () => {
          state.selectedRole = index;
        },
      });
    });
    drawButton(WIDTH / 2 - 126, 446, 252, 62, "出阵", ROLES[state.selectedRole].name, () => {
      createGame(state.selectedRole);
    });
    drawButton(46, 450, 142, 54, "戻る", "标题", () => {
      state.scene = "start";
    }, "quiet");
  }

  function drawPlaying() {
    const game = state.game;
    const shake = getScreenShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    drawWorldBackground();
    drawAimGuide();
    const drawables = [
      ...game.drops.map((drop) => ({ type: "drop", y: drop.y, drop })),
      ...game.projectiles.map((projectile) => ({ type: "projectile", y: projectile.y + 28, projectile })),
      ...game.bombs.map((bomb) => ({ type: "bomb", y: bomb.y + 16, bomb })),
      ...game.enemies.map((enemy) => ({ type: "enemy", y: enemy.y, actor: enemy })),
      { type: "player", y: game.player.y, actor: game.player },
    ].sort((a, b) => a.y - b.y);
    drawables.forEach((item) => {
      if (item.type === "drop") drawDrop(item.drop);
      else if (item.type === "projectile") drawProjectile(item.projectile);
      else if (item.type === "bomb") drawBomb(item.bomb);
      else if (item.type === "player") drawPlayer(item.actor);
      else drawEnemy(item.actor);
    });
    drawEffects();
    drawLineAttacks(game);
    drawFloaters();
    ctx.restore();
    drawHud();
    drawBossIntroOverlay(game);
  }

  function drawBossIntroOverlay(game) {
    if (!game || game.bossIntroTimer <= 0) return;
    const isMomonga = game.boss && game.boss.momongaBoss;
    const alpha = clamp(game.bossIntroTimer / (isMomonga ? 2.0 : 2.2), 0, 1);
    ctx.save();
    ctx.fillStyle = `rgba(58,44,38,${0.18 * alpha})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (isMomonga) {
      drawText("飞鼠大将 降临!", WIDTH / 2, 164, 46, "#fff8dd", "center", "bold");
      drawText("注意滑翔突击，趁着陆硬直反击!", WIDTH / 2, 210, 22, "#b8a0e0", "center", "bold");
    } else {
      drawText("御殿决战", WIDTH / 2, 164, 46, "#fff8dd", "center", "bold");
      drawText("引诱出招后反击", WIDTH / 2, 210, 24, COLORS.gold, "center", "bold");
    }
    ctx.restore();
  }

  function drawAimGuide() {
    const game = state.game;
    if (!game) return;
    const player = game.player;
    const range = player.role.range + game.rangeBonus + 16;
    const tipX = player.x + player.aimX * range;
    const tipY = player.y + player.aimY * range;
    const angle = Math.atan2(player.aimY, player.aimX);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(185,77,69,0.12)";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 18);
    ctx.arc(player.x, player.y - 18, range, angle - 0.38, angle + 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(185,77,69,0.86)";
    ctx.fillStyle = "rgba(185,77,69,0.22)";
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 18);
    ctx.lineTo(tipX, tipY - 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(tipX, tipY - 18, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tipX + Math.cos(angle) * 18, tipY - 18 + Math.sin(angle) * 18);
    ctx.lineTo(tipX + Math.cos(angle + 2.45) * 13, tipY - 18 + Math.sin(angle + 2.45) * 13);
    ctx.lineTo(tipX + Math.cos(angle - 2.45) * 13, tipY - 18 + Math.sin(angle - 2.45) * 13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHud() {
    const game = state.game;
    const player = game.player;
    const timeLeft = Math.max(0, Math.ceil(game.duration - game.elapsed));
    drawTopPill(26, 20, 180, 48, `${timeLeft}`, "秒");
    drawTopPill(224, 20, 236, 48, `${game.role.name}`, game.role.title);
    drawTopPill(478, 20, 218, 48, `${Math.round(game.score)}`, "小判点");
    drawTopPill(714, 20, 176, 48, `${game.highestMultiplier.toFixed(1)}x`, "最大倍率");
    drawHealth(36, 82, 318, 18, player.hp / player.maxHp, COLORS.red);
    drawBossHealthBar(game);
    drawDashCooldown(player);
    drawSpecialCooldown(player);
    drawBlockCooldown(player);
    if (player.shields > 0) {
      drawText(`御守 x${player.shields}`, 536, 96, 18, COLORS.blue, "left", "bold");
    }
    drawAvatarBadge();
  }

  function drawBlockCooldown(player) {
    const x = 36;
    const y = 110;
    const w = 128;
    const h = 42;
    const blocking = player.blockTimer > 0;
    const perfectWindow = blocking && player.blockJustStarted <= BLOCK_PERFECT_WINDOW;
    const cooling = !blocking && player.blockCooldown > 0;
    const ready = !blocking && !cooling;
    const color = perfectWindow ? COLORS.gold : COLORS.blue;
    state.buttons.push({ x, y, w, h, onClick: tryStartBlock });
    ctx.save();
    ctx.fillStyle = "rgba(255,249,239,0.92)";
    ctx.strokeStyle = ready ? color : (blocking ? color : "rgba(67,54,56,0.5)");
    ctx.lineWidth = perfectWindow ? 4 : 3;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    const centerX = x + 22;
    const centerY = y + h / 2;
    ctx.fillStyle = ready ? withAlpha(color, 0.9) : (blocking ? withAlpha(color, 0.95) : "rgba(123,107,103,0.55)");
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(67,54,56,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (cooling) {
      const ratio = 1 - clamp(player.blockCooldown / BLOCK_COOLDOWN, 0, 1);
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      ctx.fillStyle = "rgba(67,54,56,0.4)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.fill();
      drawText(player.blockCooldown.toFixed(1), centerX, centerY + 1, 13, "#fffaf0", "center", "bold");
    } else {
      // Draw a tiny shield glyph
      ctx.fillStyle = "#fff8e0";
      ctx.strokeStyle = "rgba(67,54,56,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 9);
      ctx.lineTo(centerX + 8, centerY - 4);
      ctx.lineTo(centerX + 8, centerY + 3);
      ctx.quadraticCurveTo(centerX + 8, centerY + 9, centerX, centerY + 11);
      ctx.quadraticCurveTo(centerX - 8, centerY + 9, centerX - 8, centerY + 3);
      ctx.lineTo(centerX - 8, centerY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    drawText("格挡", x + 74, y + 16, 15, COLORS.ink, "center", "bold");
    drawText("空格 / 右键", x + 74, y + 32, 11, ready ? color : COLORS.muted, "center", "bold");
    ctx.restore();
  }

  const BOSS_PHASE_COLORS = ["#e8eef2", "#e6bd4e", "#c44a44"];

  function getBossPhaseColor(phase, phaseMax) {
    const colors = BOSS_PHASE_COLORS;
    const last = colors.length - 1;
    if (!phase || phase < 1) return colors[0];
    const total = Math.max(1, phaseMax || 1);
    if (total <= 1) return colors[last];
    const t = clamp((phase - 1) / (total - 1), 0, 1);
    return colors[Math.round(t * last)];
  }

  function drawBossHealthBar(game) {
    const boss = game.boss;
    if (!boss || (!game.bossStarted && !game.bossDefeated)) return;
    const phase = boss.bossPhase || 1;
    const phaseMax = boss.bossPhaseMax || 1;
    const ratio = clamp(boss.hp / (boss.phaseMaxHp || boss.maxHp), 0, 1);
    const x = 386;
    const y = 104;
    const w = 486;
    const h = 28;
    ctx.save();
    ctx.fillStyle = "rgba(44,35,37,0.74)";
    roundRect(x - 16, y - 18, w + 32, 58, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,189,78,0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
    const bossLabel = boss.momongaBoss ? "飞鼠大将" : "大将军";
    const bossSubLabel = boss.momongaBoss ? "第一关 BOSS" : `御殿 BOSS · 第${phase}/${phaseMax}段`;
    drawText(bossLabel, x, y - 1, 18, "#fff8e0", "left", "bold");
    drawText(bossSubLabel, x + w, y - 1, 14, COLORS.gold, "right", "bold");
    const nextColor = phase < phaseMax ? getBossPhaseColor(phase + 1, phaseMax) : null;
    ctx.fillStyle = nextColor || "rgba(255,255,255,0.32)";
    roundRect(x, y + 10, w, h, h / 2);
    ctx.fill();
    const fillColor = getBossPhaseColor(phase, phaseMax);
    ctx.fillStyle = fillColor;
    roundRect(x + 4, y + 14, Math.max(0, (w - 8) * ratio), h - 8, h / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,248,220,0.8)";
    ctx.lineWidth = 2;
    roundRect(x, y + 10, w, h, h / 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawDashCooldown(player) {
    const x = 1044;
    const y = 20;
    const nextRatio = player.dashCharges >= DASH_MAX_CHARGES ? 1 : clamp(player.dashRecharge / DASH_RECHARGE_TIME, 0, 1);
    const seconds = Math.ceil(DASH_RECHARGE_TIME - player.dashRecharge);
    const ready = player.dashCharges > 0;
    const centerX = x + 26;
    const centerY = y + 25;
    state.buttons.push({ x, y, w: 118, h: 50, onClick: dashPlayer });
    ctx.save();
    ctx.fillStyle = "rgba(255,249,239,0.92)";
    ctx.strokeStyle = ready ? COLORS.blue : "rgba(67,54,56,0.5)";
    ctx.lineWidth = 3;
    roundRect(x, y, 118, 50, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ready ? "rgba(127,182,211,0.95)" : "rgba(123,107,103,0.55)";
    ctx.strokeStyle = "rgba(67,54,56,0.5)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (player.dashCharges < DASH_MAX_CHARGES) {
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * nextRatio);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(0.65, 0.65);
    ctx.translate(-centerX, -centerY);
    drawDodgeIcon(centerX, centerY + 1, ready);
    ctx.restore();
    if (!ready) {
      ctx.fillStyle = "rgba(67,54,56,0.42)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();
      drawText(`${seconds}`, centerX, centerY + 1, 17, "#fffaf0", "center", "bold");
    }
    drawText("闪避", x + 70, y + 19, 16, COLORS.ink, "center", "bold");
    drawText("Shift", x + 70, y + 37, 12, ready ? COLORS.blue : COLORS.muted, "center", "bold");
    drawText(`${player.dashCharges}/${DASH_MAX_CHARGES}`, x + 103, y + 37, 13, ready ? COLORS.blue : COLORS.muted, "center", "bold");
    for (let i = 0; i < DASH_MAX_CHARGES; i += 1) {
      const filled = i < player.dashCharges;
      const recharging = !filled && i === player.dashCharges;
      drawDashCharge(x + 74 + i * 21, y + 47, filled, recharging ? nextRatio : 0, 0.62);
    }
    ctx.restore();
  }

  function drawSpecialCooldown(player) {
    const x = 914;
    const y = 20;
    const ready = player.specialCooldown <= 0;
    const ratio = ready ? 1 : 1 - clamp(player.specialCooldown / player.specialMaxCooldown, 0, 1);
    const skill = getSpecialSkillInfo(player.role.id);
    state.buttons.push({ x, y, w: 118, h: 50, onClick: useSpecialSkill });
    ctx.save();
    ctx.fillStyle = "rgba(255,249,239,0.92)";
    ctx.strokeStyle = ready ? skill.color : "rgba(67,54,56,0.48)";
    ctx.lineWidth = 3;
    roundRect(x, y, 118, 50, 9);
    ctx.fill();
    ctx.stroke();
    const centerX = x + 26;
    const centerY = y + 25;
    ctx.fillStyle = ready ? withAlpha(skill.color, 0.95) : "rgba(123,107,103,0.55)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(67,54,56,0.5)";
    ctx.stroke();
    if (!ready) {
      ctx.strokeStyle = skill.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      ctx.fillStyle = "rgba(67,54,56,0.42)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();
      drawText(`${Math.ceil(player.specialCooldown)}`, centerX, centerY + 1, 17, "#fffaf0", "center", "bold");
    } else {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(0.68, 0.68);
      ctx.translate(-centerX, -centerY);
      drawSpecialIcon(centerX, centerY, skill.icon, skill.color);
      ctx.restore();
    }
    drawText("奥义", x + 70, y + 18, 16, COLORS.ink, "center", "bold");
    drawText("E / K", x + 70, y + 36, 12, ready ? skill.color : COLORS.muted, "center", "bold");
    drawText(skill.name, x + 96, y + 36, 11, ready ? skill.color : COLORS.muted, "center", "bold");
    ctx.restore();
  }

  function getSpecialSkillInfo(roleId) {
    if (roleId === "chiikawa") return { name: "勇气护身", icon: "heart", color: COLORS.green };
    if (roleId === "hachiware") return { name: "友情连携", icon: "spark", color: COLORS.blue };
    return { name: "呀哈突进", icon: "bolt", color: COLORS.gold };
  }

  function drawSpecialIcon(x, y, icon, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#fff8e0";
    ctx.strokeStyle = "rgba(67,54,56,0.65)";
    ctx.lineWidth = 2;
    if (icon === "heart") {
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.bezierCurveTo(-24, -1, -19, -22, 0, -11);
      ctx.bezierCurveTo(19, -22, 24, -1, 0, 14);
      ctx.fill();
      ctx.stroke();
    } else if (icon === "spark") {
      star(0, 0, 18, 6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-7, -20);
      ctx.lineTo(10, -4);
      ctx.lineTo(1, -2);
      ctx.lineTo(8, 20);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-2, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = withAlpha(color, 0.55);
    ctx.fillRect(-24, -24, 48, 48);
    ctx.restore();
  }

  function drawDodgeIcon(x, y, ready) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = ready ? COLORS.blue : "rgba(123,107,103,0.48)";
    ctx.strokeStyle = "rgba(67,54,56,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(1, -13);
    ctx.lineTo(-1, -2);
    ctx.lineTo(11, -2);
    ctx.lineTo(-2, 15);
    ctx.lineTo(1, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawDashCharge(x, y, filled, rechargeRatio, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = filled ? "rgba(127,182,211,0.95)" : "rgba(255,255,255,0.78)";
    ctx.strokeStyle = filled ? COLORS.blue : "rgba(67,54,56,0.36)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!filled && rechargeRatio > 0) {
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rechargeRatio);
      ctx.stroke();
    }
    ctx.fillStyle = filled ? "#ffffff" : "rgba(123,107,103,0.48)";
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(2, -8);
    ctx.lineTo(0, -1);
    ctx.lineTo(6, -1);
    ctx.lineTo(-2, 9);
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTopPill(x, y, w, h, main, sub) {
    ctx.save();
    ctx.fillStyle = "rgba(255,249,239,0.88)";
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(67,54,56,0.56)";
    ctx.lineWidth = 3;
    ctx.stroke();
    drawText(main, x + 20, y + 29, 24, COLORS.ink, "left", "bold");
    drawText(sub, x + w - 18, y + 31, 15, COLORS.muted, "right", "bold");
    ctx.restore();
  }

  function drawAvatarBadge() {
    const game = state.game;
    const x = WIDTH - 46;
    const y = 84;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = game.role.color;
    ctx.lineWidth = 5;
    ctx.stroke();
    drawRoleSprite(game.role, "front", 1, x, y + 35, 0.14, false);
    ctx.restore();
  }

  function drawUpgrade() {
    const game = state.game;
    ctx.save();
    ctx.fillStyle = "rgba(58,50,54,0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPaperPanel(256, 78, 666, 108);
    const bossChoiceTitle = game.stage === 1 ? "飞鼠大将战前夜" : "御殿决战前夜";
    const bossChoiceDesc = game.stage === 1 ? "选择一张木札迎战飞鼠" : "选择一张木札迎战将军";
    drawText(game.pendingBossChoice ? bossChoiceTitle : "瓦版号外", WIDTH / 2, 120, 26, game.pendingBossChoice ? COLORS.gold : COLORS.red, "center", "bold");
    drawText(game.pendingBossChoice ? bossChoiceDesc : "选择一张木札", WIDTH / 2, 158, 38, COLORS.ink, "center", "bold");
    game.pendingUpgrades.forEach((upgrade, index) => {
      const x = 222 + index * 258;
      drawCard(x, 230, 218, 178, "#fff8ec", false);
      drawText(`${index + 1}`, x + 28, 264, 22, COLORS.gold, "center", "bold");
      drawText(upgrade.name, x + 109, 300, 27, COLORS.ink, "center", "bold");
      drawText(upgrade.desc, x + 109, 338, 18, COLORS.muted, "center");
      drawButton(x + 47, 363, 124, 42, "取る", "木札", () => chooseUpgrade(index));
    });
    ctx.restore();
  }

  function drawStageTransition() {
    const game = state.game;
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, "#2a2440");
    grad.addColorStop(0.5, "#4a3870");
    grad.addColorStop(1, "#2a2440");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const pulse = 0.5 + Math.sin(performance.now() / 400) * 0.5;
    ctx.fillStyle = `rgba(123,107,189,${0.06 + pulse * 0.04})`;
    for (let i = 0; i < 20; i += 1) {
      const sx = (i * 173 + 47) % WIDTH;
      const sy = (i * 97 + 23) % HEIGHT;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    drawText("第一关 通过!", WIDTH / 2, 140, 52, "#fff8dd", "center", "bold");
    drawText("飞鼠大将 讨伐成功", WIDTH / 2, 195, 28, "#b8a0e0", "center", "bold");
    drawPaperPanel(326, 234, 526, 108);
    drawText(`当前得分: ${Math.round(game.score)}`, WIDTH / 2, 276, 24, COLORS.ink, "center", "bold");
    drawText(`击破数: ${game.kills}`, WIDTH / 2, 314, 20, COLORS.muted, "center");
    drawButton(WIDTH / 2 - 126, 376, 252, 62, "进入第二关", "続く", () => {
      confirmNextStage();
    });
    ctx.restore();
  }

  function drawResult() {
    const result = state.result;
    const success = result.reason !== "lose";
    if (!success) {
      drawFailureResult(result);
      return;
    }
    drawSoftBackground();
    drawText("你的排名", WIDTH / 2, 70, 35, COLORS.ink, "center", "bold");
    drawText(`第 ${result.rank} 位`, WIDTH / 2, 152, 68, COLORS.gold, "center", "bold");
    drawText(result.title, WIDTH / 2, 208, 34, COLORS.red, "center", "bold");
    drawPaperPanel(286, 248, 606, 138);
    drawText(`小判点 ${result.score}`, 372, 292, 25, COLORS.ink, "left", "bold");
    drawText(`击破 ${result.bestRank.name}`, 372, 329, 22, COLORS.ink, "left");
    drawText(`最大倍率 ${result.highestMultiplier.toFixed(1)}x`, 626, 292, 22, COLORS.ink, "left");
    drawText(`击破数 ${result.kills}`, 626, 329, 22, COLORS.ink, "left");
    drawButton(336, 424, 160, 58, "再战", "一局", () => {
      state.scene = "select";
    });
    drawButton(510, 424, 160, 58, "番付", "排行", () => {
      state.scene = "ranking";
    }, "quiet");
    drawButton(684, 424, 160, 58, "标题", "戻る", () => {
      state.scene = "start";
    }, "quiet");
  }

  function drawFailureResult(result) {
    ctx.save();
    ctx.fillStyle = "#9c9999";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const haze = ctx.createRadialGradient(WIDTH / 2, 168, 80, WIDTH / 2, 168, 520);
    haze.addColorStop(0, "rgba(255,255,255,0.16)");
    haze.addColorStop(1, "rgba(80,76,78,0.18)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText("下克上失败……", WIDTH / 2, 150, 72, "rgba(255,255,255,0.94)", "center", "bold");
    drawFailureSkull(WIDTH / 2, 248, 0.92);

    const showRanking = !result.rankingRevealAt || performance.now() >= result.rankingRevealAt;
    if (!showRanking) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = "rgba(76,72,74,0.34)";
    roundRect(286, 320, 606, 86, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText("本局番付", WIDTH / 2 - 170, 354, 20, "rgba(255,255,255,0.78)", "center", "bold");
    drawText(`第 ${result.rank} 位`, WIDTH / 2, 368, 42, "#fff8dd", "center", "bold");
    drawText(result.title, WIDTH / 2 + 180, 360, 22, "rgba(255,255,255,0.86)", "center", "bold");

    drawText(`小判点 ${result.score}`, 360, 438, 20, "rgba(255,255,255,0.88)", "left", "bold");
    drawText(`击破 ${result.bestRank.name}`, 360, 468, 18, "rgba(255,255,255,0.78)", "left");
    drawText(`最大倍率 ${result.highestMultiplier.toFixed(1)}x`, 620, 438, 18, "rgba(255,255,255,0.78)", "left");
    drawText(`击破数 ${result.kills}`, 620, 468, 18, "rgba(255,255,255,0.78)", "left");
    ctx.restore();

    drawButton(336, 486, 160, 44, "再战", "一局", () => {
      state.scene = "select";
    }, "quiet");
    drawButton(510, 486, 160, 44, "番付", "排行", () => {
      state.scene = "ranking";
    }, "quiet");
    drawButton(684, 486, 160, 44, "标题", "戻る", () => {
      state.scene = "start";
    }, "quiet");
  }

  function drawFailureSkull(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.ellipse(0, -8, 58, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    roundRect(-30, 18, 60, 34, 10);
    ctx.fill();
    ctx.fillStyle = "#8f8c8d";
    ctx.beginPath();
    ctx.arc(-22, -9, 8, 0, Math.PI * 2);
    ctx.arc(22, -9, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9c9999";
    roundRect(-26, 34, 13, 28, 5);
    ctx.fill();
    roundRect(13, 34, 13, 28, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawRanking() {
    drawSoftBackground();
    drawText("御前番付表", WIDTH / 2, 66, 44, COLORS.ink, "center", "bold");
    drawText("オンライン風 本地番付", WIDTH / 2, 103, 20, COLORS.red, "center", "bold");
    drawPaperPanel(264, 126, 650, 304);
    const rows = getCombinedRankings();
    rows.forEach((row, index) => {
      const y = 166 + index * 27;
      const current = state.result && row.createdAt === state.result.entry.createdAt;
      ctx.fillStyle = current ? "rgba(230,189,78,0.26)" : index % 2 ? "rgba(255,255,255,0.36)" : "rgba(143,189,212,0.12)";
      roundRect(292, y - 19, 592, 24, 5);
      ctx.fill();
      drawText(`${index + 1}`, 316, y, 17, current ? COLORS.red : COLORS.ink, "center", "bold");
      drawText(row.name, 354, y, 17, COLORS.ink, "left", current ? "bold" : "normal");
      drawText(row.title, 560, y, 16, COLORS.muted, "left");
      drawText(`${row.score}`, 846, y, 17, COLORS.ink, "right", "bold");
    });
    drawButton(384, 456, 164, 56, "出阵", "新局", () => {
      state.scene = "select";
    });
    drawButton(628, 456, 164, 56, "标题", "戻る", () => {
      state.scene = "start";
    }, "quiet");
  }

  function drawPlayer(player) {
    const frame = chooseActorFrame(player);
    const characterFrame = chooseCharacterFrame(player);
    const flip = chooseActorFlip(player);
    const comboStep = player.attackTimer > 0 ? (player.attackComboStep || 0) : 0;
    const comboCfg = ATTACK_COMBO[comboStep] || ATTACK_COMBO[0];
    const attackProgress = player.attackTimer > 0 ? clamp(1 - player.attackTimer / (player.attackDuration || comboCfg.duration), 0, 1) : 0;
    const attackLunge = attackProgress > 0 ? Math.sin(attackProgress * Math.PI) : 0;
    const finisher = comboStep === ATTACK_COMBO.length - 1 && player.attackTimer > 0;
    drawShadow(player.x, player.y, player.radius + 10, "rgba(58,48,50,0.18)");
    drawDashAfterimages(player, characterFrame, flip);
    drawPlayerHurtAura(player);
    const flicker = player.invuln > 0 && player.hurt <= 0 && player.dashTime <= 0 && Math.floor(performance.now() / 80) % 2 === 0;
    if (player.attackTimer > 0 && getActorFacing(player).y < -0.42) {
      drawDirectionalAttack(player, 1.05, player.role.color, comboStep);
    }
    if (!flicker) {
      if (characterFrame) {
        const dashProgress = player.dashTime > 0 ? 1 - player.dashTime / DASH_ANIMATION_TIME : 1;
        const dashLean = player.dashTime > 0 ? player.dashDirX * 0.18 * Math.sin(dashProgress * Math.PI) : 0;
        const stretch = player.dashTime > 0 ? 1 + 0.1 * Math.sin(dashProgress * Math.PI) : 1;
        const hurtPulse = player.hurt > 0 ? clamp(player.hurt / 0.38, 0, 1) : 0;
        const hurtKick = hurtPulse > 0 ? Math.sin(hurtPulse * Math.PI * 5) * 4 : 0;
        const hasAdSprite = !!state.attackDefendSprites[player.role.spriteKey];
        const attacking = player.attackTimer > 0 && hasAdSprite;
        const blocking = player.blockTimer > 0 && hasAdSprite;
        const useAdFrame = attacking || blocking;
        const baseScale = (!useAdFrame && player.role.moveScale) ? player.role.moveScale : 0.38;
        const lungeMult = attacking ? (finisher ? 0.9 : (comboStep === 0 ? 0.35 : 0.55)) : (finisher ? 1.6 : (comboStep === 0 ? 0.6 : 1));
        const blockLean = blocking ? (flip ? 0.04 : -0.04) : (player.blockTimer > 0 ? (flip ? 0.06 : -0.06) : 0);
        drawCharacterFrame(characterFrame, player.x, player.y + 18, baseScale, flip, {
          rotation: dashLean + player.attackDirX * attackLunge * (attacking ? 0.06 : 0.13) * lungeMult + hurtPulse * (flip ? -0.12 : 0.12) + blockLean,
          scaleX: stretch + attackLunge * (attacking ? 0.04 : 0.1) * lungeMult + hurtPulse * 0.12,
          scaleY: 1 / stretch - attackLunge * (attacking ? 0.02 : 0.06) * lungeMult - hurtPulse * 0.08,
          offsetX: hurtKick + player.attackDirX * attackLunge * (attacking ? 8 : 12) * lungeMult + (blocking ? -player.attackDirX * 3 : 0),
          offsetY: -hurtPulse * 7 + player.attackDirY * attackLunge * (attacking ? 4 : 7) * lungeMult,
        });
      }
      else drawSprite(player.row, frame, player.x, player.y + 19, 0.39, flip);
    }
    if (player.attackTimer > 0 && getActorFacing(player).y >= -0.42) {
      drawDirectionalAttack(player, 1.05, player.role.color, comboStep);
    }
    if (player.blockTimer > 0) drawBlockShield(player);
    drawRankTag(player.x, player.y - 74, player.role.name, player.role.color);
  }

  function drawBlockShield(player) {
    const perfect = player.blockJustStarted <= BLOCK_PERFECT_WINDOW;
    const facing = getActorFacing(player);
    const angle = Math.atan2(facing.y, facing.x);
    const ratio = clamp(player.blockTimer / BLOCK_DURATION, 0, 1);
    const main = perfect ? COLORS.gold : COLORS.blue;
    ctx.save();
    ctx.translate(player.x + facing.x * 14, player.y - 22 + facing.y * 8);
    ctx.rotate(angle);
    ctx.lineCap = "round";
    ctx.shadowBlur = perfect ? 22 : 12;
    ctx.shadowColor = main;
    ctx.globalAlpha = 0.32 + ratio * 0.18;
    ctx.fillStyle = withAlpha(main, 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, 30, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = main;
    ctx.lineWidth = perfect ? 5 : 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 30, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.stroke();
    if (perfect) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayerHurtAura(player) {
    if (player.hurt <= 0) return;
    const ratio = clamp(player.hurt / 0.38, 0, 1);
    const outward = 1 - ratio;
    const jitter = Math.sin(performance.now() / 26) * 3 * ratio;
    ctx.save();
    ctx.globalAlpha = ratio * 0.72;
    ctx.shadowBlur = 16;
    ctx.shadowColor = COLORS.red;
    ctx.strokeStyle = COLORS.red;
    ctx.fillStyle = "rgba(185,77,69,0.18)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(player.x + jitter, player.y - 28, 42 + outward * 30, 34 + outward * 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    star(player.x + player.aimX * 8, player.y - 42 + player.aimY * 6, 8 + outward * 10, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      const angle = -1.3 + i * 0.43 + outward * 0.3;
      ctx.beginPath();
      ctx.moveTo(player.x + Math.cos(angle) * 26, player.y - 28 + Math.sin(angle) * 20);
      ctx.lineTo(player.x + Math.cos(angle) * (52 + outward * 20), player.y - 28 + Math.sin(angle) * (38 + outward * 14));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDashAfterimages(player, characterFrame, flip) {
    if (player.dashTime <= 0) return;
    const progress = clamp(1 - player.dashTime / DASH_ANIMATION_TIME, 0, 1);
    const dx = player.x - player.dashFromX;
    const dy = player.y - player.dashFromY;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    const px = -ny;
    const py = nx;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = player.role.color;

    // Avoid drawing semi-transparent copies of the character sprite while
    // dodging.  The character sheets contain soft white edges/empty padding,
    // which made the dash look like broken body chunks in motion.  Use clean
    // speed lines + dust puffs instead.
    for (let i = 0; i < 5; i += 1) {
      const t = clamp(progress - i * 0.1, 0, 1);
      const trailX = player.dashFromX + dx * t;
      const trailY = player.dashFromY + dy * t - 18;
      const alpha = (0.28 - i * 0.035) * (1 - progress * 0.35);
      const offset = (i - 2) * 7;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = withAlpha(player.role.color, 0.82);
      ctx.lineWidth = 8 - i * 0.9;
      ctx.beginPath();
      ctx.moveTo(trailX - nx * 46 + px * offset, trailY - ny * 24 + py * offset);
      ctx.lineTo(trailX - nx * 8 + px * offset * 0.3, trailY - ny * 4 + py * offset * 0.3);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.75;
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.beginPath();
      ctx.ellipse(
        trailX - nx * 50 + px * offset,
        trailY + 26 - ny * 10 + py * offset * 0.35,
        14 - i * 1.5,
        6 - i * 0.45,
        Math.atan2(dy, dx),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(enemy) {
    if (enemy.boss) {
      drawBossEnemy(enemy);
      return;
    }
    const frame = chooseActorFrame(enemy);
    const enemyFrame = chooseEnemySpriteFrame(enemy);
    const flip = chooseActorFlip(enemy);
    const attackProgress = enemy.attackTimer > 0 ? clamp(1 - enemy.attackTimer / (enemy.attackDuration || 0.32), 0, 1) : 0;
    const chargeProgress = enemy.chargeState === "dash" ? 1 : enemy.chargeState === "windup" ? clamp(1 - enemy.chargeTimer / 0.62, 0, 1) : 0;
    const attackLunge = attackProgress > 0 ? Math.sin(attackProgress * Math.PI) : 0;
    const ranged = isRangedEnemy(enemy);
    drawShadow(enemy.x, enemy.y, enemy.radius + 8, "rgba(58,48,50,0.16)");
    drawEnemyAttackTell(enemy);
    if (!ranged && (enemy.attackTimer > 0 || enemy.chargeState === "dash") && getActorFacing(enemy).y < -0.42) {
      drawDirectionalAttack(enemy, 0.82, enemy.rankInfo.color);
    }
    if (enemyFrame) {
      drawCharacterFrame(enemyFrame, enemy.x, enemy.y + 18, 0.29 + enemy.rank * 0.024, flip, {
        offsetX: enemy.attackDirX * attackLunge * (7 + enemy.rank),
        offsetY: enemy.attackDirY * attackLunge * (4 + enemy.rank * 0.5),
        rotation: enemy.attackDirX * attackLunge * 0.06,
        scaleX: 1 + attackLunge * 0.08 + chargeProgress * 0.12,
        scaleY: 1 - attackLunge * 0.05 - chargeProgress * 0.08,
      });
    }
    else drawSprite(enemy.row, frame, enemy.x, enemy.y + 17, 0.31 + enemy.rank * 0.025, flip);
    if (!ranged && (enemy.attackTimer > 0 || enemy.chargeState === "dash") && getActorFacing(enemy).y >= -0.42) {
      drawDirectionalAttack(enemy, 0.82, enemy.rankInfo.color);
    }
    drawEnemyCrown(enemy);
    drawHealth(enemy.x - 34, enemy.y - 64, 68, 7, enemy.hp / enemy.maxHp, enemy.rankInfo.color);
    drawRankTag(enemy.x, enemy.y - 76, enemy.rankInfo.name, enemy.rankInfo.color, 0.82);
    if ((enemy.stunTimer || 0) > 0) {
      drawStunMarks(enemy.x, enemy.y - 86, clamp(enemy.stunTimer / 1.6, 0, 1), 18, 4);
    }
  }

  function drawBossEnemy(enemy) {
    const enemyFrame = chooseEnemySpriteFrame(enemy);
    const flip = chooseActorFlip(enemy);
    const duration = enemy.attackDuration || 0.74;
    const attackProgress = enemy.attackTimer > 0 ? clamp(1 - enemy.attackTimer / duration, 0, 1) : 0;
    const melee = enemy.attackTimer > 0 && enemy.attackKind === "melee";
    const meleeProfile = getBossAttackProfile("melee", enemy);
    const meleeHitAt = meleeProfile.hitAt || 0.55;
    const windup = melee && attackProgress < meleeHitAt ? attackProgress / meleeHitAt : 0;
    const followThrough = melee && attackProgress >= meleeHitAt
      ? (attackProgress - meleeHitAt) / (1 - meleeHitAt)
      : 0;
    const pullback = windup > 0 ? Math.pow(windup, 0.7) * -0.6 : 0;
    const slamPunch = followThrough > 0 ? Math.sin(followThrough * Math.PI) : 0;
    const attackLunge = melee
      ? pullback + slamPunch * 1.6
      : (attackProgress > 0 ? Math.sin(attackProgress * Math.PI) : 0);
    const isMomonga = enemy.momongaBoss;
    const baseScale = isMomonga ? 0.52 : 0.68;
    const scale = baseScale + (enemy.hp < enemy.maxHp * 0.45 ? 0.03 * Math.sin(performance.now() / 90) : 0);
    const gliding = isMomonga && enemy.glideState && enemy.glideState !== "idle";
    const stunSlump = (enemy.bossStunTimer > 0 ? clamp(enemy.bossStunTimer / 3, 0, 1) : 0)
      || (gliding && enemy.glideState === "land" ? clamp(enemy.glideTimer / 1.8, 0, 1) : 0);
    const shadowRadius = isMomonga ? 62 : 86;
    drawShadow(enemy.x, enemy.y, shadowRadius + slamPunch * 22, "rgba(34,25,25,0.28)");
    drawEnemyAttackTell(enemy);
    if (isMomonga) drawMomongaAura(enemy);
    else drawBossAura(enemy);
    if (melee) drawBossMeleeFx(enemy, windup, followThrough);
    if (melee && getActorFacing(enemy).y < -0.42) {
      drawDirectionalAttack(enemy, isMomonga ? 1.2 : 1.85 + slamPunch * 0.35, enemy.rankInfo.color);
    }
    const glideRise = gliding && enemy.glideState === "rise" ? clamp(1 - enemy.glideTimer / 0.5, 0, 1) : 0;
    const glideLift = gliding && enemy.glideState === "swoop" ? 1 : glideRise;
    if (enemyFrame) {
      const spriteY = isMomonga ? enemy.y + 30 : enemy.y + 42;
      drawCharacterFrame(enemyFrame, enemy.x, spriteY - glideLift * 20, scale, flip, {
        offsetX: enemy.attackDirX * attackLunge * (isMomonga ? 14 : 22),
        offsetY: enemy.attackDirY * attackLunge * (isMomonga ? 8 : 12) + stunSlump * 6 - glideLift * 8,
        rotation: enemy.attackDirX * attackLunge * 0.06 + (stunSlump ? Math.sin(performance.now() / 220) * 0.05 : 0) + (gliding && enemy.glideState === "swoop" ? enemy.glideDirX * 0.2 : 0),
        scaleX: 1 + slamPunch * 0.16 - windup * 0.04 + glideLift * 0.1,
        scaleY: 1 - slamPunch * 0.1 + windup * 0.08 - stunSlump * 0.05 - glideLift * 0.06,
      });
    } else {
      drawSprite(enemy.row, chooseActorFrame(enemy), enemy.x, enemy.y + 38, 0.7, flip);
    }
    if (melee && getActorFacing(enemy).y >= -0.42) {
      drawDirectionalAttack(enemy, isMomonga ? 1.2 : 1.85 + slamPunch * 0.35, enemy.rankInfo.color);
    }
    if (stunSlump > 0) drawBossStunMarks(enemy, stunSlump);
    const tagY = isMomonga ? enemy.y - 110 : enemy.y - 148;
    const tagName = isMomonga ? "飞鼠大将" : "大将军";
    drawRankTag(enemy.x, tagY, tagName, enemy.rankInfo.color, 0.96);
  }

  function drawBossMeleeFx(enemy, windup, followThrough) {
    const angle = Math.atan2(enemy.attackDirY, enemy.attackDirX);
    ctx.save();
    if (windup > 0) {
      ctx.translate(enemy.x, enemy.y - 46);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.25 + windup * 0.45;
      ctx.shadowBlur = 22 + windup * 18;
      ctx.shadowColor = enemy.rankInfo.color;
      ctx.strokeStyle = withAlpha(enemy.rankInfo.color, 0.7);
      ctx.lineWidth = 6 + windup * 6;
      ctx.beginPath();
      ctx.arc(-30 - windup * 14, 0, 60 + windup * 24, -1.2, 1.2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.55 + windup * 0.3;
      ctx.strokeStyle = "rgba(255,255,255,0.78)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.arc(-30 - windup * 14, 0, 70 + windup * 24, -1.05, 1.05);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    if (followThrough > 0) {
      const punch = Math.sin(followThrough * Math.PI);
      const tipX = enemy.x + enemy.attackDirX * (96 + punch * 36);
      const tipY = enemy.y - 22 + enemy.attackDirY * (54 + punch * 18);
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.globalAlpha = 0.55 - followThrough * 0.4;
      ctx.shadowBlur = 32;
      ctx.shadowColor = enemy.rankInfo.color;
      ctx.fillStyle = withAlpha(enemy.rankInfo.color, 0.32);
      ctx.beginPath();
      ctx.ellipse(0, 0, 58 + punch * 22, 24 + punch * 10, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.6 - followThrough * 0.5;
      ctx.strokeStyle = "rgba(255,247,220,0.95)";
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i += 1) {
        const off = (i - 1.5) * 0.32;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle + off) * (40 + punch * 30), Math.sin(angle + off) * (40 + punch * 30));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBossStunMarks(enemy, intensity) {
    drawStunMarks(enemy.x, enemy.y - 118, intensity, 22, 5);
  }

  function drawStunMarks(cx, cy, intensity, ringRadius, dotRadius) {
    const t = performance.now() / 320;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = 0.7 * intensity;
    for (let i = 0; i < 3; i += 1) {
      const a = t + i * (Math.PI * 2 / 3);
      ctx.fillStyle = i % 2 === 0 ? COLORS.gold : COLORS.red;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * ringRadius, Math.sin(a) * (ringRadius * 0.36), dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBossAura(enemy) {
    const danger = enemy.hp < enemy.maxHp * 0.45;
    const pulse = 0.5 + Math.sin(performance.now() / 180) * 0.5;
    ctx.save();
    ctx.globalAlpha = danger ? 0.34 + pulse * 0.16 : 0.18 + pulse * 0.08;
    ctx.shadowBlur = danger ? 28 : 18;
    ctx.shadowColor = danger ? COLORS.red : COLORS.gold;
    ctx.strokeStyle = danger ? COLORS.red : COLORS.gold;
    ctx.lineWidth = danger ? 5 : 3;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y - 42, 78 + pulse * 12, 108 + pulse * 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.55;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 10, 106 + pulse * 18, 34 + pulse * 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMomongaAura(enemy) {
    const danger = enemy.hp < enemy.maxHp * 0.45;
    const pulse = 0.5 + Math.sin(performance.now() / 200) * 0.5;
    const gliding = enemy.glideState && enemy.glideState !== "idle";
    ctx.save();
    ctx.globalAlpha = danger ? 0.3 + pulse * 0.14 : 0.15 + pulse * 0.06;
    if (gliding) ctx.globalAlpha += 0.2;
    ctx.shadowBlur = danger ? 24 : 14;
    ctx.shadowColor = "#7b6bbd";
    ctx.strokeStyle = danger ? "#c44a44" : "#7b6bbd";
    ctx.lineWidth = danger ? 4 : 2.5;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y - 32, 56 + pulse * 10, 78 + pulse * 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 6, 78 + pulse * 14, 26 + pulse * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemyAttackTell(enemy) {
    const charging = enemy.chargeState && enemy.chargeState !== "idle";
    const bossCharging = enemy.boss && enemy.bossChargeState && enemy.bossChargeState !== "idle" && enemy.bossChargeState !== "stun";
    if (enemy.attackTimer <= 0 && enemy.recoveryTimer <= 0 && (enemy.staggerTimer || 0) <= 0 && !charging && !bossCharging) return;
    const profile = getEnemyAttackProfile(enemy);
    const ranged = isRangedAttack(enemy, profile);
    ctx.save();
    if (charging) {
      const progress = enemy.chargeState === "windup" ? clamp(1 - enemy.chargeTimer / 0.62, 0, 1) : 1;
      const angle = Math.atan2(enemy.chargeDirY || enemy.attackDirY || 0, enemy.chargeDirX || enemy.attackDirX || 1);
      const targetX = enemy.chargeTargetX || enemy.x + Math.cos(angle) * 180;
      const targetY = enemy.chargeTargetY || enemy.y + Math.sin(angle) * 120;
      ctx.globalAlpha = enemy.chargeState === "dash" ? 0.36 : 0.18 + progress * 0.52;
      ctx.shadowBlur = 22 + progress * 18;
      ctx.shadowColor = enemy.rankInfo.color;
      ctx.strokeStyle = withAlpha(enemy.rankInfo.color, enemy.chargeState === "dash" ? 0.7 : 0.9);
      ctx.lineWidth = enemy.chargeState === "dash" ? 22 : 12 + progress * 16;
      ctx.setLineDash(enemy.chargeState === "dash" ? [] : [18, 12]);
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 24);
      ctx.lineTo(targetX, targetY - 24);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.46 + progress * 0.34;
      ctx.fillStyle = withAlpha(enemy.rankInfo.color, 0.24 + progress * 0.24);
      ctx.strokeStyle = enemy.rankInfo.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(targetX, targetY - 18, 30 + progress * 10, 18 + progress * 6, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (bossCharging) {
      const dash = enemy.bossChargeState === "dash";
      const progress = dash ? 1 : clamp(1 - enemy.bossChargeTimer / 0.7, 0, 1);
      const angle = Math.atan2(enemy.bossChargeDirY || 0, enemy.bossChargeDirX || 1);
      const reach = dash ? 220 : 280;
      const tipX = enemy.x + Math.cos(angle) * reach;
      const tipY = enemy.y - 28 + Math.sin(angle) * reach * 0.78;
      ctx.globalAlpha = dash ? 0.42 : 0.22 + progress * 0.6;
      ctx.shadowBlur = 28 + progress * 22;
      ctx.shadowColor = COLORS.red;
      ctx.strokeStyle = withAlpha(COLORS.red, dash ? 0.78 : 0.9);
      ctx.lineWidth = dash ? 28 : 14 + progress * 22;
      ctx.setLineDash(dash ? [] : [22, 14]);
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 28);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.55 + progress * 0.3;
      ctx.strokeStyle = "rgba(255,247,220,0.92)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 28);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    }
    if (enemy.attackTimer > 0 && !enemy.attackHitDone) {
      const progress = clamp(1 - enemy.attackTimer / (enemy.attackDuration || profile.duration), 0, 1);
      const angle = Math.atan2(enemy.attackDirY, enemy.attackDirX);
      const reach = enemy.radius + profile.range;
      const pulse = 0.35 + progress * 0.45;
      if (ranged && profile.bombAttack) {
        ctx.globalAlpha = 0.2 + progress * 0.4;
        ctx.shadowBlur = 16;
        ctx.shadowColor = enemy.rankInfo.color;
        ctx.fillStyle = withAlpha(enemy.rankInfo.color, 0.18 + progress * 0.2);
        ctx.strokeStyle = withAlpha(enemy.rankInfo.color, 0.6);
        ctx.lineWidth = 3;
        const targetX = state.game.player.x;
        const targetY = state.game.player.y;
        for (let i = 0; i < 3; i++) {
          const bAngle = (Math.PI * 2 / 3) * i + progress * 1.5;
          const bx = targetX + Math.cos(bAngle) * (40 + i * 30);
          const by = targetY + Math.sin(bAngle) * (25 + i * 18);
          ctx.beginPath();
          ctx.arc(bx, by, 28 + progress * 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (ranged) {
        const isLine = profile.lineAttack;
        const laneLength = Math.min(profile.range, enemy.boss ? 420 : 310);
        const originY = enemy.y - (enemy.boss ? 84 : 28);
        const originX = enemy.x + enemy.attackDirX * (enemy.boss ? 46 : 20);
        const endX = enemy.x + enemy.attackDirX * laneLength;
        const endY = originY + enemy.attackDirY * laneLength * 0.76;
        ctx.globalAlpha = 0.18 + progress * 0.46;
        ctx.shadowBlur = enemy.boss ? 28 : 18;
        ctx.shadowColor = enemy.rankInfo.color;
        ctx.strokeStyle = withAlpha(enemy.rankInfo.color, 0.72);
        ctx.lineWidth = isLine ? 52 + progress * 16 : (enemy.boss ? 30 : 18);
        ctx.beginPath();
        ctx.moveTo(originX, originY + enemy.attackDirY * 12);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.54 + progress * 0.32;
        ctx.strokeStyle = "rgba(255,255,255,0.88)";
        ctx.lineWidth = isLine ? 6 : (enemy.boss ? 5 : 3);
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(originX, originY + enemy.attackDirY * 12);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!isLine) {
          ctx.translate(enemy.x + enemy.attackDirX * Math.min(laneLength, enemy.boss ? 170 : 116), originY + enemy.attackDirY * Math.min(laneLength, enemy.boss ? 170 : 116) * 0.76);
          ctx.rotate(angle + progress * Math.PI * 3);
          if (enemy.boss) drawBossAxeShape(18 + progress * 7, enemy.rankInfo.color);
          else drawShurikenShape(0, 0, 12 + progress * 5, enemy.rankInfo.color);
        }
      } else {
        const tellY = enemy.y - (enemy.boss ? 58 : 20);
        ctx.globalAlpha = pulse;
        ctx.shadowBlur = enemy.boss ? 32 : enemy.rank >= 4 ? 22 : 12;
        ctx.shadowColor = enemy.rankInfo.color;
        ctx.fillStyle = enemy.boss ? "rgba(185,77,69,0.26)" : enemy.rank >= 4 ? "rgba(185,77,69,0.2)" : "rgba(230,189,78,0.18)";
        ctx.strokeStyle = enemy.rankInfo.color;
        ctx.lineWidth = enemy.boss ? 6 : enemy.rank >= 4 ? 4 : 3;
        ctx.beginPath();
        ctx.moveTo(enemy.x, tellY);
        ctx.arc(
          enemy.x,
          tellY,
          reach,
          angle - (enemy.boss ? 0.68 : 0.42),
          angle + (enemy.boss ? 0.68 : 0.42)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.2 + progress * 0.45;
        ctx.strokeStyle = "rgba(255,255,255,0.88)";
        ctx.lineWidth = enemy.boss ? 7 : enemy.rank >= 4 ? 5 : 4;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.attackDirX * 18, tellY + enemy.attackDirY * 12);
        ctx.lineTo(enemy.x + enemy.attackDirX * (reach + 14), tellY + enemy.attackDirY * (reach * 0.64));
        ctx.stroke();
        ctx.globalAlpha = 0.18 + progress * 0.32;
        ctx.strokeStyle = enemy.rankInfo.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i += 1) {
          const ring = 16 + progress * reach * 0.85 + i * 12;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y - (enemy.boss ? 66 : 28), ring, angle - 0.28, angle + 0.28);
          ctx.stroke();
        }
      }
    }
    if ((enemy.staggerTimer || 0) > 0) {
      const ratio = clamp(enemy.staggerTimer / 0.9, 0, 1);
      ctx.globalAlpha = 0.45 + ratio * 0.45;
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y - (enemy.boss ? 54 : 20), enemy.radius + (enemy.boss ? 34 : 18), enemy.radius * (enemy.boss ? 1.15 : 0.8), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function chooseActorFrame(actor) {
    if (actor.hurt > 0) return "hurt";
    if (actor.attackTimer > 0) return chooseAttackFrame(actor);
    return chooseMovementFrame(getActorFacing(actor));
  }

  function chooseAttackFrame(actor) {
    const facing = getActorFacing(actor);
    return chooseMovementFrame(facing);
  }

  function chooseEnemySpriteFrame(enemy) {
    const spriteSet = state.enemySprites[enemy.rankInfo.spriteKey];
    if (!spriteSet) return null;
    if (enemy.momongaBoss && enemy.glideState && enemy.glideState !== "idle") {
      if (enemy.glideState === "land") return pickCharacterFrame(spriteSet.emote, performance.now(), 140);
      return pickCharacterFrame(spriteSet.attack, performance.now(), enemy.glideState === "swoop" ? 50 : 80);
    }
    if (enemy.boss && enemy.hurt > 0) return pickCharacterFrame(spriteSet.emote, enemy.hurt, 0.06);
    if (!enemy.boss && enemy.hurt > 0) return pickCharacterFrame(spriteSet.emote, enemy.hurt, 0.08);
    if (!enemy.boss && enemy.recoveryTimer > 0) return pickCharacterFrame(spriteSet.emote, performance.now(), 120);
    if (enemy.chargeState && enemy.chargeState !== "idle") return pickCharacterFrame(spriteSet.attack, performance.now(), enemy.chargeState === "dash" ? 55 : 95);
    if (enemy.attackTimer > 0) {
      const duration = enemy.attackDuration || 0.32;
      const progress = clamp(1 - enemy.attackTimer / duration, 0, 0.999);
      return spriteSet.attack[Math.floor(progress * spriteSet.attack.length)] || spriteSet.attack[0];
    }
    const facing = getActorFacing(enemy);
    if (Math.abs(facing.y) > 0.65 && facing.y < 0) return pickCharacterFrame(spriteSet.back, performance.now(), 110);
    if (enemy.moving && Math.abs(facing.x) > 0.12) return pickCharacterFrame(spriteSet.side, performance.now(), 100);
    return pickCharacterFrame(spriteSet.front, performance.now(), enemy.moving ? 110 : 190);
  }

  function chooseCharacterFrame(actor) {
    const spriteSet = actor.role ? state.characterSprites[actor.role.spriteKey] : null;
    if (!spriteSet) return null;
    const adSet = actor.role ? state.attackDefendSprites[actor.role.spriteKey] : null;
    if (actor.hurt > 0) return pickCharacterFrame(spriteSet.emote, actor.hurt, 0.08);
    if (actor.blockTimer > 0) {
      if (adSet && adSet.block) {
        const progress = clamp(1 - actor.blockTimer / BLOCK_DURATION, 0, 0.999);
        const idx = Math.floor(progress * adSet.block.length);
        return adSet.block[idx] || adSet.block[0];
      }
      return pickCharacterFrame(spriteSet.front, performance.now(), 200);
    }
    if (actor.attackTimer > 0) {
      const duration = actor.attackDuration || 0.32;
      const progress = clamp(1 - actor.attackTimer / duration, 0, 0.999);
      const step = actor.attackComboStep || 0;
      if (adSet) {
        const rowKey = step === 0 ? "attack1" : step === 1 ? "attack2" : "attack3";
        const frames = adSet[rowKey];
        if (frames && frames.length > 0) {
          const idx = Math.min(frames.length - 1, Math.floor(progress * frames.length));
          return frames[idx];
        }
      }
      const frames = spriteSet.attack;
      if (frames && frames.length > 0) {
        const idx = Math.min(frames.length - 1, Math.floor(progress * frames.length));
        return frames[idx];
      }
      return null;
    }
    const facing = getActorFacing(actor);
    if (Math.abs(facing.y) > 0.65 && facing.y < 0) return pickCharacterFrame(spriteSet.back, performance.now(), 95);
    if (actor.moving && Math.abs(facing.x) > 0.12) return pickCharacterFrame(spriteSet.side, performance.now(), 85);
    return pickCharacterFrame(spriteSet.front, performance.now(), actor.moving ? 95 : 180);
  }

  function pickCharacterFrame(frames, time, frameMs) {
    if (!frames || frames.length === 0) return null;
    return frames[Math.floor(time / frameMs) % frames.length];
  }

  function chooseMovementFrame(facing) {
    if (Math.abs(facing.y) > 0.65 && facing.y < 0) return "back";
    if (Math.abs(facing.x) > 0.25) return "side";
    return "front";
  }

  function chooseActorFlip(actor) {
    return getActorFacing(actor).x < -0.12;
  }

  function drawDirectionalAttack(actor, scale, color, comboStep) {
    const facing = getActorFacing(actor);
    const isEnemy = !actor.role;
    const duration = actor.attackDuration || 0.32;
    const progress = clamp(1 - actor.attackTimer / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 2);
    const baseAngle = Math.atan2(facing.y, facing.x);
    const step = Number.isInteger(comboStep) ? comboStep : 1;
    const sweepMin = step === 0 ? -0.3 : (step === 2 ? -1.0 : -0.72);
    const sweepMax = step === 0 ?  0.5 : (step === 2 ?  1.6 :  0.72);
    const sweep = sweepMin + eased * (sweepMax - sweepMin);
    const arcMult = step === 0 ? 0.7 : (step === 2 ? 1.25 : 1);
    const isFinisher = step === 2;
    const weaponAngle = baseAngle + sweep;
    const originX = actor.x + facing.x * 10;
    const originY = actor.y - 26 + facing.y * 7;
    const weaponLength = 58 * scale;
    const handleLength = 14 * scale;
    const arcRadius = 48 * scale * arcMult;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(weaponAngle);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isEnemy) {
      ctx.globalAlpha = 0.5 + progress * 0.35;
      ctx.shadowBlur = 18 * scale;
      ctx.shadowColor = color;
      ctx.strokeStyle = withAlpha(color, 0.7);
      ctx.lineWidth = 17 * scale;
      ctx.beginPath();
      ctx.moveTo(-handleLength, 0);
      ctx.lineTo(weaponLength + 12 * scale, 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    if (isEnemy) {
      ctx.strokeStyle = "rgba(67,54,56,0.32)";
      ctx.lineWidth = 11 * scale;
      ctx.beginPath();
      ctx.moveTo(-handleLength, 0);
      ctx.lineTo(weaponLength, 0);
      ctx.stroke();

      ctx.strokeStyle = "#6b4a3d";
      ctx.lineWidth = 7 * scale;
      ctx.beginPath();
      ctx.moveTo(-handleLength, 0);
      ctx.lineTo(weaponLength, 0);
      ctx.stroke();

      ctx.strokeStyle = "#f4dfbf";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(4 * scale, -2 * scale);
      ctx.lineTo(weaponLength - 5 * scale, -2 * scale);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(actor.x + facing.x * 28, actor.y - 28 + facing.y * 18);
    ctx.rotate(baseAngle);
    if (!isEnemy) {
      ctx.globalAlpha = 0.26 + Math.sin(progress * Math.PI) * 0.34;
      ctx.shadowBlur = 24 * scale;
      ctx.shadowColor = color;
      ctx.strokeStyle = withAlpha(color, 0.52);
      ctx.lineWidth = 22 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius + 6 * scale + progress * 26 * scale, -1.02 + sweep * 0.35, 1.02 + sweep * 0.35);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.max(0.12, 0.58 - progress * 0.35);
      ctx.strokeStyle = "rgba(255,255,255,0.86)";
      ctx.lineWidth = 9 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius + 16 * scale + progress * 26 * scale, -0.72 + sweep * 0.35, 0.72 + sweep * 0.35);
      ctx.stroke();
      for (let i = 0; i < 3; i += 1) {
        const lane = -0.34 + i * 0.34;
        ctx.globalAlpha = Math.max(0, 0.48 - progress * 0.24 - i * 0.06);
        ctx.strokeStyle = withAlpha(color, 0.82);
        ctx.lineWidth = (4 - i * 0.6) * scale;
        ctx.beginPath();
        ctx.moveTo(12 * scale, lane * 34 * scale);
        ctx.lineTo((76 + progress * 34) * scale, lane * (48 + progress * 22) * scale);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (isEnemy) {
      ctx.globalAlpha = 0.34 + progress * 0.32;
      ctx.shadowBlur = 16 * scale;
      ctx.shadowColor = color;
      ctx.strokeStyle = withAlpha(color, 0.72);
      ctx.lineWidth = 15 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius + progress * 20 * scale, -0.9 + sweep * 0.35, 0.9 + sweep * 0.35);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = Math.max(0.18, 1 - progress * 0.55);
    ctx.strokeStyle = color;
    ctx.lineWidth = 7 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, arcRadius + progress * 18 * scale, -0.82 + sweep * 0.35, 0.82 + sweep * 0.35);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, arcRadius + 5 * scale + progress * 16 * scale, -0.7 + sweep * 0.35, 0.7 + sweep * 0.35);
    ctx.stroke();
    if (!isEnemy && isFinisher) {
      ctx.globalAlpha = Math.max(0.16, 0.7 - progress * 0.35);
      ctx.shadowBlur = 28 * scale;
      ctx.shadowColor = COLORS.gold;
      ctx.strokeStyle = withAlpha(COLORS.gold, 0.92);
      ctx.lineWidth = 5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius + 22 * scale + progress * 32 * scale, -1.0 + sweep * 0.35, 1.0 + sweep * 0.35);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (!isEnemy && step === 0) {
      // Quick jab: sharp white poke ahead instead of wide arc highlight.
      ctx.globalAlpha = Math.max(0.2, 0.85 - progress * 0.5);
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(arcRadius * 0.35, 0);
      ctx.lineTo(arcRadius + 28 * scale + progress * 14 * scale, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function getActorFacing(actor) {
    if (actor.attackTimer > 0 && Number.isFinite(actor.attackDirX) && Number.isFinite(actor.attackDirY)) {
      return { x: actor.attackDirX, y: actor.attackDirY };
    }
    if (actor.role) {
      return { x: actor.aimX || actor.dirX || 1, y: actor.aimY || actor.dirY || 0 };
    }
    return { x: actor.dirX || 1, y: actor.dirY || 0 };
  }

  function drawEnemyCrown(enemy) {
    if (enemy.rank < 4) return;
    ctx.save();
    ctx.translate(enemy.x, enemy.y - 91);
    ctx.fillStyle = enemy.rank >= 6 ? COLORS.gold : enemy.rankInfo.color;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    if (enemy.rank >= 6) {
      ctx.beginPath();
      ctx.moveTo(-18, 14);
      ctx.lineTo(-10, -9);
      ctx.lineTo(0, 8);
      ctx.lineTo(11, -12);
      ctx.lineTo(18, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (isRangedEnemy(enemy)) {
      ctx.rotate(Math.PI / 4);
      roundRect(-12, -12, 24, 24, 5);
      ctx.fill();
      ctx.stroke();
    } else {
      roundRect(-18, -7, 36, 22, 4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDrops() {
    const game = state.game;
    for (const drop of game.drops) {
      drawDrop(drop);
    }
  }

  function drawDrop(drop) {
    const y = drop.y + Math.sin(drop.bob) * 4;
    drawShadow(drop.x, drop.y + 13, 16, "rgba(58,48,50,0.14)");
    ctx.save();
    if (drop.type === "dango") {
      drawImageAsset("heart", drop.x - 16, y - 17, 0.42);
    } else if (drop.type === "coin") {
      drawCoinDrop(drop.x, y);
    } else {
      ctx.fillStyle = drop.type === "rebel" ? COLORS.red : drop.type === "guard" ? COLORS.blue : COLORS.gold;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(drop.x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const label = drop.type === "sandal" ? "草" : drop.type === "guard" ? "守" : "反";
      drawText(label, drop.x, y + 6, 15, "#ffffff", "center", "bold");
    }
    ctx.restore();
  }

  function drawCoinDrop(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#f2cf63";
    ctx.strokeStyle = "#4f3d36";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#c99534";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 11, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(2, -12);
    ctx.stroke();
    ctx.restore();
  }

  function drawBomb(bomb) {
    ctx.save();
    if (!bomb.landed) {
      ctx.translate(bomb.x, bomb.y);
      ctx.shadowBlur = 10;
      ctx.shadowColor = bomb.color;
      ctx.fillStyle = "#3a3032";
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = bomb.color;
      ctx.beginPath();
      ctx.arc(0, -8, 3, 0, Math.PI * 2);
      ctx.fill();
      const sparkAngle = performance.now() / 60;
      ctx.strokeStyle = "#ffcc44";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sparkAngle) * 2, -10);
      ctx.lineTo(Math.cos(sparkAngle + 1) * 6, -16);
      ctx.stroke();
    } else {
      const urgency = clamp(1 - bomb.fuseTimer / 1.5, 0, 1);
      const blinkRate = 80 + (1 - urgency) * 200;
      const blink = Math.sin(performance.now() / blinkRate) > 0;
      ctx.globalAlpha = 0.15 + urgency * 0.25;
      ctx.fillStyle = withAlpha(COLORS.red, 0.3 + urgency * 0.3);
      ctx.strokeStyle = withAlpha(COLORS.red, 0.5 + urgency * 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, bomb.blastRadius * (0.8 + urgency * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.translate(bomb.x, bomb.y);
      ctx.shadowBlur = blink ? 14 : 6;
      ctx.shadowColor = blink ? COLORS.red : bomb.color;
      ctx.fillStyle = blink ? "#5a2020" : "#3a3032";
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (blink) {
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(0, -8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      const sparkLen = 4 + urgency * 8;
      ctx.strokeStyle = "#ffcc44";
      ctx.lineWidth = 2;
      const sparkT = performance.now() / (40 + (1 - urgency) * 60);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(Math.cos(sparkT) * sparkLen, -10 - sparkLen);
      ctx.stroke();
      ctx.strokeStyle = "#ff8844";
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(Math.cos(sparkT + 2) * sparkLen * 0.7, -10 - sparkLen * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLineAttacks(game) {
    for (const enemy of game.enemies) {
      if (!enemy.lineAttackActive) continue;
      const progress = 1 - enemy.lineAttackTimer / enemy.lineAttackMaxTimer;
      const fade = enemy.lineAttackTimer < 0.12 ? enemy.lineAttackTimer / 0.12 : 1;
      const ox = enemy.lineAttackOriginX;
      const oy = enemy.lineAttackOriginY;
      const dx = enemy.lineAttackDirX;
      const dy = enemy.lineAttackDirY;
      const range = enemy.lineAttackRange;
      const endX = ox + dx * range;
      const endY = oy + dy * range;
      const angle = Math.atan2(dy, dx);
      const width = enemy.lineAttackWidth * 2;
      ctx.save();
      const beamColor = enemy.rankInfo.color;
      ctx.globalAlpha = 0.35 * fade;
      ctx.shadowBlur = 32;
      ctx.shadowColor = beamColor;
      ctx.strokeStyle = withAlpha(beamColor, 0.6);
      ctx.lineWidth = width + 20;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.globalAlpha = 0.7 * fade;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = withAlpha(beamColor, 0.85);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.globalAlpha = 0.9 * fade;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#fff";
      ctx.strokeStyle = "rgba(255,240,255,0.95)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      const scytheCount = 3;
      for (let i = 0; i < scytheCount; i++) {
        const t = (i + 1) / (scytheCount + 1);
        const sx = ox + dx * range * t;
        const sy = oy + dy * range * t;
        const spin = performance.now() / 200 + i * 2.1;
        ctx.globalAlpha = 0.8 * fade;
        ctx.shadowBlur = 12;
        ctx.shadowColor = beamColor;
        ctx.strokeStyle = "#ddd";
        ctx.fillStyle = withAlpha(beamColor, 0.5);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 16, angle + spin, angle + spin + Math.PI * 1.3);
        ctx.stroke();
        ctx.beginPath();
        const cresAngle = angle + spin + Math.PI * 0.65;
        ctx.moveTo(sx + Math.cos(cresAngle - 0.5) * 20, sy + Math.sin(cresAngle - 0.5) * 20);
        ctx.quadraticCurveTo(sx + Math.cos(cresAngle) * 32, sy + Math.sin(cresAngle) * 32, sx + Math.cos(cresAngle + 0.5) * 20, sy + Math.sin(cresAngle + 0.5) * 20);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawProjectile(projectile) {
    ctx.save();
    const alpha = clamp(projectile.life / (projectile.maxLife || 1.75), 0, 1);
    if (projectile.kind === "swordWave") {
      drawSwordWaveProjectile(projectile, alpha);
      ctx.restore();
      return;
    }
    const bossAxe = projectile.kind === "bossAxe";
    ctx.globalAlpha = Math.min(1, 0.4 + alpha);
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = bossAxe ? 5 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(projectile.x - projectile.dirX * 12, projectile.y - projectile.dirY * 9);
    ctx.lineTo(projectile.x - projectile.dirX * (bossAxe ? 78 : 44), projectile.y - projectile.dirY * (bossAxe ? 48 : 28));
    ctx.stroke();
    ctx.strokeStyle = withAlpha(projectile.color, bossAxe ? 0.68 : 0.55);
    ctx.lineWidth = bossAxe ? 12 : 6;
    ctx.beginPath();
    ctx.moveTo(projectile.x - projectile.dirX * 8, projectile.y - projectile.dirY * 6);
    ctx.lineTo(projectile.x - projectile.dirX * (bossAxe ? 60 : 34), projectile.y - projectile.dirY * (bossAxe ? 38 : 22));
    ctx.stroke();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(projectile.spin);
    ctx.shadowBlur = bossAxe ? 20 : 12;
    ctx.shadowColor = projectile.color;
    if (bossAxe) drawBossAxeShape(projectile.radius + 3, projectile.color);
    else if (projectile.kind === "acorn") drawAcornShape(projectile.radius + 2, projectile.color);
    else drawShurikenShape(0, 0, projectile.radius + 3, projectile.color);
    ctx.restore();
  }

  function drawSwordWaveProjectile(p, alpha) {
    const angle = Math.atan2(p.dirY, p.dirX);
    ctx.globalAlpha = Math.min(1, 0.5 + alpha * 0.5);
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.shadowBlur = 16;
    ctx.shadowColor = p.color;
    ctx.strokeStyle = withAlpha(p.color, 0.5);
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-36, 0);
    ctx.stroke();
    ctx.fillStyle = "#dfe7ee";
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.radius + 4, 0);
    ctx.lineTo(-2, -p.radius * 0.6);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-2, p.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(p.radius, 0);
    ctx.lineTo(2, -p.radius * 0.28);
    ctx.lineTo(2, p.radius * 0.28);
    ctx.closePath();
    ctx.fill();
  }

  function drawBossAxeShape(radius, color) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#5a3f36";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-radius * 1.05, 0);
    ctx.lineTo(radius * 1.05, 0);
    ctx.stroke();
    ctx.strokeStyle = "#f0d292";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, -3);
    ctx.lineTo(radius * 0.72, -3);
    ctx.stroke();
    ctx.fillStyle = "#dfe7ee";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(radius * 0.18, -radius * 0.72);
    ctx.quadraticCurveTo(radius * 1.05, -radius * 0.45, radius * 0.92, radius * 0.28);
    ctx.quadraticCurveTo(radius * 0.54, radius * 0.12, radius * 0.12, radius * 0.5);
    ctx.lineTo(-radius * 0.08, radius * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawAcornShape(radius, color) {
    ctx.save();
    ctx.fillStyle = "#8b6542";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.1, radius * 0.7, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c49a5c";
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.35, radius * 0.72, radius * 0.42, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawShurikenShape(x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#dfe7ee";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(radius, -radius * 0.36);
      ctx.lineTo(radius * 0.42, 0);
      ctx.lineTo(radius, radius * 0.36);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawEffects() {
    const game = state.game;
    for (const effect of game.effects) {
      const progress = effect.age / (effect.age + effect.life);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.translate(effect.x, effect.y);
      ctx.rotate(effect.angle || 0);
      if (effect.type === "slash" || effect.type === "swing") {
        ctx.strokeStyle = effect.type === "slash" ? effect.color : "rgba(67,54,56,0.56)";
        ctx.lineWidth = effect.type === "slash" ? 9 : 5;
        ctx.beginPath();
        ctx.arc(0, 0, 46 + progress * 12, -0.8, 0.7);
        ctx.stroke();
      }
      if (effect.type === "hit") {
        ctx.fillStyle = effect.color;
        star(0, 0, 9 + progress * 18, 5);
      }
      if (effect.type === "playerHit") {
        ctx.shadowBlur = 16;
        ctx.shadowColor = COLORS.red;
        ctx.fillStyle = "rgba(185,77,69,0.85)";
        star(0, 0, 16 + progress * 22, 7);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-44 - progress * 12, -15);
        ctx.lineTo(16 + progress * 18, 8);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-32 - progress * 10, 12);
        ctx.lineTo(24 + progress * 18, -10);
        ctx.stroke();
      }
      if (effect.type === "impactRing") {
        const ring = 18 + progress * 58;
        ctx.strokeStyle = withAlpha(effect.color, 0.72);
        ctx.lineWidth = 7 * (1 - progress) + 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring, ring * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring * 0.74, ring * 0.44, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (effect.type === "attackFlash") {
        ctx.shadowBlur = 18;
        ctx.shadowColor = effect.color;
        ctx.fillStyle = withAlpha(effect.color, 0.62);
        star(0, 0, 13 + progress * 14, 6);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.82)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i += 1) {
          const offset = -0.36 + i * 0.24;
          ctx.beginPath();
          ctx.moveTo(8, offset * 26);
          ctx.lineTo(36 + progress * 34, offset * 52);
          ctx.stroke();
        }
      }
      if (effect.type === "bossAxeThrow") {
        ctx.shadowBlur = 24;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.78);
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        for (let i = 0; i < 4; i += 1) {
          const offset = -0.44 + i * 0.28;
          ctx.beginPath();
          ctx.moveTo(-12, offset * 24);
          ctx.lineTo(58 + progress * 48, offset * 58);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.rotate(progress * Math.PI * 3);
        drawBossAxeShape(19 + progress * 8, effect.color);
      }
      if (effect.type === "bossSmash") {
        ctx.shadowBlur = 26;
        ctx.shadowColor = effect.color;
        ctx.fillStyle = withAlpha(effect.color, 0.54);
        star(0, 0, 18 + progress * 24, 7);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.86)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 44 + progress * 52, -0.72, 0.72);
        ctx.stroke();
      }
      if (effect.type === "shurikenThrow") {
        ctx.shadowBlur = 16;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.78);
        ctx.lineWidth = 5;
        for (let i = 0; i < 5; i += 1) {
          const offset = -0.44 + i * 0.22;
          ctx.beginPath();
          ctx.moveTo(-8, offset * 20);
          ctx.lineTo(24 + progress * 34, offset * 38);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.rotate(progress * Math.PI * 4);
        drawShurikenShape(18 + progress * 18, 0, 8 + progress * 4, effect.color);
      }
      if (effect.type === "enemySpark") {
        ctx.shadowBlur = 18;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.9);
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-22 - progress * 10, 0);
        ctx.lineTo(42 + progress * 28, 0);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i += 1) {
          const angle = -0.72 + i * 0.36;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 8);
          ctx.lineTo(Math.cos(angle) * (36 + progress * 24), Math.sin(angle) * (22 + progress * 16));
          ctx.stroke();
        }
      }
      if (effect.type === "shurikenHit") {
        ctx.shadowBlur = 18;
        ctx.shadowColor = effect.color;
        ctx.fillStyle = withAlpha(effect.color, 0.7);
        star(0, 0, 11 + progress * 18, 6);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI * 2 * i) / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
          ctx.lineTo(Math.cos(angle) * (24 + progress * 20), Math.sin(angle) * (24 + progress * 20));
          ctx.stroke();
        }
      }
      if (effect.type === "bossShockwave") {
        const ring = 26 + progress * 96;
        ctx.shadowBlur = 20;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.78);
        ctx.lineWidth = 10 * (1 - progress) + 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring, ring * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring * 0.7, ring * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (effect.type === "bossDefeat") {
        ctx.shadowBlur = 28;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.9);
        ctx.lineWidth = 7;
        for (let i = 0; i < 12; i += 1) {
          const angle = (Math.PI * 2 * i) / 12;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 12);
          ctx.lineTo(Math.cos(angle) * (54 + progress * 76), Math.sin(angle) * (38 + progress * 54));
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,248,220,0.76)";
        star(0, 0, 24 + progress * 34, 8);
      }
      if (effect.type === "guardFlash") {
        const ring = 20 + progress * 34;
        ctx.strokeStyle = withAlpha(effect.color, 0.82);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, ring, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.68)";
        star(0, 0, 10 + progress * 12, 6);
      }
      if (effect.type === "specialAura") {
        const pulse = Math.sin(progress * Math.PI);
        ctx.shadowBlur = 26;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.78);
        ctx.lineWidth = 6 * (1 - progress) + 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 42 + progress * 84, 28 + progress * 46, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha *= 0.72;
        ctx.fillStyle = withAlpha(effect.color, 0.24 + pulse * 0.18);
        star(0, -6, 22 + pulse * 15, 8);
      }
      if (effect.type === "chiikawaGuard") {
        ctx.strokeStyle = withAlpha(effect.color, 0.86);
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i += 1) {
          const angle = progress * Math.PI * 2 + i * (Math.PI * 2 / 3);
          const hx = Math.cos(angle) * (32 + progress * 24);
          const hy = Math.sin(angle) * (20 + progress * 18);
          ctx.beginPath();
          ctx.moveTo(hx, hy + 10);
          ctx.bezierCurveTo(hx - 16, hy, hx - 12, hy - 15, hx, hy - 8);
          ctx.bezierCurveTo(hx + 12, hy - 15, hx + 16, hy, hx, hy + 10);
          ctx.fill();
          ctx.stroke();
        }
      }
      if (effect.type === "hachiwareBlast") {
        const baseRadius = 240;
        ctx.save();
        ctx.shadowColor = effect.color;
        for (let i = 0; i < 3; i += 1) {
          const ringStart = i * 0.18;
          const ringP = clamp((progress - ringStart) / (1 - ringStart), 0, 1);
          if (ringP <= 0) continue;
          const r = ringP * (baseRadius - i * 26);
          ctx.globalAlpha = (1 - ringP) * 0.7;
          ctx.shadowBlur = 26;
          ctx.lineWidth = 14 - i * 3;
          ctx.strokeStyle = withAlpha(effect.color, 0.85);
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = (1 - ringP) * 0.85;
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(255,255,255,0.92)";
          ctx.beginPath();
          ctx.ellipse(0, 0, r + 6, r * 0.62 + 4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = (1 - progress) * 0.55;
        ctx.lineWidth = 4;
        ctx.strokeStyle = withAlpha(effect.color, 0.78);
        ctx.shadowBlur = 16;
        for (let i = 0; i < 12; i += 1) {
          const angle = (Math.PI * 2 * i) / 12 + progress * 0.6;
          const innerR = 36 + progress * 60;
          const outerR = 90 + progress * (baseRadius - 60);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR * 0.62);
          ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR * 0.62);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = (1 - progress) * 0.95;
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8 + progress * Math.PI;
          const r = 110 + progress * 100;
          star(Math.cos(angle) * r, Math.sin(angle) * r * 0.62, 6 + (1 - progress) * 6, 5);
        }
        ctx.restore();
      }
      if (effect.type === "hachiwareChord") {
        ctx.strokeStyle = withAlpha(effect.color, 0.86);
        ctx.lineWidth = 5;
        for (let i = 0; i < 5; i += 1) {
          const angle = -Math.PI * 0.82 + i * (Math.PI * 0.41) + progress * 0.18;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 28, Math.sin(angle) * 18);
          ctx.lineTo(Math.cos(angle) * (88 + progress * 36), Math.sin(angle) * (56 + progress * 26));
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        for (let i = 0; i < 4; i += 1) {
          const angle = progress * Math.PI * 2 + i * Math.PI / 2;
          star(Math.cos(angle) * 56, Math.sin(angle) * 32, 8 + progress * 7, 5);
        }
      }
      if (effect.type === "usagiBurst") {
        ctx.shadowBlur = 22;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.9);
        ctx.lineWidth = 8 * (1 - progress) + 3;
        ctx.lineCap = "round";
        for (let i = 0; i < 7; i += 1) {
          const offset = -0.72 + i * 0.24;
          ctx.beginPath();
          ctx.moveTo(-28, offset * 26);
          ctx.lineTo(56 + progress * 96, offset * (48 + progress * 52));
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.84)";
        star(22 + progress * 60, 0, 18 + progress * 18, 7);
      }
      if (effect.type === "playerSlashImpact") {
        ctx.shadowBlur = 20;
        ctx.shadowColor = effect.color;
        ctx.strokeStyle = withAlpha(effect.color, 0.9);
        ctx.lineWidth = 6;
        for (let i = 0; i < 6; i += 1) {
          const angle = -0.95 + i * 0.38;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
          ctx.lineTo(Math.cos(angle) * (32 + progress * 32), Math.sin(angle) * (22 + progress * 26));
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        star(0, 0, 11 + progress * 15, 6);
      }
      if (effect.type === "slash" && state.sheet.slash) {
        ctx.rotate(0.1);
        const scale = 0.58 + progress * 0.12;
        drawFrame(state.sheet.slash, 8, -52 * scale, 118 * scale, 74 * scale);
      }
      if (effect.type === "burst") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
          ctx.lineTo(Math.cos(angle) * (24 + progress * 28), Math.sin(angle) * (24 + progress * 28));
          ctx.stroke();
        }
      }
      if (effect.type === "dust") {
        ctx.fillStyle = "rgba(255,255,255,0.42)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 28 + progress * 18, 10 + progress * 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (effect.type === "dashLine") {
        ctx.strokeStyle = withAlpha(effect.color, 0.68);
        ctx.lineWidth = 5 * (1 - progress) + 1;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i += 1) {
          const y = (i - 1) * 9;
          ctx.beginPath();
          ctx.moveTo(-42 - progress * 18, y);
          ctx.lineTo(10 - progress * 6, y * 0.35);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawFloaters() {
    const game = state.game;
    game.floaters.forEach((floater) => {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawText(floater.text, floater.x, floater.y, 19, floater.color, "center", "bold");
      ctx.restore();
    });
  }

  function drawSprite(row, frame, x, y, scale, flip) {
    const image = state.sprites[row][frame] || state.sprites[row].front;
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    drawFrame(image, -w / 2, -h, w, h);
    ctx.restore();
  }

  function drawRoleSprite(role, animation, frameIndex, x, y, scale, flip) {
    const spriteSet = state.characterSprites[role.spriteKey];
    const frames = spriteSet && spriteSet[animation];
    const frame = frames && frames[frameIndex % frames.length];
    if (frame) {
      drawCharacterFrame(frame, x, y, scale, flip);
      return;
    }
    drawSprite(role.row, animation === "attack" ? "weapon" : "front", x, y, scale, flip);
  }

  function drawCharacterFrame(frame, x, y, scale, flip, options = {}) {
    const w = frame.width * scale;
    const h = frame.height * scale;
    ctx.save();
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.translate(x + (options.offsetX || 0), y + (options.offsetY || 0));
    ctx.rotate(options.rotation || 0);
    ctx.scale((flip ? -1 : 1) * (options.scaleX || 1), options.scaleY || 1);
    drawFrame(frame, -w / 2, -h, w, h);
    ctx.restore();
  }

  function drawImageAsset(name, x, y, scale = 1) {
    const image = state.sheet[name];
    if (!image) return;
    drawFrame(image, x, y, image.width * scale, image.height * scale);
  }

  function drawFrame(frame, x, y, w, h) {
    ctx.save();
    if (frame.raw) {
      ctx.globalCompositeOperation = "multiply";
    }
    ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
    ctx.restore();
  }

  function drawHealth(x, y, w, h, ratio, color) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(67,54,56,0.48)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    roundRect(x + 3, y + 3, Math.max(0, (w - 6) * clamp(ratio, 0, 1)), h - 6, h / 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRankTag(x, y, text, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,248,235,0.9)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    roundRect(x - 34, y - 18, 68, 28, 8);
    ctx.fill();
    ctx.stroke();
    drawText(text, x, y + 1, 16, COLORS.ink, "center", "bold");
    ctx.restore();
  }

  function drawShadow(x, y, radius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + 10, radius, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawButton(x, y, w, h, label, sub, onClick, variant = "primary") {
    const pointerInside = pointInRect(state.pointer, { x, y, w, h });
    ctx.save();
    ctx.fillStyle = variant === "primary" ? (pointerInside ? "#fff3b8" : "#fff7df") : pointerInside ? "#eaf4f2" : "#fffaf4";
    ctx.strokeStyle = variant === "primary" ? COLORS.red : "rgba(67,54,56,0.62)";
    ctx.lineWidth = variant === "primary" ? 4 : 3;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    drawText(label, x + w / 2, y + h / 2 - 2, 25, COLORS.ink, "center", "bold");
    if (sub) drawText(sub, x + w / 2, y + h - 9, 12, COLORS.muted, "center", "bold");
    ctx.restore();
    state.buttons.push({ x, y, w, h, onClick });
  }

  function drawCard(x, y, w, h, fill, selected, accent = COLORS.red) {
    ctx.save();
    ctx.fillStyle = fill;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    if (selected) {
      ctx.fillStyle = withAlpha(accent, 0.1);
      roundRect(x + 10, y + 10, w - 20, h - 20, 6);
      ctx.fill();
    }
    ctx.strokeStyle = selected ? accent : "rgba(67,54,56,0.52)";
    ctx.lineWidth = selected ? 5 : 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    roundRect(x + 10, y + 10, w - 20, h - 20, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.stroke();
    ctx.restore();
  }

  function drawSelectedCorner(x, y, color) {
    ctx.save();
    ctx.fillStyle = withAlpha(color, 0.82);
    ctx.beginPath();
    ctx.moveTo(x + 250, y);
    ctx.lineTo(x + 250, y + 54);
    ctx.lineTo(x + 196, y);
    ctx.closePath();
    ctx.fill();
    drawText("选中", x + 226, y + 18, 13, "#fffaf0", "center", "bold");
    ctx.restore();
  }

  function drawPaperPanel(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(255,250,243,0.88)";
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(67,54,56,0.74)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(185,77,69,0.38)";
    ctx.lineWidth = 2;
    roundRect(x + 9, y + 9, w - 18, h - 18, 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawText(text, x, y, size, color, align = "left", weight = "normal") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.font = `${weight} ${size}px "Hiragino Maru Gothic ProN", "Yu Gothic", "Microsoft YaHei", system-ui, sans-serif`;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  function star(x, y, radius, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * i) / points;
      const length = i % 2 === 0 ? radius : radius * 0.42;
      const px = x + Math.cos(angle) * length;
      const py = y + Math.sin(angle) * length;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function withAlpha(hex, alpha) {
    if (!hex || hex[0] !== "#" || hex.length !== 7) return `rgba(185,77,69,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
})();
