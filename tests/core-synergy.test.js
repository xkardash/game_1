const test = require("node:test");
const assert = require("node:assert/strict");
const { openGamePage } = require("./browser-driver");

test("core-charged twin plasma burns enemies after impact", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['damage', 'split'];
      player.lootCores = 1;
      player.stats.damage = 1;
      player.stats.projectileCount = 2;
      player.cooldown = 99;
      game.state.spawnTimer = 99;
      const enemy = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      enemy.x = player.x + 110;
      enemy.y = player.y - 26;
      enemy.speed = 0;
      enemy.hp = 12;
      game.state.enemies = [enemy];
      const bullet = window.SurvivalRules.createBullets(player, enemy)[0];
      bullet.x = enemy.x;
      bullet.y = enemy.y;
      bullet.vx = 0;
      bullet.vy = 0;
      game.state.bullets = [bullet];
      setTimeout(() => {
        const hpAfterHit = enemy.hp;
        setTimeout(() => resolve({
          burnTime: enemy.burnTime || 0,
          hpAfterHit,
          hpAfterBurn: enemy.hp,
          burningEnemies: window.DalgaSavunmasiTest.snapshot().burningEnemies,
        }), 360);
      }, 80);
    })`);

    assert.ok(result.burnTime > 0);
    assert.ok(result.burningEnemies >= 1);
    assert.ok(result.hpAfterBurn < result.hpAfterHit);
  } finally {
    await page.close();
  }
});

test("core-charged piercing laser arcs into a nearby enemy", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['damage', 'rapid'];
      player.lootCores = 1;
      player.stats.damage = 2;
      player.cooldown = 99;
      game.state.spawnTimer = 99;
      const first = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      const second = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      first.x = player.x + 110;
      first.y = player.y - 26;
      second.x = first.x + 18;
      second.y = first.y + 82;
      first.speed = 0;
      second.speed = 0;
      first.hp = 10;
      second.hp = 10;
      game.state.enemies = [first, second];
      const bullet = window.SurvivalRules.createBullets(player, first)[0];
      bullet.x = first.x;
      bullet.y = first.y;
      bullet.vx = 0;
      bullet.vy = 0;
      game.state.bullets = [bullet];
      setTimeout(() => resolve({
        chainArcs: window.DalgaSavunmasiTest.snapshot().chainArcs,
        secondHp: second.hp,
      }), 140);
    })`);

    assert.ok(result.chainArcs >= 1);
    assert.ok(result.secondHp < 10);
  } finally {
    await page.close();
  }
});

test("core-charged drone support emits satellite shots", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`(() => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      player.upgrades = ['engine', 'rapid'];
      player.lootCores = 1;
      const enemy = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      enemy.x = player.x + 240;
      enemy.y = player.y - 18;
      const bullets = window.SurvivalRules.createBullets(player, enemy);
      return {
        coreDroneBullets: bullets.filter((bullet) => bullet.origin === 'coreDrone').length,
        styles: bullets.map((bullet) => bullet.style),
      };
    })()`);

    assert.ok(result.coreDroneBullets >= 1);
    assert.ok(result.styles.includes("coreDrone"));
  } finally {
    await page.close();
  }
});
