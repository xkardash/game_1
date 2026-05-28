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
