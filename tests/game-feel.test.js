const test = require("node:test");
const assert = require("node:assert/strict");
const { openGamePage, wait, waitUntil } = require("./browser-driver");

test("start runs countdown before gameplay begins", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("document.querySelector('#actionButton').click()");
    await wait(120);
    const duringCountdown = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.equal(duringCountdown.phase, "countdown");
    assert.equal(duringCountdown.overlayHidden, false);
    assert.match(duringCountdown.title, /^[123]$/);

    await waitUntil(page, "window.DalgaSavunmasiTest.snapshot().phase === 'playing'");
    assert.equal((await page.evaluate("window.DalgaSavunmasiTest.snapshot()")).overlayHidden, true);
  } finally {
    await page.close();
  }
});

test("pause and resume use keyboard state", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.key("KeyP");
    const paused = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.equal(paused.phase, "paused");
    assert.equal(paused.overlayHidden, false);
    assert.equal(paused.title, "Duraklatildi");

    await page.key("Escape");
    assert.equal((await page.evaluate("window.DalgaSavunmasiTest.snapshot()")).phase, "playing");
  } finally {
    await page.close();
  }
});

test("enemy hits create visible feedback state", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    const beforeHit = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    await page.evaluate("window.DalgaSavunmasiTest.hitFirstEnemy()");
    const afterHit = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.ok(afterHit.score > beforeHit.score);
    assert.ok(afterHit.shake > 0);
    assert.ok(afterHit.flashEnemies > 0);
    assert.ok(afterHit.particles > beforeHit.particles);
  } finally {
    await page.close();
  }
});

test("completed waves advance immediately without countdown", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.evaluate("window.DalgaSavunmasiTest.finishWave()");
    const afterWave = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.equal(afterWave.wave, 2);
    assert.equal(afterWave.phase, "playing");
    assert.equal(afterWave.overlayHidden, true);
  } finally {
    await page.close();
  }
});

test("playfield uses layered space environment objects", async () => {
  const page = await openGamePage();
  try {
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.ok(snapshot.spaceObjects >= 3);
    assert.ok(snapshot.starLayers >= 2);
  } finally {
    await page.close();
  }
});

test("player renders an angular heavy fighter hull", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await wait(120);
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.ok(Number.isFinite(snapshot.screenX));
    assert.ok(Number.isFinite(snapshot.screenY));
    const fighterPixels = await page.evaluate(`((screenX, screenY) => {
      const snapshot = { screenX, screenY };
      const sampleX = Math.round(snapshot.screenX - 54);
      const sampleY = Math.round(snapshot.screenY - 54);
      const data = gameCanvas.getContext('2d').getImageData(sampleX, sampleY, 108, 108).data;
      let armor = 0;
      let core = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        if (red >= 38 && red <= 120 && green >= 48 && green <= 135 && blue >= 60 && blue <= 150) armor += 1;
        if (red < 120 && green > 155 && blue > 135) core += 1;
      }
      return { armor, core, screenX: snapshot.screenX, screenY: snapshot.screenY };
    })(${snapshot.screenX}, ${snapshot.screenY})`);

    assert.ok(fighterPixels.armor > 260);
    assert.ok(fighterPixels.core > 24);
  } finally {
    await page.close();
  }
});

test("player can move freely on both axes", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    const beforeMove = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    await page.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp', bubbles: true }))`);
    await wait(260);
    await page.evaluate(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp', bubbles: true }))`);
    const afterMove = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.ok(afterMove.y < beforeMove.y);
  } finally {
    await page.close();
  }
});

test("expanded world keeps the player in a followed camera viewport", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    const beforeMove = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    await page.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }))`);
    await wait(900);
    await page.evaluate(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight', bubbles: true }))`);
    const afterMove = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.ok(beforeMove.worldWidth > beforeMove.viewWidth);
    assert.ok(beforeMove.worldHeight > beforeMove.viewHeight);
    assert.ok(afterMove.cameraX > beforeMove.cameraX);
    assert.ok(afterMove.screenX > 320 && afterMove.screenX < 700);
  } finally {
    await page.close();
  }
});

