(() => {
  function drawGame(context, state, world, viewport = world) {
    const shake = getShakeOffset(state);
    const camera = state.camera || { x: 0, y: 0, width: viewport.width, height: viewport.height };
    context.clearRect(0, 0, viewport.width, viewport.height);
    context.save();
    context.translate(shake.x, shake.y);
    drawSpace(context, state, world, camera);
    context.save();
    context.translate(-camera.x, -camera.y);
    window.LandmarkVisual.drawLandmarks(context, state);
    window.TacticalObjectiveSystem.drawWorld(context, state);
    drawXpGems(context, state);
    window.PickupVisual.drawLootDrops(context, state);
    window.JuiceVisual.drawCombatPings(context, state);
    window.JuiceVisual.drawBossTelegraphs(context, state);
    window.BossUi.drawBossPhaseFlashes(context, state);
    window.RelicReveal.drawWorld(context, state);
    drawMuzzleFlashes(context, state);
    drawBullets(context, state);
    drawEnemies(context, state);
    window.PickupVisual.drawCoreCombatEffects(context, state);
    window.RelicVisual.drawRelicFields(context, state);
    window.OverdriveSystem.drawWorld(context, state);
    drawEnemyBullets(context, state);
    drawPlayer(context, state);
    drawImpactFlashes(context, state);
    drawParticles(context, state);
    context.restore();
    window.BossUi.drawBossHud(context, state, viewport);
    window.RelicReveal.drawScreen(context, state, viewport);
    window.OverdriveSystem.drawHud(context, state, viewport);
    window.RadarVisual.drawRadar(context, state, world, viewport);
    window.CombatUx.draw(context, state, viewport);
    context.restore();
  }

  function getShakeOffset(state) {
    if (state.shake <= 0) return { x: 0, y: 0 };
    const strength = state.shake * 34;
    return {
      x: (Math.random() - 0.5) * strength,
      y: (Math.random() - 0.5) * strength,
    };
  }

  function drawSpace(context, state, world, camera) {
    context.fillStyle = "#07100f";
    context.fillRect(-24, -24, camera.width + 48, camera.height + 48);
    context.save();
    context.translate(-camera.x * 0.38, -camera.y * 0.38);
    for (const object of state.spaceObjects) {
      if (object.type === "nebula") drawNebula(context, object, world);
    }
    drawStars(context, state.stars, camera);
    for (const object of state.spaceObjects) {
      if (object.type === "planet") drawPlanet(context, object);
      if (object.type === "moon") drawMoon(context, object);
    }
    context.restore();
  }

  function drawNebula(context, nebula, world) {
    context.save();
    context.globalAlpha = nebula.alpha;
    context.fillStyle = nebula.color;
    context.beginPath();
    context.moveTo(nebula.x - 160, nebula.y + 12);
    context.bezierCurveTo(world.width * 0.3, nebula.y - 66, world.width * 0.55, nebula.y + 132, nebula.x + nebula.width, nebula.y);
    context.lineTo(nebula.x + nebula.width - 80, nebula.y + nebula.height);
    context.bezierCurveTo(world.width * 0.52, nebula.y + 32, world.width * 0.28, nebula.y + 154, nebula.x - 160, nebula.y + 60);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawStars(context, stars, camera) {
    for (const star of stars) {
      const parallax = star.layer === 1 ? 0.28 : (star.layer === 2 ? 0.48 : 0.72);
      const x = star.x + camera.x * (0.38 - parallax);
      const y = star.y + camera.y * (0.38 - parallax);
      context.fillStyle = star.color;
      context.globalAlpha = star.alpha ?? 0.42;
      context.fillRect(x, y, star.size, star.size);
      if (star.layer === 3) context.fillRect(x - 1, y, star.size + 2, 1);
    }
    context.globalAlpha = 1;
  }

  function drawPlanet(context, planet) {
    context.save();
    context.strokeStyle = planet.ring;
    context.globalAlpha = 0.48;
    context.lineWidth = 5;
    context.beginPath();
    context.ellipse(planet.x, planet.y + 8, planet.radius * 1.52, planet.radius * 0.34, -0.18, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = planet.color;
    context.beginPath();
    context.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = planet.shade;
    context.globalAlpha = 0.66;
    context.beginPath();
    context.arc(planet.x - planet.radius * 0.2, planet.y + planet.radius * 0.08, planet.radius * 0.92, Math.PI * 1.45, Math.PI * 0.5);
    context.lineTo(planet.x, planet.y + planet.radius);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawMoon(context, moon) {
    context.save();
    context.fillStyle = moon.color;
    context.beginPath();
    context.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = moon.shade;
    context.globalAlpha = 0.45;
    context.beginPath();
    context.arc(moon.x - moon.radius * 0.25, moon.y, moon.radius * 0.82, Math.PI * 1.4, Math.PI * 0.55);
    context.lineTo(moon.x, moon.y + moon.radius);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawPlayer(context, state) {
    window.ShipVisual.drawPlayer(context, state);
  }

  function drawEnemies(context, state) {
    window.EnemyVisual.drawEnemies(context, state);
  }

  function drawBullets(context, state) {
    for (const bullet of state.bullets) {
      const trailX = bullet.vx * -0.045;
      const trailY = bullet.vy * -0.045;
      const isPlasma = bullet.style === "plasma" || bullet.style === "twinPlasma" || bullet.style === "novaLance";
      context.globalAlpha = 0.32;
      context.fillStyle = bullet.trailColor || "#f0b84a";
      context.beginPath();
      context.moveTo(bullet.x, bullet.y);
      context.lineTo(bullet.x + trailX, bullet.y + trailY);
      context.lineWidth = isPlasma ? 7 : 4;
      context.strokeStyle = bullet.trailColor || "#f0b84a";
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = bullet.color || "#f2dfb6";
      if (isPlasma) {
        context.beginPath();
        context.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        context.fill();
        if (bullet.style === "twinPlasma" || bullet.style === "novaLance") {
          context.fillStyle = "#ffe0a3";
          context.beginPath();
          context.arc(bullet.x, bullet.y, bullet.width / 4, 0, Math.PI * 2);
          context.fill();
        }
      } else if (bullet.style === "piercingLaser") {
        window.ProjectileVisual.drawPiercingLaser(context, bullet);
      } else if (bullet.style === "phaseShot") {
        window.ProjectileVisual.drawPhaseShot(context, bullet);
      } else if (bullet.style === "droneLaser") {
        context.beginPath();
        context.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        context.fill();
      } else if (bullet.style === "coreDrone") {
        window.PickupVisual.drawCoreDroneBullet(context, bullet);
      } else {
        context.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
      }
    }
  }

  function drawEnemyBullets(context, state) {
    for (const bullet of state.enemyBullets) {
      if (bullet.style === "bossMine" || bullet.style === "coreMine") {
        drawBossMine(context, bullet);
        continue;
      }
      if (bullet.style === "meteor") {
        drawMeteor(context, bullet);
        continue;
      }
      if (bullet.style === "ionBolt") {
        drawIonBolt(context, bullet);
        continue;
      }
      if (bullet.style === "riftMine") {
        drawRiftMine(context, bullet);
        continue;
      }
      if (bullet.style === "plasmaWall") {
        drawPlasmaWall(context, bullet);
        continue;
      }
      const trailX = bullet.vx * -0.052;
      const trailY = bullet.vy * -0.052;
      context.globalAlpha = 0.34;
      context.strokeStyle = bullet.trailColor;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(bullet.x, bullet.y);
      context.lineTo(bullet.x + trailX, bullet.y + trailY);
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = bullet.color;
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawBossMine(context, bullet) {
    context.save();
    context.strokeStyle = bullet.trailColor;
    context.fillStyle = bullet.color;
    context.lineWidth = 3;
    context.globalAlpha = 0.82;
    context.beginPath();
    context.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 0.38;
    context.beginPath();
    context.arc(bullet.x, bullet.y, bullet.width / 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawMeteor(context, bullet) {
    const angle = Math.atan2(bullet.vy, bullet.vx) - Math.PI / 2;
    context.save();
    context.translate(bullet.x, bullet.y);
    context.rotate(angle);

    context.globalAlpha = 0.2;
    context.fillStyle = bullet.trailColor;
    context.beginPath();
    context.ellipse(0, -32, 10, 34, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.34;
    context.fillStyle = bullet.color;
    context.beginPath();
    context.ellipse(0, -16, 15, 24, 0, 0, Math.PI * 2);
    context.fill();

    context.globalAlpha = 0.58;
    context.strokeStyle = bullet.trailColor;
    context.lineWidth = 2;
    for (let index = 0; index < 3; index += 1) {
      const offset = (index - 1) * 8;
      context.beginPath();
      context.moveTo(offset, -42 - index * 5);
      context.lineTo(offset * 0.45, -18 - index * 2);
      context.stroke();
    }

    context.globalAlpha = 1;
    context.fillStyle = "#5a2f22";
    context.beginPath();
    context.moveTo(-3, -15);
    context.lineTo(12, -8);
    context.lineTo(15, 3);
    context.lineTo(7, 14);
    context.lineTo(-6, 16);
    context.lineTo(-15, 7);
    context.lineTo(-13, -7);
    context.closePath();
    context.fill();

    context.fillStyle = "#2f1c18";
    context.beginPath();
    context.moveTo(-9, -7);
    context.lineTo(2, -12);
    context.lineTo(10, -4);
    context.lineTo(3, 4);
    context.lineTo(-8, 3);
    context.closePath();
    context.fill();

    context.strokeStyle = bullet.color;
    context.lineWidth = 2;
    context.globalAlpha = 0.82;
    context.beginPath();
    context.moveTo(-5, -4);
    context.lineTo(2, 1);
    context.lineTo(8, -3);
    context.moveTo(-2, 8);
    context.lineTo(5, 5);
    context.stroke();

    context.fillStyle = bullet.color;
    context.globalAlpha = 0.9;
    context.beginPath();
    context.arc(5, 1, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawIonBolt(context, bullet) {
    const angle = Math.atan2(bullet.vy, bullet.vx);
    context.save();
    context.translate(bullet.x, bullet.y);
    context.rotate(angle);
    context.globalAlpha = 0.5;
    context.strokeStyle = bullet.trailColor;
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(-30, 0);
    context.lineTo(18, 0);
    context.stroke();
    context.globalAlpha = 1;
    context.strokeStyle = bullet.color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-12, -5);
    context.lineTo(0, 0);
    context.lineTo(-12, 5);
    context.moveTo(-2, 0);
    context.lineTo(24, 0);
    context.stroke();
    context.restore();
  }

  function drawRiftMine(context, bullet) {
    context.save();
    context.translate(bullet.x, bullet.y);
    context.strokeStyle = bullet.color;
    context.fillStyle = bullet.color;
    context.lineWidth = 3;
    context.globalAlpha = 0.42;
    context.beginPath();
    context.arc(0, 0, bullet.width / 2, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.88;
    context.beginPath();
    context.arc(0, 0, bullet.width / 2.7, 0, Math.PI * 2);
    context.stroke();
    context.rotate((bullet.life || 0) * 2.2);
    context.strokeStyle = bullet.trailColor;
    context.beginPath();
    context.moveTo(-bullet.width / 2, 0);
    context.lineTo(bullet.width / 2, 0);
    context.moveTo(0, -bullet.width / 2);
    context.lineTo(0, bullet.width / 2);
    context.stroke();
    context.restore();
  }

  function drawPlasmaWall(context, bullet) {
    context.save();
    context.translate(bullet.x, bullet.y);
    context.globalAlpha = 0.28;
    context.fillStyle = bullet.trailColor;
    context.fillRect(-bullet.width / 2 - 8, -bullet.height / 2, bullet.width + 16, bullet.height);
    context.globalAlpha = 0.86;
    context.fillStyle = bullet.color;
    context.fillRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
    context.globalAlpha = 1;
    context.fillStyle = "#f2dfb6";
    context.fillRect(-3, -bullet.height / 2, 6, bullet.height);
    context.restore();
  }

  function drawXpGems(context, state) {
    for (const gem of state.xpGems) {
      context.fillStyle = "#52b69a";
      context.beginPath();
      context.moveTo(gem.x, gem.y - gem.size);
      context.lineTo(gem.x + gem.size, gem.y);
      context.lineTo(gem.x, gem.y + gem.size);
      context.lineTo(gem.x - gem.size, gem.y);
      context.closePath();
      context.fill();
    }
  }

  function drawMuzzleFlashes(context, state) {
    for (const flash of state.muzzleFlashes) {
      context.globalAlpha = flash.life / flash.maxLife;
      context.fillStyle = "#f0b84a";
      context.beginPath();
      context.moveTo(flash.x, flash.y - flash.size);
      context.lineTo(flash.x - flash.size * 0.45, flash.y + 4);
      context.lineTo(flash.x + flash.size * 0.45, flash.y + 4);
      context.closePath();
      context.fill();
    }
    context.globalAlpha = 1;
  }

  function drawImpactFlashes(context, state) {
    for (const flash of state.impactFlashes) {
      const alpha = flash.life / flash.maxLife;
      const size = flash.size * (1.2 - alpha);
      context.globalAlpha = alpha;
      context.strokeStyle = flash.color;
      context.lineWidth = 3;
      context.strokeRect(flash.x - size / 2, flash.y - size / 2, size, size);
    }
    context.globalAlpha = 1;
  }

  function drawParticles(context, state) {
    for (const particle of state.particles) {
      context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    context.globalAlpha = 1;
  }

  window.ShooterDraw = { drawGame, drawMeteorHazard: drawMeteor };
})();
