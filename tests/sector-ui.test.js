const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  return {
    hidden: false,
    textContent: "",
  };
}

function loadSectorUi(elements) {
  const context = {
    console,
    document: {
      querySelector(selector) {
        return elements[selector];
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/sector-ui.js", "utf8"), context, { filename: "src/sector-ui.js" });
  return context.SectorUi;
}

function createElements() {
  return {
    "#sectorEventValue": createElement(),
    "#threatValue": createElement(),
    "#landmarkValue": createElement(),
    "#missionTitle": createElement(),
    "#missionProgress": createElement(),
    "#objectiveTitle": createElement(),
    "#objectiveProgress": createElement(),
  };
}

test("sector UI shows quiet defaults without active event or mission", () => {
  const elements = createElements();
  const SectorUi = loadSectorUi(elements);

  SectorUi.createSectorUi().sync({ sector: {}, mission: {} });

  assert.equal(elements["#sectorEventValue"].textContent, "Sakin");
  assert.equal(elements["#threatValue"].textContent, "Dusuk");
  assert.equal(elements["#landmarkValue"].textContent, "Acik uzay");
  assert.equal(elements["#missionTitle"].textContent, "Gorev bekleniyor");
  assert.equal(elements["#missionProgress"].textContent, "-");
  assert.equal(elements["#objectiveTitle"].textContent, "Hedef yok");
  assert.equal(elements["#objectiveProgress"].textContent, "-");
});

test("sector UI writes active event, mission, and tactical objective progress safely", () => {
  const elements = createElements();
  const SectorUi = loadSectorUi(elements);

  SectorUi.createSectorUi().sync({
    sector: { activeEvent: { title: "Meteor yagmuru", timeLeft: 6.4 } },
    spawnDirector: { lastDifficulty: { threatLabel: "Yuksek" } },
    landmarkState: { activeZone: { title: "Asteroid sahasi" } },
    mission: { active: { title: "Sektor temizligi", progress: 3, target: 8 } },
    tacticalObjectives: { active: { title: "Sinyal istasyonu", progress: 2.2, target: 4, timeLeft: 19.1 } },
  });

  assert.equal(elements["#sectorEventValue"].textContent, "Meteor yagmuru 7s");
  assert.equal(elements["#threatValue"].textContent, "Yuksek");
  assert.equal(elements["#landmarkValue"].textContent, "Asteroid sahasi");
  assert.equal(elements["#missionTitle"].textContent, "Sektor temizligi");
  assert.equal(elements["#missionProgress"].textContent, "3/8");
  assert.equal(elements["#objectiveTitle"].textContent, "Sinyal istasyonu 20s");
  assert.equal(elements["#objectiveProgress"].textContent, "2/4");
});
