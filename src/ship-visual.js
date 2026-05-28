(() => {
  const MODULE_COLORS = {
    damage: "#f0a040",
    engine: "#4fc3d6",
    magnet: "#52d6bd",
    rapid: "#f2dfb6",
    repair: "#78d96b",
    split: "#d7a64f",
  };

  function drawEngineTrail(context, state) {
    const player = state.player;
    if (!player.trailHistory || player.trailHistory.length < 2) return;
    context.save();
    
    // Choose trail color based on state.trailColor
    const activeColor = state.trailColor || ((player.shipType === "dreadnought") ? "crimson" : "cyan");
    let colorHex = "#4fc3d6"; // default cyan
    if (activeColor === "crimson") colorHex = "#e8573f";
    if (activeColor === "acid") colorHex = "#52b69a";
    if (activeColor === "gold") colorHex = "#f0b84a";
    
    context.lineCap = "round";
    context.lineJoin = "round";
    
    for (let index = 1; index < player.trailHistory.length; index += 1) {
      const p1 = player.trailHistory[index - 1];
      const p2 = player.trailHistory[index];
      const ratio = index / player.trailHistory.length;
      
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      
      context.strokeStyle = colorHex;
      context.globalAlpha = ratio * 0.35;
      context.lineWidth = 3 + ratio * 9;
      context.stroke();
    }
    
    context.restore();
  }

  function drawPlayer(context, state) {
    const player = state.player;
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) return;
    
    // Draw the visual trail in world space first
    drawEngineTrail(context, state);
    
    context.save();
    context.translate(player.x, player.y);
    drawEngineWake(context, player, state);
    drawWingSilhouette(context, player);
    drawArmor(context, player);
    drawWeaponBase(context);
    drawUpgradeModules(context, player);
    window.RelicVisual?.drawRelics?.(context, player);
    drawCore(context, player);
    drawStatusFields(context, player);
    context.restore();
  }

  function drawEngineWake(context, player, state) {
    const boost = getUpgradeLevel(player, "engine");
    const activeColor = state?.trailColor || ((player.shipType === "dreadnought") ? "crimson" : "cyan");
    let colorHex = "#4fc3d6"; // default cyan
    if (activeColor === "crimson") colorHex = "#e8573f";
    if (activeColor === "acid") colorHex = "#52b69a";
    if (activeColor === "gold") colorHex = "#f0b84a";

    context.globalAlpha = 0.85;
    context.fillStyle = colorHex;
    drawPath(context, [[-12, 26], [-3, 56 + boost * 9], [0, 32], [3, 56 + boost * 9], [12, 26]]);
    context.globalAlpha = 1;
    context.fillStyle = "#ffffff";
    context.fillRect(-4, 22, 8, 20 + boost * 6);
  }

  function drawWingSilhouette(context, player) {
    const isDreadnought = player?.shipType === "dreadnought";
    context.fillStyle = isDreadnought ? "#201215" : "#141b24";
    if (isDreadnought) {
      drawPath(context, [[0, -38], [-68, -4], [-55, 34], [-22, 24], [0, 44], [22, 24], [55, 34], [68, -4]]);
    } else {
      drawPath(context, [[0, -45], [-58, -12], [-45, 28], [-16, 18], [0, 38], [16, 18], [45, 28], [58, -12]]);
    }
  }

  function drawArmor(context, player) {
    const isDreadnought = player?.shipType === "dreadnought";
    if (isDreadnought) {
      context.fillStyle = "#5d3b44";
      drawPath(context, [[0, -42], [-35, -18], [-28, 26], [0, 40], [28, 26], [35, -18]]);
      context.fillStyle = "#7b4f5a";
      drawPath(context, [[0, -32], [-22, -10], [-16, 21], [0, 30], [16, 21], [22, -10]]);
      context.fillStyle = "#3a1f25";
      drawPath(context, [[-46, -4], [-68, 17], [-45, 28], [-22, 12], [-26, -8]]);
      drawPath(context, [[46, -4], [68, 17], [45, 28], [22, 12], [26, -8]]);
      context.fillStyle = "rgba(240, 184, 74, 0.22)";
      drawPath(context, [[-6, -27], [-13, 13], [-4, 28], [2, -20]]);
    } else {
      context.fillStyle = "#33445c";
      drawPath(context, [[0, -48], [-31, -22], [-24, 22], [0, 37], [24, 22], [31, -22]]);
      context.fillStyle = "#46627c";
      drawPath(context, [[0, -38], [-19, -14], [-14, 17], [0, 26], [14, 17], [19, -14]]);
      context.fillStyle = "#26344a";
      drawPath(context, [[-42, -8], [-62, 13], [-39, 23], [-18, 9], [-22, -11]]);
      drawPath(context, [[42, -8], [62, 13], [39, 23], [18, 9], [22, -11]]);
      context.fillStyle = "rgba(242, 223, 182, 0.22)";
      drawPath(context, [[-6, -33], [-13, 10], [-4, 25], [2, -24]]);
    }
  }

  function drawWeaponBase(context) {
    context.fillStyle = "#1f2a38";
    context.fillRect(-7, -53, 14, 18);
    context.fillRect(-44, -3, 12, 30);
    context.fillRect(32, -3, 12, 30);
  }

  function drawUpgradeModules(context, player) {
    if (hasUpgrade(player, "damage")) drawPlasmaCannon(context, getUpgradeLevel(player, "damage"));
    if (hasUpgrade(player, "rapid")) drawRapidEmitters(context);
    if (hasUpgrade(player, "split")) drawSplitTurrets(context);
    if (hasUpgrade(player, "engine")) drawEnginePods(context);
    if (hasUpgrade(player, "magnet")) drawMagnetField(context, player);
    if (hasUpgrade(player, "repair")) drawRepairNodes(context);
    drawSynergyModules(context, player);
  }

  function drawSynergyModules(context, player) {
    const synergies = window.WeaponEvolution.getSynergyIds(player);
    if (synergies.includes("twinPlasma")) drawTwinPlasmaRails(context);
    if (synergies.includes("piercingLaser")) drawPiercingLens(context);
    if (synergies.includes("droneSupport")) drawDronePods(context);
  }

  function drawPlasmaCannon(context, level) {
    context.fillStyle = MODULE_COLORS.damage;
    context.fillRect(-9, -60, 18, 24 + level * 2);
    context.fillStyle = "#e8573f";
    context.fillRect(-5, -66, 10, 12);
  }

  function drawRapidEmitters(context) {
    context.fillStyle = MODULE_COLORS.rapid;
    context.fillRect(-18, -41, 6, 22);
    context.fillRect(12, -41, 6, 22);
  }

  function drawSplitTurrets(context) {
    context.fillStyle = MODULE_COLORS.split;
    context.fillRect(-52, -12, 9, 21);
    context.fillRect(43, -12, 9, 21);
  }

  function drawEnginePods(context) {
    context.fillStyle = MODULE_COLORS.engine;
    context.fillRect(-26, 20, 11, 18);
    context.fillRect(15, 20, 11, 18);
  }

  function drawMagnetField(context, player) {
    const level = getUpgradeLevel(player, "magnet");
    const time = Date.now() / 320;
    context.save();
    
    // Rotating radar scan line
    context.strokeStyle = MODULE_COLORS.magnet;
    context.lineWidth = 1.5;
    context.globalAlpha = 0.5;
    
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Math.cos(time) * 48, Math.sin(time) * 48);
    context.stroke();
    
    // Glowing boundary representing magnet field range
    context.setLineDash([4, 6]);
    context.beginPath();
    context.ellipse(0, 0, 48 + level * 5, 28 + level * 3, 0, 0, Math.PI * 2);
    context.stroke();
    
    context.restore();
  }

  function drawRepairNodes(context) {
    context.fillStyle = MODULE_COLORS.repair;
    context.fillRect(-26, 8, 7, 7);
    context.fillRect(19, 8, 7, 7);
  }

  function drawTwinPlasmaRails(context) {
    context.fillStyle = "#f0a040";
    context.fillRect(-24, -58, 8, 34);
    context.fillRect(16, -58, 8, 34);
    context.fillStyle = "#ffe0a3";
    context.fillRect(-21, -65, 3, 10);
    context.fillRect(18, -65, 3, 10);
  }

  function drawPiercingLens(context) {
    context.fillStyle = "#5ee6cf";
    context.fillRect(-4, -71, 8, 37);
    context.fillStyle = "#f2dfb6";
    context.beginPath();
    context.ellipse(0, -75, 10, 5, 0, 0, Math.PI * 2);
    context.fill();
  }

  function drawDronePods(context) {
    context.fillStyle = "#163342";
    drawPath(context, [[-74, -3], [-65, -10], [-55, -2], [-63, 8]]);
    drawPath(context, [[74, -3], [65, -10], [55, -2], [63, 8]]);
    context.fillStyle = "#7df8ff";
    context.fillRect(-67, -5, 6, 6);
    context.fillRect(61, -5, 6, 6);
  }

  function drawCore(context, player) {
    const isDreadnought = player?.shipType === "dreadnought";
    context.fillStyle = isDreadnought ? "#e8573f" : "#52d6bd";
    context.beginPath();
    context.ellipse(0, -11, 12, 16, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = isDreadnought ? "rgba(240, 184, 74, 0.52)" : "rgba(242, 223, 182, 0.52)";
    context.fillRect(-4, -22, 5, 20);
  }

  function drawStatusFields(context, player) {
    if (player.shields > 0) drawShieldField(context, player.shields, player.invulnerable);
    if (player.overdrive > 0) drawOverdriveField(context);
    if (player.lootCores > 0) drawCoreSockets(context, player.lootCores);
  }

  function drawShieldField(context, shields, invulnerable = 0) {
    context.save();
    
    const time = Date.now() / 420;
    const isInvuln = invulnerable > 0;
    const shieldColor = isInvuln ? "#ffffff" : "#7df8ff";
    
    context.strokeStyle = shieldColor;
    context.shadowColor = shieldColor;
    context.shadowBlur = isInvuln ? 24 : 10;
    context.lineWidth = isInvuln ? 3.5 : 2;
    context.globalAlpha = isInvuln ? 0.9 : 0.35 + shields * 0.08;
    
    context.beginPath();
    const radiusX = 72;
    const radiusY = 50;
    
    // Draw rotating hexagonal shield outline
    for (let index = 0; index < 6; index += 1) {
      const angle = (index * Math.PI) / 3 + time * 0.16;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY - 2;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
    
    // Hexagonal matrix pattern fill
    context.fillStyle = isInvuln ? "rgba(255, 255, 255, 0.15)" : "rgba(125, 248, 255, 0.04)";
    context.fill();
    
    context.restore();
  }

  function drawOverdriveField(context) {
    context.save();
    context.globalAlpha = 0.64;
    context.strokeStyle = "#f0a040";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-22, 33);
    context.lineTo(-8, 52);
    context.lineTo(0, 36);
    context.lineTo(8, 52);
    context.lineTo(22, 33);
    context.stroke();
    context.restore();
  }

  function drawCoreSockets(context, cores) {
    context.fillStyle = "#f2dfb6";
    for (let index = 0; index < Math.min(cores, 3); index += 1) {
      context.fillRect(-14 + index * 10, 3, 5, 5);
    }
  }

  function drawPath(context, points) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) context.lineTo(points[index][0], points[index][1]);
    context.closePath();
    context.fill();
  }

  function hasUpgrade(player, upgradeId) {
    return player.upgrades.includes(upgradeId);
  }

  function getUpgradeLevel(player, upgradeId) {
    return player.upgrades.filter((id) => id === upgradeId).length;
  }

  window.ShipVisual = { drawPlayer };
})();
