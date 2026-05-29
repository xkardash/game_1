(() => {
  const NOTICE_LIFE = 2.2;
  const POINTER_PADDING = 28;

  function getOverdrivePrompt(state) {
    if (state.phase !== "playing" || !state.player || !window.OverdriveSystem?.isReady?.(state.player)) return null;
    const mode = window.OverdriveSystem.getMode(state.player);
    return {
      color: mode.color,
      key: "E",
      title: `${mode.label} READY`,
    };
  }

  function getObjectivePointer(state, viewport, padding = POINTER_PADDING) {
    const objective = state.tacticalObjectives?.active;
    const camera = state.camera;
    if (!objective || !camera) return null;
    const screen = { x: objective.x - camera.x, y: objective.y - camera.y };
    const minX = padding;
    const minY = padding;
    const maxX = viewport.width - padding;
    const maxY = viewport.height - padding;
    if (screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY) return null;
    const center = { x: viewport.width / 2, y: viewport.height / 2 };
    const dx = screen.x - center.x;
    const dy = screen.y - center.y;
    const scaleX = dx === 0 ? Infinity : ((dx > 0 ? maxX : minX) - center.x) / dx;
    const scaleY = dy === 0 ? Infinity : ((dy > 0 ? maxY : minY) - center.y) / dy;
    const scale = Math.max(0, Math.min(Math.abs(scaleX), Math.abs(scaleY)));
    return {
      angle: Math.atan2(dy, dx),
      kind: objective.kind,
      title: objective.title,
      x: clamp(center.x + dx * scale, minX, maxX),
      y: clamp(center.y + dy * scale, minY, maxY),
    };
  }

  function addRewardNotice(state, event) {
    const notice = createRewardNotice(event);
    state.uxNotices = state.uxNotices || [];
    state.uxNotices.unshift(notice);
    state.uxNotices = state.uxNotices.slice(0, 3);
  }

  function createRewardNotice(event) {
    const reward = event.reward || {};
    return {
      color: getNoticeColor(event.kind, reward),
      detail: formatRewardDetail(reward),
      life: NOTICE_LIFE,
      maxLife: NOTICE_LIFE,
      title: `${event.title} tamamlandi`,
    };
  }

  function update(state, delta) {
    if (!state.uxNotices) return;
    for (const notice of state.uxNotices) notice.life -= delta;
    state.uxNotices = state.uxNotices.filter((notice) => notice.life > 0);
  }

  function draw(context, state, viewport) {
    drawObjectivePointer(context, getObjectivePointer(state, viewport));
    drawRewardNotices(context, state.uxNotices || []);
    drawOverdrivePrompt(context, getOverdrivePrompt(state), viewport);
  }

  function syncOverdriveButton(button, state) {
    if (!button) return;
    const prompt = getOverdrivePrompt(state);
    const isPlaying = state.phase === "playing";
    button.hidden = !isPlaying;
    button.disabled = !prompt;
    button.textContent = prompt ? `OD ${prompt.title.replace(" READY", "")}` : "OD";
    button.setAttribute("aria-label", prompt ? `Overdrive hazir: ${prompt.title.replace(" READY", "")}` : "Overdrive doluyor");
  }

  function formatRewardDetail(reward) {
    const parts = [];
    if (reward.xp) parts.push(`+${reward.xp} XP`);
    if (reward.overdriveCharge) parts.push(`Overdrive +${reward.overdriveCharge}`);
    if (reward.lootType) parts.push(formatLootName(reward.lootType));
    if (reward.shield) parts.push(`Kalkan +${reward.shield}`);
    return parts.join(" / ") || "Odul alindi";
  }

  function formatLootName(type) {
    const names = { core: "Core", overdrive: "Overdrive", repair: "Tamir", shield: "Kalkan" };
    return names[type] || type;
  }

  function getNoticeColor(kind, reward) {
    if (kind === "anomalyZone" || reward.overdriveCharge) return "#b889ff";
    if (reward.lootType === "core") return "#52d6bd";
    return "#f0b84a";
  }

  function drawOverdrivePrompt(context, prompt, viewport) {
    if (!prompt) return;
    const width = 164;
    const x = viewport.width - width - 24;
    const y = viewport.height - 92;
    context.save();
    context.globalAlpha = 0.9;
    context.fillStyle = "rgba(7, 16, 15, 0.78)";
    context.fillRect(x, y, width, 44);
    context.strokeStyle = prompt.color;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, 44);
    context.fillStyle = prompt.color;
    context.fillRect(x + 10, y + 9, 28, 26);
    context.fillStyle = "#07100f";
    context.font = "800 18px Outfit, sans-serif";
    context.textAlign = "center";
    context.fillText(prompt.key, x + 24, y + 29);
    context.fillStyle = "#f2dfb6";
    context.font = "800 13px Outfit, sans-serif";
    context.textAlign = "left";
    context.fillText(prompt.title, x + 48, y + 27);
    context.restore();
  }

  function drawObjectivePointer(context, pointer) {
    if (!pointer) return;
    context.save();
    context.translate(pointer.x, pointer.y);
    context.rotate(pointer.angle);
    context.fillStyle = "rgba(7, 16, 15, 0.82)";
    context.fillRect(-20, -20, 40, 40);
    context.strokeStyle = "#f2dfb6";
    context.lineWidth = 2;
    context.strokeRect(-20, -20, 40, 40);
    context.fillStyle = getPointerColor(pointer.kind);
    context.beginPath();
    context.moveTo(13, 0);
    context.lineTo(-8, -10);
    context.lineTo(-4, 0);
    context.lineTo(-8, 10);
    context.closePath();
    context.fill();
    context.restore();
    context.save();
    context.fillStyle = "#f2dfb6";
    context.font = "800 12px Outfit, sans-serif";
    context.textAlign = "center";
    context.fillText(pointer.title, pointer.x, pointer.y + 34);
    context.restore();
  }

  function drawRewardNotices(context, notices) {
    for (const [index, notice] of notices.entries()) {
      const alpha = Math.max(0, notice.life / notice.maxLife);
      const x = 24;
      const y = 24 + index * 54;
      context.save();
      context.globalAlpha = Math.min(0.92, 0.28 + alpha);
      context.fillStyle = "rgba(7, 16, 15, 0.78)";
      context.fillRect(x, y, 268, 46);
      context.strokeStyle = notice.color;
      context.lineWidth = 2;
      context.strokeRect(x, y, 268, 46);
      context.fillStyle = "#f2dfb6";
      context.font = "800 13px Outfit, sans-serif";
      context.textAlign = "left";
      context.fillText(notice.title, x + 12, y + 19);
      context.fillStyle = notice.color;
      context.font = "800 12px Outfit, sans-serif";
      context.fillText(notice.detail, x + 12, y + 36);
      context.restore();
    }
  }

  function getPointerColor(kind) {
    if (kind === "anomalyZone") return "#b889ff";
    if (kind === "supplyCapsule") return "#52d6bd";
    return "#f0b84a";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.CombatUx = {
    addRewardNotice,
    createRewardNotice,
    draw,
    getObjectivePointer,
    getOverdrivePrompt,
    syncOverdriveButton,
    update,
  };
})();
