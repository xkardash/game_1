(() => {
  function createSectorUi() {
    const eventValue = document.querySelector("#sectorEventValue");
    const threatValue = document.querySelector("#threatValue");
    const landmarkValue = document.querySelector("#landmarkValue");
    const missionTitle = document.querySelector("#missionTitle");
    const missionProgress = document.querySelector("#missionProgress");

    function sync(state) {
      const event = state.sector?.activeEvent;
      const mission = state.mission?.active;
      eventValue.textContent = event ? `${event.title} ${Math.ceil(event.timeLeft)}s` : "Sakin";
      threatValue.textContent = state.spawnDirector?.lastDifficulty?.threatLabel || "Dusuk";
      landmarkValue.textContent = state.landmarkState?.activeZone?.title || "Acik uzay";
      missionTitle.textContent = mission ? mission.title : "Gorev bekleniyor";
      missionProgress.textContent = mission ? `${Math.floor(mission.progress)}/${mission.target}` : "-";
    }

    return { sync };
  }

  window.SectorUi = { createSectorUi };
})();