test("ship automatically fires at nearby horde enemies", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await wait(520);
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.ok(snapshot.shotsFired > 0);
    assert.ok(snapshot.hordeEnemies > 0);
  } finally {
    await page.close();
  }
});

test("xp collection opens a three-choice upgrade level-up", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.evaluate("window.DalgaSavunmasiTest.grantXp(999)");
    const levelUp = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.equal(levelUp.phase, "levelUp");
    assert.equal(levelUp.upgradeChoices, 3);
    assert.equal(levelUp.overlayHidden, false);
  } finally {
    await page.close();
  }
});

test("level-up cards show rarity, category, effect, and synergy context", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.evaluate("window.DalgaSavunmasiTest.grantXp(999)");

    const card = await page.evaluate(`(() => {
      const first = document.querySelector("#upgradeChoice0");
      return {
        rarity: first.dataset.rarity,
        category: first.querySelector(".upgrade-category").textContent,
        effect: first.querySelector(".upgrade-effect").textContent,
        synergy: first.querySelector(".upgrade-synergy").textContent,
        whiteSpace: getComputedStyle(first).whiteSpace,
      };
    })()`);

    assert.equal(card.rarity, "epic");
    assert.equal(card.category, "Silah");
    assert.equal(card.effect, "Hasar +1");
    assert.match(card.synergy, /Delici Lazer/);
    assert.equal(card.whiteSpace, "normal");
  } finally {
    await page.close();
  }
});

test("selecting an upgrade applies the stat and resumes play", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.evaluate("window.DalgaSavunmasiTest.grantXp(999)");
    const beforeChoice = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    await page.evaluate("window.DalgaSavunmasiTest.chooseUpgrade(0)");
    const afterChoice = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.equal(afterChoice.phase, "playing");
    assert.ok(afterChoice.upgradeCount > beforeChoice.upgradeCount);
  } finally {
    await page.close();
  }
});

test("selected weapon upgrades mount visible modules and affect projectile visuals", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.evaluate("window.DalgaSavunmasiTest.grantXp(5)");
    await page.evaluate("window.DalgaSavunmasiTest.chooseUpgrade(0)");
    await wait(420);
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.ok(Number.isFinite(snapshot.screenX));
    assert.ok(Number.isFinite(snapshot.screenY));
    const modulePixels = await page.evaluate(`((screenX, screenY) => {
      const data = gameCanvas.getContext('2d').getImageData(screenX - 36, screenY - 60, 72, 50).data;
      let plasma = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        if (red > 210 && green > 90 && green < 190 && blue < 110) plasma += 1;
      }
      return plasma;
    })(${snapshot.screenX}, ${snapshot.screenY})`);

    assert.equal(snapshot.mountedWeapons, 2);
    assert.ok(snapshot.plasmaBullets > 0 || snapshot.piercingBullets > 0);
    assert.ok(modulePixels > 28);
  } finally {
    await page.close();
  }
});

test("boss enemies spawn at threat milestones", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await page.evaluate("window.DalgaSavunmasiTest.forceBoss()");
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.ok(snapshot.bosses > 0);
    assert.ok(snapshot.hordeEnemies >= snapshot.bosses);
  } finally {
    await page.close();
  }
});

