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

  function updateBosses(state, delta, onVolley = () => {}) {
    for (const boss of state.enemies.filter((enemy) => enemy.type === "boss")) {
      boss.bossFireCooldown = Math.max(0, (boss.bossFireCooldown || 0) - delta);
      if (boss.bossFireCooldown > 0) continue;
      const phase = getBossPhase(boss);
      const pattern = getBossPattern(boss, phase);
      const bullets = createBossAttack(pattern, boss, state.player);
      state.enemyBullets.push(...bullets);
      boss.bossFireCooldown = PHASES[phase].cooldown;
      boss.bossAttackIndex = (boss.bossAttackIndex || 0) + 1;
      state.shake = Math.max(state.shake || 0, 0.14);
      onVolley({ boss, bullets, pattern, phase });
    }
  }

  function createBossAttack(pattern, boss, player) {
    if (pattern === "aimedBurst") return createAimedBurst(boss, player);
    if (pattern === "mineRing") return createMineRing(boss);
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

  function getBossPattern(boss, phase) {
    const patterns = PATTERNS[phase] || PATTERNS[1];
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
    createMineRing,
    getBossPattern,
    getBossPhase,
    updateBosses,
  };
})();
