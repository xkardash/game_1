const test = require("node:test");
const assert = require("node:assert/strict");
const { openGamePage, wait } = require("./browser-driver");

test("waves field multiple tactical enemy roles", async () => {
  const page = await openGamePage();
  try {
    const types = await page.evaluate(`(() => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      game.state.wave = 4;
      game.state.enemies = [];
      game.finishWave();
      return [...new Set(game.state.enemies.map((enemy) => enemy.type))].sort();
    })()`);

    assert.deepEqual(types, ["bomber", "scout", "sniper", "tank"]);
  } finally {
    await page.close();
  }
});

test("sniper ships hold range and fire hostile shots", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      const sniper = window.SurvivalRules.createEnemy(game.world, 4, 'sniper', player, game.viewport);
      sniper.x = player.x + 320;
      sniper.y = player.y;
      game.state.enemies = [sniper];
      game.state.enemyBullets = [];
      setTimeout(() => {
        resolve({
          bullets: game.state.enemyBullets.length,
          distance: Math.round(window.SurvivalRules.getDistance(player, sniper)),
        });
      }, 1800);
    })`);

    assert.ok(result.distance > 210);
    assert.ok(result.bullets > 0);
  } finally {
    await page.close();
  }
});

test("bomber ships explode when destroyed near the player", async () => {
  const page = await openGamePage();
  try {
    const result = await page.evaluate(`new Promise((resolve) => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      const bomber = window.SurvivalRules.createEnemy(game.world, 4, 'bomber', player, game.viewport);
      bomber.x = player.x + 82;
      bomber.y = player.y;
      bomber.hp = 1;
      bomber.speed = 0;
      game.state.enemies = [bomber];
      const beforeLives = player.lives;
      game.state.bullets.push({ x: bomber.x, y: bomber.y, width: 12, height: 12, damage: 99, vx: 0, vy: 0, life: 1 });
      setTimeout(() => {
        resolve({
          beforeLives,
          afterLives: player.lives,
          bomberCount: game.state.enemies.filter((enemy) => enemy.type === 'bomber').length,
          particles: game.state.particles.length,
        });
      }, 180);
    })`);

    assert.equal(result.bomberCount, 0);
    assert.ok(result.afterLives < result.beforeLives);
    assert.ok(result.particles > 20);
  } finally {
    await page.close();
  }
});

test("visible horde enemies render as themed raider ships", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate(`(() => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const enemy = game.state.enemies.find((item) => item.type !== 'boss');
      game.state.enemies = [enemy];
      game.state.player.cooldown = 99;
      enemy.x = game.state.player.x + 130;
      enemy.y = game.state.player.y - 20;
      enemy.speed = 0;
      enemy.flash = 0;
      enemy.hp = 2;
    })()`);
    await wait(140);
    const pixels = await page.evaluate(`(() => {
      const game = window.DalgaSavunmasiGame;
      const enemy = game.state.enemies.find((item) => item.type !== 'boss');
      const screen = window.ShooterCamera.toScreen(game.state.camera, enemy);
      const data = gameCanvas.getContext('2d').getImageData(screen.x - 42, screen.y - 42, 84, 84).data;
      let darkHull = 0;
      let hostileCore = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        if (red >= 18 && red <= 95 && green >= 28 && green <= 110 && blue >= 42 && blue <= 135 && blue > red + 12) darkHull += 1;
        if (red > 190 && green >= 55 && green <= 135 && blue < 95) hostileCore += 1;
      }
      return { darkHull, hostileCore };
    })()`);

    assert.ok(pixels.darkHull > 130);
    assert.ok(pixels.hostileCore > 16);
  } finally {
    await page.close();
  }
});
