(() => {
  function createSectorUi() {
    const eventValue = document.querySelector("#sectorEventValue");
    const threatValue = document.querySelector("#threatValue");
    const landmarkValue = document.querySelector("#landmarkValue");
    const missionTitle = document.querySelector("#missionTitle");
    const missionProgress = document.querySelector("#missionProgress");
    const objectiveTitle = document.querySelector("#objectiveTitle");
    const objectiveProgress = document.querySelector("#objectiveProgress");

    function sync(state) {
      const event = state.sector?.activeEvent;
      const mission = state.mission?.active;
      const objective = state.tacticalObjectives?.active;
      eventValue.textContent = event ? `${event.title} ${Math.ceil(event.timeLeft)}s` : "Sakin";
      threatValue.textContent = state.spawnDirector?.lastDifficulty?.threatLabel || "Dusuk";
      landmarkValue.textContent = state.landmarkState?.activeZone?.title || "Acik uzay";
      missionTitle.textContent = mission ? mission.title : "Gorev bekleniyor";
      missionProgress.textContent = mission ? `${Math.floor(mission.progress)}/${mission.target}` : "-";
      objectiveTitle.textContent = objective ? `${objective.title} ${Math.ceil(objective.timeLeft)}s` : "Hedef yok";
      objectiveProgress.textContent = objective ? `${Math.floor(objective.progress)}/${objective.target}` : "-";
    }

    return { sync };
  }

  window.SectorUi = { createSectorUi };
})();
