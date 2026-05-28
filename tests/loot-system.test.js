const test = require("node:test");
const assert = require("node:assert/strict");
const { openGamePage } = require("./browser-driver");

test("tank enemies drop shield loot when destroyed", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      game.state.spawnTimer = 99;
      const tank = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      tank.x = player.x + 90;
      tank.y = player.y - 20;
      tank.speed = 0;
      tank.hp = 1;
      game.state.enemies = [tank];
      game.state.bullets = [{ x: tank.x, y: tank.y, width: 14, height: 14, damage: 99, vx: 0, vy: 0, life: 1 }];
      setTimeout(() => resolve(window.DalgaSavunmasiTest.snapshot()), 180);
    })`);

    assert.equal(result.lootItems, 1);
    assert.equal(result.lootTypes, "shield");
  } finally {
    await page.close();
  }
});

test("shield loot absorbs the next player hit", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      game.state.lootDrops = [{ type: 'shield', x: player.x, y: player.y, width: 18, height: 18, pulse: 0 }];
      setTimeout(() => {
        const beforeHit = window.DalgaSavunmasiTest.snapshot();
        window.DalgaSavunmasiTest.hitPlayer();
        const afterHit = window.DalgaSavunmasiTest.snapshot();
        resolve({ beforeHit, afterHit });
      }, 160);
    })`);

    assert.equal(result.beforeHit.shields, 1);
    assert.equal(result.afterHit.lives, result.beforeHit.lives);
    assert.equal(result.afterHit.shields, 0);
  } finally {
    await page.close();
  }
});

test("overdrive loot temporarily accelerates automatic fire", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      game.state.spawnTimer = 99;
      const tank = window.SurvivalRules.createEnemy(game.world, 4, 'tank', player, game.viewport);
      tank.x = player.x + 360;
      tank.y = player.y - 26;
      tank.speed = 0;
      tank.hp = 999;
      game.state.enemies = [tank];
      game.state.lootDrops = [{ type: 'overdrive', x: player.x, y: player.y, width: 18, height: 18, pulse: 0 }];
      setTimeout(() => {
        const afterCollect = window.DalgaSavunmasiTest.snapshot();
        player.cooldown = 0;
        game.state.shotsFired = 0;
        setTimeout(() => {
          resolve({ afterCollect, afterBurst: window.DalgaSavunmasiTest.snapshot() });
        }, 560);
      }, 160);
    })`);

    assert.equal(result.afterCollect.overdriveActive, true);
    assert.ok(result.afterBurst.shotsFired >= 3);
  } finally {
    await page.close();
  }
});

test("bosses drop rare cores that can be collected", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      game.state.spawnTimer = 99;
      const boss = window.SurvivalRules.createEnemy(game.world, 4, 'boss', player, game.viewport);
      boss.x = player.x + 120;
      boss.y = player.y - 24;
      boss.speed = 0;
      boss.hp = 1;
      game.state.enemies = [boss];
      game.state.bullets = [{ x: boss.x, y: boss.y, width: 14, height: 14, damage: 99, vx: 0, vy: 0, life: 1 }];
      setTimeout(() => {
        const afterDrop = window.DalgaSavunmasiTest.snapshot();
        for (const loot of game.state.lootDrops || []) {
          loot.x = player.x;
          loot.y = player.y;
        }
        setTimeout(() => resolve({ afterDrop, afterCollect: window.DalgaSavunmasiTest.snapshot() }), 160);
      }, 180);
    })`);

    assert.equal(result.afterDrop.lootTypes, "core");
    assert.equal(result.afterCollect.lootCores, 1);
  } finally {
    await page.close();
  }
});
