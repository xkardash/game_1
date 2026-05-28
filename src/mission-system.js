(() => {
  const MISSION_ORDER = ["hunt", "collect", "survive"];
  const MISSION_DEFS = {
    collect: { title: "Salvage topla", target: 3, reward: { shield: 1 } },
    hunt: { title: "Sektor temizligi", target: 8, reward: { xp: 3 } },
    survive: { title: "Baskiya dayan", target: 24, reward: { overdrive: 4 } },
  };

  function createMissionState() {
    return { active: null, completed: 0, missionIndex: 0, timer: 12 };
  }

  function updateMission(missionState, state, delta, onReward = () => {}) {
    if (state.phase !== "playing") return;
    if (!missionState.active) {
      missionState.timer -= delta;
      if (missionState.timer <= 0) startMission(missionState, state.wave || 1, missionState.missionIndex);
      return;
    }
    missionState.active.timeLeft -= delta;
    if (missionState.active.kind === "survive") advanceMission(missionState, delta, onReward);
    if (missionState.active && missionState.active.timeLeft <= 0) expireMission(missionState);
  }

  function startMission(missionState, wave, index = missionState.missionIndex) {
    const kind = MISSION_ORDER[index % MISSION_ORDER.length];
    const def = MISSION_DEFS[kind];
    missionState.active = {
      kind,
      title: def.title,
      progress: 0,
      target: kind === "hunt" ? Math.max(def.target, 4 + wave) : def.target,
      reward: { ...def.reward },
      timeLeft: kind === "survive" ? def.target + 8 : 32,
    };
    missionState.missionIndex = index + 1;
  }

  function recordKill(missionState, enemy, onReward = () => {}) {
    if (missionState.active?.kind !== "hunt") return;
    if (enemy.type === "boss") advanceMission(missionState, 2, onReward);
    else advanceMission(missionState, 1, onReward);
  }

  function recordPickup(missionState, type, onReward = () => {}) {
    if (missionState.active?.kind !== "collect") return;
    if (type === "xp" || type === "core" || type === "loot") advanceMission(missionState, 1, onReward);
  }

  function advanceMission(missionState, amount, onReward) {
    const mission = missionState.active;
    mission.progress = Math.min(mission.target, mission.progress + amount);
    if (mission.progress >= mission.target) completeMission(missionState, onReward);
  }

  function completeMission(missionState, onReward) {
    const reward = missionState.active.reward;
    missionState.active = null;
    missionState.completed += 1;
    missionState.timer = 18;
    onReward(reward);
  }

  function expireMission(missionState) {
    missionState.active = null;
    missionState.timer = 14;
  }

  window.MissionSystem = {
    createMissionState,
    expireMission,
    recordKill,
    recordPickup,
    startMission,
    updateMission,
  };
})();
