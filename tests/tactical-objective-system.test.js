const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadTacticalObjectiveSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/tactical-objective-system.js", "utf8"), context, { filename: "src/tactical-objective-system.js" });
  return context.TacticalObjectiveSystem;
}

function createState(player = { x: 880, y: 520 }) {
  return {
    phase: "playing",
    player,
    wave: 4,
    world: { width: 1760, height: 1040 },
  };
}

test("tactical objectives spawn inside the world and away from the player", () => {
  const TacticalObjectiveSystem = loadTacticalObjectiveSystem();
  const objectiveState = TacticalObjectiveSystem.createObjectiveState({ width: 1760, height: 1040 });
  const state = createState();

  TacticalObjectiveSystem.startObjective(objectiveState, state, 0);

  const objective = objectiveState.active;
  assert.equal(objective.kind, "signalBeacon");
  assert.ok(objective.x >= 80 && objective.x <= 1680);
  assert.ok(objective.y >= 80 && objective.y <= 960);
  assert.ok(Math.hypot(objective.x - state.player.x, objective.y - state.player.y) >= 260);
});

test("signal beacons complete from proximity and emit focused rewards", () => {
  const TacticalObjectiveSystem = loadTacticalObjectiveSystem();
  const objectiveState = TacticalObjectiveSystem.createObjectiveState({ width: 1760, height: 1040 });
  const state = createState();

  TacticalObjectiveSystem.startObjective(objectiveState, state, 0);
  state.player.x = objectiveState.active.x;
  state.player.y = objectiveState.active.y;

  const events = TacticalObjectiveSystem.updateObjectives(objectiveState, state, 4.1);

  assert.equal(objectiveState.completed, 1);
  assert.equal(objectiveState.active, null);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "objectiveReward");
  assert.equal(events[0].reward.xp, 4);
  assert.equal(events[0].reward.overdriveCharge, 18);
});

test("supply capsules pay loot rewards after being held open", () => {
  const TacticalObjectiveSystem = loadTacticalObjectiveSystem();
  const objectiveState = TacticalObjectiveSystem.createObjectiveState({ width: 1760, height: 1040 });
  const state = createState();

  TacticalObjectiveSystem.startObjective(objectiveState, state, 1);
  state.player.x = objectiveState.active.x;
  state.player.y = objectiveState.active.y;

  const events = TacticalObjectiveSystem.updateObjectives(objectiveState, state, 5.3);

  assert.equal(events[0].reward.lootType, "core");
  assert.equal(events[0].reward.xp, 2);
});

test("anomaly zones emit pressure while charging and then reward overdrive", () => {
  const TacticalObjectiveSystem = loadTacticalObjectiveSystem();
  const objectiveState = TacticalObjectiveSystem.createObjectiveState({ width: 1760, height: 1040 });
  const state = createState();

  TacticalObjectiveSystem.startObjective(objectiveState, state, 2);
  state.player.x = objectiveState.active.x;
  state.player.y = objectiveState.active.y;

  const pressureEvents = TacticalObjectiveSystem.updateObjectives(objectiveState, state, 1.1);
  const rewardEvents = TacticalObjectiveSystem.updateObjectives(objectiveState, state, 5.1);

  assert.equal(pressureEvents[0].type, "anomalyPressure");
  assert.equal(rewardEvents.at(-1).type, "objectiveReward");
  assert.equal(rewardEvents.at(-1).reward.overdriveCharge, 34);
});

test("ignored objectives expire without paying rewards", () => {
  const TacticalObjectiveSystem = loadTacticalObjectiveSystem();
  const objectiveState = TacticalObjectiveSystem.createObjectiveState({ width: 1760, height: 1040 });
  const state = createState({ x: 100, y: 100 });

  TacticalObjectiveSystem.startObjective(objectiveState, state, 0);
  const events = TacticalObjectiveSystem.updateObjectives(objectiveState, state, 34);

  assert.equal(events.length, 0);
  assert.equal(objectiveState.active, null);
  assert.equal(objectiveState.completed, 0);
});