test("defeating a boss opens a three-choice boss relic reward", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate(`(() => {
      window.DalgaSavunmasiTest.startPlaying();
      const game = window.DalgaSavunmasiGame;
      const player = game.state.player;
      const boss = window.SurvivalRules.createEnemy(game.world, 4, 'boss', player, game.viewport);
      boss.x = player.x + 120;
      boss.y = player.y - 24;
      boss.speed = 0;
      boss.hp = 1;
      game.state.enemies = [boss];
      game.state.bullets = [{ x: boss.x, y: boss.y, width: 14, height: 14, damage: 99, vx: 0, vy: 0, life: 1 }];
    })()`);
    await waitUntil(
      page,
      "window.DalgaSavunmasiTest.snapshot().phase === 'relicChoice' && !!document.querySelector('#upgradeChoice0')"
    );

    const relicPhase = await page.evaluate(`(() => {
      const first = document.querySelector("#upgradeChoice0");
      return {
        phase: window.DalgaSavunmasiTest.snapshot().phase,
        choices: window.DalgaSavunmasiTest.snapshot().relicChoices,
        rarity: first.dataset.rarity,
        title: first.querySelector(".relic-title")?.textContent || "",
        effect: first.querySelector(".relic-effect")?.textContent || "",
      };
    })()`);

    assert.equal(relicPhase.phase, "relicChoice");
    assert.equal(relicPhase.choices, 3);
    assert.equal(relicPhase.rarity, "boss");
    assert.match(relicPhase.title, /Yildiz Zirhi/);
    assert.equal(relicPhase.effect, "Kalkan +1");

    const beforeChoice = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    await page.evaluate("window.DalgaSavunmasiTest.chooseUpgrade(0)");
    await wait(220);
    const afterChoice = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");

    assert.equal(afterChoice.phase, "playing");
    assert.equal(afterChoice.relicCount, beforeChoice.relicCount + 1);
    assert.equal(afterChoice.shields, beforeChoice.shields + 1);

    await page.evaluate("document.querySelector('#runtimeStatsToggle').click()");
    const relicReadout = await page.evaluate(`(() => {
      const row = document.querySelector("#runtimeStatsPanel [data-stat-key='relics']");
      return {
        value: row?.querySelector(".stat-value")?.textContent || "",
        detail: row?.querySelector(".stat-detail")?.textContent || "",
      };
    })()`);
    assert.equal(relicReadout.value, "Yildiz Zirhi");
    assert.equal(relicReadout.detail, "Boss Relic x1");

    const relicPixels = await page.evaluate(`(() => {
      const game = window.DalgaSavunmasiGame;
      const snapshot = window.DalgaSavunmasiTest.snapshot();
      const context = gameCanvas.getContext('2d');
      const data = context.getImageData(snapshot.screenX - 78, snapshot.screenY - 52, 156, 110).data;
      let armorPixels = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        if (red > 205 && green > 150 && green < 230 && blue > 70 && blue < 150) armorPixels += 1;
      }
      return armorPixels;
    })()`);
    assert.ok(relicPixels > 22);
  } finally {
    await page.close();
  }
});

test("selecting dreadnought cruiser updates player stats and launch button starts game", async () => {
  const page = await openGamePage();
  try {
    // Select Dreadnought
    await page.evaluate("document.querySelector('#ship-dreadnought').click()");
    
    // Check that player state has dreadnought stats (e.g. starting shields = 1)
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.equal(snapshot.shields, 1);
    
    // Click Görevi Başlat (Launch)
    await page.evaluate("document.querySelector('#dbLaunchButton').click()");
    await wait(120);
    
    const afterLaunch = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.equal(afterLaunch.phase, "countdown");
  } finally {
    await page.close();
  }
});

