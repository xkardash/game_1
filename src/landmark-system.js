(() => {
  function createLandmarkState(world) {
    return {
      activeZone: null,
      hazardCooldown: 0,
      landmarks: createLandmarks(world),
      rewardCharge: 0,
      rewardCooldown: 0,
    };
  }

  function createLandmarks(world) {
    return [
      {
        id: "asteroidField",
        kind: "hazard",
        title: "Asteroid sahasi",
        x: Math.round(world.width * 0.28),
        y: Math.round(world.height * 0.3),
        radius: 142,
      },
      {
        id: "relayRuin",
        kind: "reward",
        title: "Relay harabesi",
        x: Math.round(world.width * 0.7),
        y: Math.round(world.height * 0.38),
        radius: 126,
      },
      {
        id: "salvageBeacon",
        kind: "reward",
        title: "Salvage isareti",
        x: Math.round(world.width * 0.45),
        y: Math.round(world.height * 0.76),
        radius: 116,
      },
    ];
  }

  function updateLandmarks(state, delta) {
    const landmarkState = state.landmarkState;
    if (!landmarkState || state.phase !== "playing") return [];
    landmarkState.hazardCooldown = Math.max(0, landmarkState.hazardCooldown - delta);
    landmarkState.rewardCooldown = Math.max(0, landmarkState.rewardCooldown - delta);
    const active = getActiveLandmark(landmarkState, state.player);
    landmarkState.activeZone = active;
    if (!active) {
      landmarkState.rewardCharge = 0;
      return [];
    }
    if (active.kind === "hazard") return updateHazard(landmarkState, active, state);
    return updateRewardZone(landmarkState, active, delta);
  }

  function updateHazard(landmarkState, active, state) {
    landmarkState.rewardCharge = 0;
    if (landmarkState.hazardCooldown > 0) return [];
    landmarkState.hazardCooldown = 1.1;
    return [{ type: "hazardDamage", landmark: active, x: state.player.x, y: state.player.y }];
  }

  function updateRewardZone(landmarkState, active, delta) {
    if (landmarkState.rewardCooldown > 0) return [];
    landmarkState.rewardCharge += delta;
    if (landmarkState.rewardCharge < 1.4) return [];
    landmarkState.rewardCharge = 0;
    landmarkState.rewardCooldown = 5;
    return [{
      type: "zoneReward",
      landmark: active,
      lootType: active.id === "relayRuin" ? "overdrive" : "shield",
      xp: active.id === "relayRuin" ? 2 : 1,
    }];
  }

  function getActiveLandmark(landmarkState, player) {
    let active = null;
    let nearestDistance = Infinity;
    for (const landmark of landmarkState.landmarks) {
      const distance = Math.hypot(player.x - landmark.x, player.y - landmark.y);
      if (distance <= landmark.radius && distance < nearestDistance) {
        active = landmark;
        nearestDistance = distance;
      }
    }
    return active;
  }

  window.LandmarkSystem = {
    createLandmarkState,
    createLandmarks,
    getActiveLandmark,
    updateLandmarks,
  };
})();
