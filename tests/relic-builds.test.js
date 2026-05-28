const test = require("node:test");
const assert = require("node:assert/strict");
const { openGamePage } = require("./browser-driver");

test("nova core and damage evolve shots into area lance impacts", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['damage'];
      player.relics = ['novaCore'];
      player.stats.damage = 2;
      player.stats.projectileCount = 1;
      player.cooldown = 99;
      game.state.spawnDirector.spawnTimer = 99;
      const first = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      const second = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      first.x = player.x + 120;
      first.y = player.y;
      second.x = first.x + 52;
      second.y = first.y;
      first.speed = 0;
      second.speed = 0;
      first.hp = 12;
      second.hp = 12;
      game.state.enemies = [first, second];
      const bullet = window.SurvivalRules.createBullets(player, first)[0];
      const style = bullet.style;
      bullet.x = first.x;
      bullet.y = first.y;
      bullet.vx = 0;
      bullet.vy = 0;
      game.state.bullets = [bullet];
      setTimeout(() => resolve({
        style,
        evolution: window.DalgaSavunmasiTest.snapshot().weaponEvolution,
        relicSynergies: window.DalgaSavunmasiTest.snapshot().relicSynergies,
        secondHp: second.hp,
      }), 140);
    })`);

    assert.equal(result.evolution, "novaLance");
    assert.equal(result.style, "novaLance");
    assert.match(result.relicSynergies, /novaLance/);
    assert.ok(result.secondHp < 12);
  } finally {
    await page.close();
  }
});

test("void siphon and magnet create a damaging void field", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['magnet'];
      player.relics = ['voidSiphon'];
      player.stats.magnet = 118;
      player.cooldown = 99;
      game.state.spawnDirector.spawnTimer = 99;
      const near = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      const far = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      near.x = player.x + 48;
      near.y = player.y;
      far.x = player.x + 260;
      far.y = player.y;
      near.speed = 0;
      far.speed = 0;
      near.hp = 8;
      far.hp = 8;
      game.state.enemies = [near, far];
      setTimeout(() => resolve({
        relicSynergies: window.DalgaSavunmasiTest.snapshot().relicSynergies,
        relicFields: window.DalgaSavunmasiTest.snapshot().relicFields,
        nearHp: near.hp,
        farHp: far.hp,
      }), 520);
    })`);

    assert.match(result.relicSynergies, /voidField/);
    assert.ok(result.relicFields >= 1);
    assert.ok(result.nearHp < 8);
    assert.equal(result.farHp, 8);
  } finally {
    await page.close();
  }
});

test("phase injector and rapid upgrade fire piercing phase shots", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`(() => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['rapid'];
      player.relics = ['phaseInjector'];
      player.stats.projectileCount = 1;
      const enemy = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      enemy.x = player.x + 220;
      enemy.y = player.y;
      const bullet = window.SurvivalRules.createBullets(player, enemy)[0];
      return {
        evolution: window.DalgaSavunmasiTest.snapshot().weaponEvolution,
        relicSynergies: window.DalgaSavunmasiTest.snapshot().relicSynergies,
        style: bullet.style,
        speed: Math.round(Math.hypot(bullet.vx, bullet.vy)),
        pierceLeft: bullet.pierceLeft,
      };
    })()`);

    assert.equal(result.evolution, "phaseBurst");
    assert.match(result.relicSynergies, /phaseBurst/);
    assert.equal(result.style, "phaseShot");
    assert.ok(result.speed > 800);
    assert.ok(result.pierceLeft >= 1);
  } finally {
    await page.close();
  }
});
