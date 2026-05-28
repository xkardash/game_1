(() => {
  function createStars(count, world) {
    return Array.from({ length: count }, () => ({
      layer: 1 + Math.floor(Math.random() * 3),
      x: Math.random() * world.width,
      y: Math.random() * world.height,
      size: 0.8 + Math.random() * 2.8,
      speed: 10 + Math.random() * 42,
      alpha: 0.28 + Math.random() * 0.46,
      color: Math.random() > 0.5 ? "#f0b84a" : "#52b69a",
    }));
  }

  function createSpaceObjects(world) {
    return [
      { type: "nebula", x: 120, y: 78, width: world.width * 0.72, height: 84, color: "#244f59", alpha: 0.14 },
      { type: "planet", x: world.width - 130, y: 104, radius: 78, color: "#5d8178", shade: "#16241f", ring: "#c6a25b" },
      { type: "moon", x: 138, y: 128, radius: 18, color: "#d8c79a", shade: "#6b614f" },
      { type: "moon", x: world.width - 300, y: 240, radius: 10, color: "#9fb8b1", shade: "#42524f" },
    ];
  }

  function updateStars(stars, world, delta) {
    for (const star of stars) {
      star.y += star.speed * delta;
      if (star.y > world.height) {
        star.y = -8;
        star.x = Math.random() * world.width;
      }
    }
  }

  function emitParticles(state, x, y, color, count, options = {}) {
    const spread = options.spread ?? 210;
    const baseLife = options.life ?? 0.4;
    const baseSize = options.size ?? 4;
    for (let index = 0; index < count; index += 1) {
      const life = baseLife + Math.random() * baseLife;
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        life,
        maxLife: life,
        size: baseSize + Math.random() * baseSize,
        color,
      });
    }
  }

  function addMuzzleFlash(state, x, y) {
    state.muzzleFlashes.push({ x, y, life: 0.09, maxLife: 0.09, size: 18 });
  }

  function addImpactFlash(state, x, y, color) {
    state.impactFlashes.push({ x, y, life: 0.18, maxLife: 0.18, size: 34, color });
  }

  function updateTimedEffects(state, delta) {
    updateParticles(state.particles, delta);
    updateTimedList(state.muzzleFlashes, delta);
    updateTimedList(state.impactFlashes, delta);
    state.shake = Math.max(0, state.shake - delta * 3.4);
    for (const enemy of state.enemies) enemy.flash = Math.max(0, (enemy.flash || 0) - delta);
  }

  function updateParticles(particles, delta) {
    for (const particle of particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta;
    }
    removeDeadItems(particles);
  }

  function updateTimedList(items, delta) {
    for (const item of items) item.life -= delta;
    removeDeadItems(items);
  }

  function removeDeadItems(items) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].life <= 0) items.splice(index, 1);
    }
  }

  window.ShooterEffects = {
    addImpactFlash,
    addMuzzleFlash,
    createStars,
    createSpaceObjects,
    emitParticles,
    updateStars,
    updateTimedEffects,
  };
})();
