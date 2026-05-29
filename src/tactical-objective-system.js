(() => {
  const OBJECTIVE_ORDER = ["signalBeacon", "supplyCapsule", "anomalyZone"];
  const OBJECTIVE_DEFS = {
    anomalyZone: {
      accent: "#b889ff",
      radius: 112,
      reward: { xp: 3, overdriveCharge: 34 },
      target: 6,
      timeLimit: 30,
      title: "Anomali bolgesi",
    },
    signalBeacon: {
      accent: "#f0b84a",
      radius: 92,
      reward: { xp: 4, overdriveCharge: 18 },
      target: 4,
      timeLimit: 32,
      title: "Sinyal istasyonu",
    },
    supplyCapsule: {
      accent: "#52d6bd",
      radius: 86,
      reward: { lootType: "core", xp: 2 },
      target: 5,
      timeLimit: 34,
      title: "Tedarik kapsulu",
    },
  };

  function createObjectiveState() {
    return {
      active: null,
      completed: 0,
      lastCompleted: null,
      objectiveIndex: 0,
      timer: 10,
    };
  }

  function updateObjectives(objectiveState, state, delta) {
    if (state.phase !== "playing") return [];
    if (!objectiveState.active) {
      objectiveState.timer -= delta;
      if (objectiveState.timer <= 0) startObjective(objectiveState, state);
      return [];
    }
    return updateActiveObjective(objectiveState, state, delta);
  }

  function startObjective(objectiveState, state, index = objectiveState.objectiveIndex) {
    const kind = OBJECTIVE_ORDER[index % OBJECTIVE_ORDER.length];
    const def = OBJECTIVE_DEFS[kind];
    const position = getObjectivePosition(state.world, state.player, index);
    objectiveState.active = {
      kind,
      title: def.title,
      x: position.x,
      y: position.y,
      radius: def.radius,
      progress: 0,
      target: def.target,
      timeLeft: def.timeLimit,
      reward: { ...def.reward },
      pulse: 0,
      inRange: false,
      pressureCooldown: 0,
    };
    objectiveState.objectiveIndex = index + 1;
  }

  function updateActiveObjective(objectiveState, state, delta) {
    const objective = objectiveState.active;
    const events = [];
    objective.timeLeft -= delta;
    objective.pulse += delta * 4;
    objective.inRange = getDistance(state.player, objective) <= objective.radius;
    if (objective.inRange) {
      objective.progress = Math.min(objective.target, objective.progress + delta);
      if (objective.kind === "anomalyZone") updateAnomalyPressure(objective, events, delta);
    } else {
      objective.progress = Math.max(0, objective.progress - delta * 0.25);
    }
    if (objective.progress >= objective.target) {
      events.push(completeObjective(objectiveState));
      return events;
    }
    if (objective.timeLeft <= 0) expireObjective(objectiveState);
    return events;
  }

  function updateAnomalyPressure(objective, events, delta) {
    objective.pressureCooldown -= delta;
    if (objective.pressureCooldown > 0) return;
    objective.pressureCooldown = 1;
    events.push({ type: "anomalyPressure", objective });
  }

  function completeObjective(objectiveState) {
    const objective = objectiveState.active;
    const event = {
      type: "objectiveReward",
      kind: objective.kind,
      title: objective.title,
      x: objective.x,
      y: objective.y,
      reward: { ...objective.reward },
    };
    objectiveState.active = null;
    objectiveState.completed += 1;
    objectiveState.lastCompleted = { kind: event.kind, title: event.title, reward: { ...event.reward } };
    objectiveState.timer = 18;
    return event;
  }

  function expireObjective(objectiveState) {
    objectiveState.active = null;
    objectiveState.timer = 14;
  }

  function getObjectivePosition(world, player, index) {
    const margin = 80;
    const minDistance = 260;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const angle = index * 2.17 + attempt * 0.74 + 0.65;
      const distance = 360 + (attempt % 3) * 80;
      const x = clamp(player.x + Math.cos(angle) * distance, margin, world.width - margin);
      const y = clamp(player.y + Math.sin(angle) * distance, margin, world.height - margin);
      if (getDistance(player, { x, y }) >= minDistance) return { x: Math.round(x), y: Math.round(y) };
    }
    return {
      x: player.x < world.width / 2 ? world.width - margin : margin,
      y: player.y < world.height / 2 ? world.height - margin : margin,
    };
  }

  function drawWorld(context, state) {
    const objective = state.tacticalObjectives?.active;
    if (!objective) return;
    const def = OBJECTIVE_DEFS[objective.kind] || OBJECTIVE_DEFS.signalBeacon;
    const ratio = objective.target > 0 ? objective.progress / objective.target : 0;
    context.save();
    context.globalAlpha = objective.inRange ? 0.22 : 0.12;
    context.fillStyle = def.accent;
    context.beginPath();
    context.arc(objective.x, objective.y, objective.radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.76;
    context.strokeStyle = def.accent;
    context.lineWidth = objective.inRange ? 4 : 3;
    context.setLineDash([10, 8]);
    context.beginPath();
    context.arc(objective.x, objective.y, objective.radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(objective.x, objective.y, objective.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    context.stroke();
    drawMarker(context, objective, def);
    context.font = "600 16px Outfit, sans-serif";
    context.textAlign = "center";
    context.fillStyle = "#f2dfb6";
    context.fillText(objective.title, objective.x, objective.y - objective.radius - 18);
    context.restore();
  }

  function drawMarker(context, objective, def) {
    context.save();
    context.translate(objective.x, objective.y);
    context.strokeStyle = "#f2dfb6";
    context.fillStyle = def.accent;
    context.lineWidth = 3;
    if (objective.kind === "signalBeacon") drawBeaconMarker(context);
    else if (objective.kind === "supplyCapsule") drawCapsuleMarker(context);
    else drawAnomalyMarker(context, objective.pulse || 0);
    context.restore();
  }

  function drawBeaconMarker(context) {
    context.beginPath();
    context.moveTo(0, -28);
    context.lineTo(22, 20);
    context.lineTo(-22, 20);
    context.closePath();
    context.stroke();
    context.fillRect(-6, -3, 12, 12);
  }

  function drawCapsuleMarker(context) {
    context.strokeRect(-22, -15, 44, 30);
    context.fillRect(-12, -8, 24, 16);
  }

  function drawAnomalyMarker(context, pulse) {
    context.rotate(pulse * 0.12);
    context.beginPath();
    context.moveTo(0, -28);
    context.lineTo(28, 0);
    context.lineTo(0, 28);
    context.lineTo(-28, 0);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(0, 0, 9, 0, Math.PI * 2);
    context.fill();
  }

  function getDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  window.TacticalObjectiveSystem = {
    createObjectiveState,
    drawWorld,
    expireObjective,
    startObjective,
    updateObjectives,
  };
})();