test("dashboard and runtime panels show live ship stats", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("document.querySelector('#ship-dreadnought').click()");
    const dashboardStats = await page.evaluate(`(() => {
      const damage = document.querySelector("#dashboardStatsList [data-stat-key='damage'] .stat-value");
      const shield = document.querySelector("#dashboardStatsList [data-stat-key='shield'] .stat-value");
      const weapon = document.querySelector("#dashboardStatsList [data-stat-key='weapon'] .stat-value");
      return {
        damage: damage?.textContent || "",
        shield: shield?.textContent || "",
        weapon: weapon?.textContent || "",
      };
    })()`);

    assert.equal(dashboardStats.damage, "2.0");
    assert.equal(dashboardStats.shield, "1");
    assert.equal(dashboardStats.weapon, "Plazma");

    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    await wait(120);
    const runtimeStatsClosed = await page.evaluate(`(() => {
      const panel = document.querySelector("#runtimeStatsPanel");
      const toggle = document.querySelector("#runtimeStatsToggle");
      return {
        panelHidden: panel.hidden,
        toggleHidden: toggle.hidden,
        expanded: toggle.getAttribute("aria-expanded"),
      };
    })()`);

    assert.equal(runtimeStatsClosed.panelHidden, true);
    assert.equal(runtimeStatsClosed.toggleHidden, false);
    assert.equal(runtimeStatsClosed.expanded, "false");

    await page.evaluate("document.querySelector('#runtimeStatsToggle').click()");
    const runtimeStatsOpen = await page.evaluate(`(() => {
      const panel = document.querySelector("#runtimeStatsPanel");
      const toggle = document.querySelector("#runtimeStatsToggle");
      const speed = panel.querySelector("[data-stat-key='speed'] .stat-value");
      const fireRate = panel.querySelector("[data-stat-key='fireRate'] .stat-value");
      return {
        panelHidden: panel.hidden,
        expanded: toggle.getAttribute("aria-expanded"),
        speed: speed?.textContent || "",
        fireRate: fireRate?.textContent || "",
      };
    })()`);

    assert.equal(runtimeStatsOpen.panelHidden, false);
    assert.equal(runtimeStatsOpen.expanded, "true");
    assert.equal(runtimeStatsOpen.speed, "250");
    assert.equal(runtimeStatsOpen.fireRate, "2.6/sn");

    await page.evaluate("document.querySelector('#runtimeStatsToggle').click()");
    const runtimeStatsClosedAgain = await page.evaluate(`(() => {
      const panel = document.querySelector("#runtimeStatsPanel");
      const toggle = document.querySelector("#runtimeStatsToggle");
      return {
        panelHidden: panel.hidden,
        expanded: toggle.getAttribute("aria-expanded"),
      };
    })()`);

    assert.equal(runtimeStatsClosedAgain.panelHidden, true);
    assert.equal(runtimeStatsClosedAgain.expanded, "false");
  } finally {
    await page.close();
  }
});

test("clicking hangar button during play ends the run and returns to dashboard lobi", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying()");
    
    // Check that hangarReturnButton is visible (not hidden)
    const buttonHidden = await page.evaluate("document.querySelector('#hangarReturnButton').hidden");
    assert.equal(buttonHidden, false);
    
    // Click hangar return button
    await page.evaluate("document.querySelector('#hangarReturnButton').click()");
    await wait(120);
    
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.equal(snapshot.phase, "gameOver");
  } finally {
    await page.close();
  }
});

test("game over summary stays above the dashboard lobby", async () => {
  const page = await openGamePage();
  try {
    await page.evaluate("window.DalgaSavunmasiTest.startPlaying(); window.DalgaSavunmasiTest.endGame();");
    await wait(120);

    const layer = await page.evaluate(`(() => {
      const dashboard = document.querySelector("#dashboard");
      const summaryPanel = document.querySelector("#runSummaryPanel");
      const rect = summaryPanel.getBoundingClientRect();
      const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        phase: window.DalgaSavunmasiTest.snapshot().phase,
        dashboardHidden: dashboard.classList.contains("is-hidden"),
        summaryHidden: summaryPanel.hidden,
        summaryOnTop: Boolean(topElement && topElement.closest("#runSummaryPanel")),
      };
    })()`);

    assert.equal(layer.phase, "gameOver");
    assert.equal(layer.dashboardHidden, false);
    assert.equal(layer.summaryHidden, false);
    assert.equal(layer.summaryOnTop, true);
  } finally {
    await page.close();
  }
});

test("selecting custom neon trail colors updates the state and active buttons", async () => {
  const page = await openGamePage();
  try {
    // Select Gold trail color
    await page.evaluate("document.querySelector('#trail-gold').click()");
    
    // Check that state.trailColor becomes gold
    const snapshot = await page.evaluate("window.DalgaSavunmasiTest.snapshot()");
    assert.equal(snapshot.trailColor, "gold");
    
    // Check active class on buttons
    const activeCyan = await page.evaluate("document.querySelector('#trail-cyan').classList.contains('active')");
    const activeGold = await page.evaluate("document.querySelector('#trail-gold').classList.contains('active')");
    assert.equal(activeCyan, false);
    assert.equal(activeGold, true);
  } finally {
    await page.close();
  }
});
