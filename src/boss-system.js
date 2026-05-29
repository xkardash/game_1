(() => {
  const PHASES = {
    1: { cooldown: 2.4, count: 8, speed: 240 },
    2: { cooldown: 1.85, count: 12, speed: 285 },
    3: { cooldown: 1.35, count: 14, speed: 325 },
  };
  const PATTERNS = {
    1: ["radialVolley"],
    2: ["radialVolley", "aimedBurst"],
    3: ["radialVolley", "aimedBurst", "mineRing"],
  };
  const ARCHETYPE_PATTERNS = {
    bulwark: {
      1: ["bulwarkBarrage"],
      2: ["bulwarkBarrage", "radialVolley"],
      3: ["bulwarkBarrage", "mineRing"],
    },
    core: {
      1: ["coreMineRing"],
      2: ["coreMineRing", "radialVolley"],
      3: ["coreMineRing", "aimedBurst", "mineRing"],
    },
    phase: {
      1: ["phaseStrafe"],
      2: ["phaseStrafe", "aimedBurst"],
      3: ["phaseStrafe", "aimedBurst", "mineRing"],
    },
  };
  const TELEGRAPH_WINDUP = 0.42;
  const TELEGRAPHED_PATTERNS = new Set(["bulwarkBarrage", "coreMineRing", "phaseStrafe"]);

  function updateBosses(state, delta, onVolley = () => {}, onTelegraph = () => {}) {
    window.BossPhase?.updateFlashes(state, delta);
    updateBossTelegraphs(state, delta);
    for (const boss of state.enemies.filter((enemy) => enemy.type === "boss")) {
      const phase = getBossPhase(boss);
      window.BossPhase?.trackPhase(state, boss, phase);
      if (boss.pendingBossAttack) {
        boss.pendingBossAttack.windup -= delta;
        if (boss.pendingBossAttack.windup > 0) continue;
        fireBossAttack(state, boss, boss.pendingBossAttack.pattern, boss.pendingBossAttack.phase, onVolley);
        boss.pendingBossAttack = null;
        continue;
      }
      boss.bossFireCooldown = Math.max(0, (boss.bossFireCooldown || 0) - delta);
      if (boss.bossFireCooldown > 0) continue;
      const pattern = getBossPattern(boss, phase);
      if (shouldTelegraphAttack(boss, pattern)) {
        startBossTelegraph(state, boss, pattern, phase, onTelegraph);
        continue;
      }
      fireBossAttack(state, boss, pattern, phase, onVolley);
    }
  }

  function fireBossAttack(state, boss, pattern, phase, onVolley) {
    const bullets = createBossAttack(pattern, boss, state.player);
    if (!state.enemyBullets) state.enemyBullets = [];
    state.enemyBullets.push(...bullets);
    state.lastBossAttackPattern = pattern;
    boss.lastBossPattern = pattern;
    boss.bossFireCooldown = PHASES[phase].cooldown;
    boss.bossAttackIndex = (boss.bossAttackIndex || 0) + 1;
    state.shake = Math.max(state.shake || 0, 0.14);
    onVolley({ boss, bullets, pattern, phase });
  }

  function startBossTelegraph(state, boss, pattern, phase, onTelegraph) {
    if (!state.bossTelegraphs) state.bossTelegraphs = [];
    const telegraph = createBossTelegraph(boss, pattern, phase);
    state.bossTelegraphs.push(telegraph);
    boss.pendingBossAttack = { pattern, phase, windup: TELEGRAPH_WINDUP };
    state.lastBossTelegraphPattern = pattern;
    state.shake = Math.max(state.shake || 0, 0.08);
    onTelegraph({ boss, pattern, phase, telegraph });
  }

  function createBossTelegraph(boss, pattern, phase) {
    const profile = getTelegraphProfile(pattern);
    return {
      x: boss.x,
      y: boss.y,
      pattern,
      color: profile.color,
      radius: profile.radius + phase * 8,
      lineWidth: profile.lineWidth + phase,
      life: TELEGRAPH_WINDUP,
      maxLife: TELEGRAPH_WINDUP,
      marks: profile.marks,
    };
  }

  function getTelegraphProfile(pattern) {
    if (pattern === "bulwarkBarrage") return { color: "#d7a64f", radius: 72, lineWidth: 2, marks: 6 };
    if (pattern === "coreMineRing") return { color: "#f0a040", radius: 88, lineWidth: 3, marks: 12 };
    if (pattern === "phaseStrafe") return { color: "#7df8ff", radius: 66, lineWidth: 2, marks: 4 };
    return { color: "#e8573f", radius: 62, lineWidth: 2, marks: 8 };
  }

  function shouldTelegraphAttack(boss, pattern) {
    return Boolean(boss.bossArchetype && TELEGRAPHED_PATTERNS.has(pattern));
  }

  function updateBossTelegraphs(state, delta) {
    if (!state.bossTelegraphs) return;
    for (const telegraph of state.bossTelegraphs) telegraph.life -= delta;
    for (let index = state.bossTelegraphs.length - 1; index >= 0; index -= 1) {
      if (state.bossTelegraphs[index].life <= 0) state.bossTelegraphs.splice(index, 1);
    }
  }

  function createBossAttack(pattern, boss, player) {
    if (pattern === "aimedBurst") return createAimedBurst(boss, player);
    if (pattern === "bulwarkBarrage") return createBulwarkBarrage(boss, player);
    if (pattern === "coreMineRing") return createCoreMineRing(boss);
    if (pattern === "mineRing") return createMineRing(boss);
    if (pattern === "phaseStrafe") return createPhaseStrafe(boss, player);
    return createBossVolley(boss, player);
  }

  function createBossVolley(boss, player) {
    const phase = PHASES[getBossPhase(boss)];
    const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    return Array.from({ length: phase.count }, (_, index) => {
      const angle = baseAngle + (Math.PI * 2 * index) / phase.count;
      return {
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * phase.speed,
        vy: Math.sin(angle) * phase.speed,
        width: 11,
        height: 11,
        life: 4,
        color: phase.count > 12 ? "#f2dfb6" : "#e8573f",
        trailColor: "#f0a040",
        style: "bossVolley",
      };
    });
  }

  function createAimedBurst(boss, player) {
    const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    return [-0.24, -0.12, 0, 0.12, 0.24].map((offset) => {
      const angle = baseAngle + offset;
      return {
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * 390,
        vy: Math.sin(angle) * 390,
        width: 9,
        height: 9,
        life: 3.2,
        damage: 1,
        color: "#f2dfb6",
        trailColor: "#e8573f",
        style: "bossBurst",
      };
    });
  }

  function createBulwarkBarrage(boss, player) {
    const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    return [-0.42, -0.24, -0.08, 0.08, 0.24, 0.42].map((offset) => {
      const angle = baseAngle + offset;
      return {
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * 232,
        vy: Math.sin(angle) * 232,
        width: 16,
        height: 16,
        life: 4.8,
        damage: 1,
        color: "#d7a64f",
        trailColor: "#f0a040",
        style: "bulwarkShot",
      };
    });
  }

  function createPhaseStrafe(boss, player) {
    const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const strafeDirection = boss.phaseStrafeDirection || 1;
    boss.x += Math.cos(baseAngle + Math.PI / 2) * strafeDirection * 44;
    boss.y += Math.sin(baseAngle + Math.PI / 2) * strafeDirection * 44;
    boss.phaseStrafeDirection = -strafeDirection;
    return [-0.32, -0.2, -0.09, 0, 0.09, 0.2, 0.32].map((offset) => {
      const angle = baseAngle + offset;
      return {
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * 442,
        vy: Math.sin(angle) * 442,
        width: 8,
        height: 8,
        life: 2.8,
        damage: 1,
        color: "#d9fbff",
        trailColor: "#7df8ff",
        style: "phaseShard",
      };
    });
  }

  function createMineRing(boss) {
    return Array.from({ length: 10 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 10;
      return {
        x: boss.x + Math.cos(angle) * 30,
        y: boss.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 76,
        vy: Math.sin(angle) * 76,
        width: 18,
        height: 18,
        life: 5.2,
        damage: 1,
        color: "#f0a040",
        trailColor: "#f2dfb6",
        style: "bossMine",
      };
    });
  }

  function createCoreMineRing(boss) {
    return Array.from({ length: 12 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 12;
      return {
        x: boss.x + Math.cos(angle) * 38,
        y: boss.y + Math.sin(angle) * 38,
        vx: Math.cos(angle) * 58,
        vy: Math.sin(angle) * 58,
        width: 22,
        height: 22,
        life: 6.4,
        damage: 1,
        color: "#f0a040",
        trailColor: "#f2dfb6",
        style: "coreMine",
      };
    });
  }

  function getBossPattern(boss, phase) {
    const archetypePatterns = ARCHETYPE_PATTERNS[boss.bossArchetype]?.[phase];
    const patterns = archetypePatterns || PATTERNS[phase] || PATTERNS[1];
    return patterns[(boss.bossAttackIndex || 0) % patterns.length];
  }

  function getBossPhase(boss) {
    const ratio = boss.hp / boss.maxHp;
    if (ratio <= 0.3) return 3;
    if (ratio <= 0.65) return 2;
    return 1;
  }

  window.BossSystem = {
    createAimedBurst,
    createBossVolley,
    createBossTelegraph,
    createBulwarkBarrage,
    createCoreMineRing,
    createMineRing,
    createPhaseStrafe,
    getBossPattern,
    getBossPhase,
    updateBosses,
  };
})();
