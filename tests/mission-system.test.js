const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadMissionSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/mission-system.js", "utf8"), context, { filename: "src/mission-system.js" });
  return context.MissionSystem;
}

test("hunt missions track kills and pay rewards on completion", () => {
  const MissionSystem = loadMissionSystem();
  const missionState = MissionSystem.createMissionState();
  const rewards = [];

  MissionSystem.startMission(missionState, 4, 0);
  const target = missionState.active.target;
  for (let index = 0; index < target; index += 1) {
    MissionSystem.recordKill(missionState, { type: "scout" }, (reward) => rewards.push(reward));
  }

  assert.equal(missionState.completed, 1);
  assert.equal(missionState.active, null);
  assert.equal(rewards.length, 1);
  assert.equal(rewards[0].xp, 3);
});

test("collect missions advance from XP and core pickups", () => {
  const MissionSystem = loadMissionSystem();
  const missionState = MissionSystem.createMissionState();
  const rewards = [];

  MissionSystem.startMission(missionState, 5, 1);
  MissionSystem.recordPickup(missionState, "xp", (reward) => rewards.push(reward));
  MissionSystem.recordPickup(missionState, "core", (reward) => rewards.push(reward));
  MissionSystem.recordPickup(missionState, "xp", (reward) => rewards.push(reward));

  assert.equal(missionState.completed, 1);
  assert.equal(rewards[0].shield, 1);
});

test("survive missions progress with playing time and expire when ignored", () => {
  const MissionSystem = loadMissionSystem();
  const missionState = MissionSystem.createMissionState();
  const rewards = [];

  MissionSystem.startMission(missionState, 6, 2);
  MissionSystem.updateMission(missionState, { phase: "playing", wave: 6 }, 7, (reward) => rewards.push(reward));
  assert.equal(missionState.active.progress, 7);

  MissionSystem.updateMission(missionState, { phase: "playing", wave: 6 }, 30, (reward) => rewards.push(reward));
  assert.equal(missionState.completed, 1);
  assert.equal(rewards[0].overdrive, 4);
});
