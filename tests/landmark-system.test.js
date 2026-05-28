const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadLandmarkSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/landmark-system.js", "utf8"), context, { filename: "src/landmark-system.js" });
  return context.LandmarkSystem;
}

function createState(player) {
  const LandmarkSystem = loadLandmarkSystem();
  return {
    phase: "playing",
    player,
    landmarkState: LandmarkSystem.createLandmarkState({ width: 1760, height: 1040 }),
  };
}

test("landmarks are placed deterministically inside the world", () => {
  const LandmarkSystem = loadLandmarkSystem();
  const state = LandmarkSystem.createLandmarkState({ width: 1760, height: 1040 });

  assert.equal(state.landmarks.length, 3);
  assert.equal(state.landmarks.map((landmark) => landmark.id).join(","), "asteroidField,relayRuin,salvageBeacon");
  assert.ok(state.landmarks.every((landmark) => landmark.x > 0 && landmark.x < 1760));
  assert.ok(state.landmarks.every((landmark) => landmark.y > 0 && landmark.y < 1040));
});

test("active zone detection prefers the nearest landmark in range", () => {
  const LandmarkSystem = loadLandmarkSystem();
  const state = LandmarkSystem.createLandmarkState({ width: 1760, height: 1040 });
  const player = { x: state.landmarks[0].x + 12, y: state.landmarks[0].y + 8 };

  assert.equal(LandmarkSystem.getActiveLandmark(state, player).id, "asteroidField");
});

test("asteroid field emits hazard damage events with cooldown", () => {
  const state = createState({ x: 492, y: 312 });
  const LandmarkSystem = loadLandmarkSystem();

  const firstEvents = LandmarkSystem.updateLandmarks(state, 1.2);
  const secondEvents = LandmarkSystem.updateLandmarks(state, 0.2);

  assert.equal(state.landmarkState.activeZone.id, "asteroidField");
  assert.equal(firstEvents.length, 1);
  assert.equal(firstEvents[0].type, "hazardDamage");
  assert.equal(secondEvents.length, 0);
});

test("relay ruins charge a reward then respect reward cooldown", () => {
  const state = createState({ x: 1232, y: 395 });
  const LandmarkSystem = loadLandmarkSystem();

  const firstEvents = LandmarkSystem.updateLandmarks(state, 1.5);
  const secondEvents = LandmarkSystem.updateLandmarks(state, 1.5);

  assert.equal(state.landmarkState.activeZone.id, "relayRuin");
  assert.equal(firstEvents.length, 1);
  assert.equal(firstEvents[0].type, "zoneReward");
  assert.equal(firstEvents[0].xp, 2);
  assert.equal(firstEvents[0].lootType, "overdrive");
  assert.equal(secondEvents.length, 0);
});

test("leaving a landmark clears active zone and reward charge", () => {
  const state = createState({ x: 1232, y: 395 });
  const LandmarkSystem = loadLandmarkSystem();

  LandmarkSystem.updateLandmarks(state, 0.8);
  state.player.x = 60;
  state.player.y = 60;
  LandmarkSystem.updateLandmarks(state, 0.1);

  assert.equal(state.landmarkState.activeZone, null);
  assert.equal(state.landmarkState.rewardCharge, 0);
});
