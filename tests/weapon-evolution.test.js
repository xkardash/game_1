const test = require("node:test");
const assert = require("node:assert/strict");
const { openGamePage } = require("./browser-driver");

test("damage and split upgrades evolve into twin plasma shots", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['damage', 'split'];
      player.stats.damage = 2;
      player.stats.projectileCount = 2;
      player.cooldown = 0;
      game.state.spawnDirector.spawnTimer = 99;
      const enemy = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      enemy.x = player.x + 180;
      enemy.y = player.y - 26;
      enemy.speed = 0;
      enemy.hp = 99;
      game.state.enemies = [enemy];
      game.state.bullets = [];
      setTimeout(() => {
        const snapshot = window.DalgaSavunmasiTest.snapshot();
        resolve({
          evolution: snapshot.weaponEvolution,
          twinPlasma: snapshot.twinPlasmaBullets,
          styles: game.state.bullets.map((bullet) => bullet.style),
        });
      }, 180);
    })`);

    assert.equal(result.evolution, "twinPlasma");
    assert.ok(result.twinPlasma >= 2);
    assert.ok(result.styles.every((style) => style === "twinPlasma"));
  } finally {
    await page.close();
  }
});

test("damage and rapid upgrades evolve into piercing laser shots", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['damage', 'rapid'];
      player.stats.damage = 2;
      player.stats.projectileCount = 1;
      player.cooldown = 0;
      game.state.spawnDirector.spawnTimer = 99;
      const first = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      const second = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      first.x = player.x + 118;
      first.y = player.y;
      second.x = player.x + 205;
      second.y = player.y;
      first.speed = 0;
      second.speed = 0;
      first.hp = 1;
      second.hp = 1;
      first.height = 72;
      second.height = 72;
      game.state.enemies = [first, second];
      game.state.bullets = [];
      setTimeout(() => {
        const snapshot = window.DalgaSavunmasiTest.snapshot();
        resolve({
          evolution: snapshot.weaponEvolution,
          piercing: snapshot.piercingBullets,
          remainingEnemies: game.state.enemies.length,
        });
      }, 480);
    })`);

    assert.equal(result.evolution, "piercingLaser");
    assert.ok(result.piercing >= 1);
    assert.equal(result.remainingEnemies, 0);
  } finally {
    await page.close();
  }
});

test("engine and rapid upgrades evolve into drone support shots", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['engine', 'rapid'];
      player.stats.projectileCount = 1;
      player.cooldown = 0;
      game.state.spawnDirector.spawnTimer = 99;
      const enemy = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      enemy.x = player.x + 420;
      enemy.y = player.y - 12;
      enemy.speed = 0;
      enemy.hp = 99;
      game.state.enemies = [enemy];
      game.state.bullets = [];
      setTimeout(() => {
        const snapshot = window.DalgaSavunmasiTest.snapshot();
        resolve({
          evolution: snapshot.weaponEvolution,
          droneBullets: snapshot.droneBullets,
          origins: game.state.bullets.map((bullet) => bullet.origin || 'main'),
        });
      }, 180);
    })`);

    assert.equal(result.evolution, "droneSupport");
    assert.ok(result.droneBullets >= 2);
    assert.ok(result.origins.includes("drone"));
  } finally {
    await page.close();
  }
});
