(() => {
  function drawLandmarks(context, state) {
    const landmarkState = state.landmarkState;
    if (!landmarkState) return;
    for (const landmark of landmarkState.landmarks) {
      drawZone(context, landmark, landmarkState.activeZone?.id === landmark.id);
      if (landmark.id === "asteroidField") drawAsteroidField(context, landmark);
      else drawBeacon(context, landmark);
    }
  }

  function drawZone(context, landmark, isActive) {
    context.save();
    context.globalAlpha = isActive ? 0.22 : 0.1;
    context.fillStyle = landmark.kind === "hazard" ? "#e8573f" : "#52b69a";
    context.beginPath();
    context.arc(landmark.x, landmark.y, landmark.radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = isActive ? 0.74 : 0.38;
    context.strokeStyle = landmark.kind === "hazard" ? "#f0a040" : "#f2dfb6";
    context.lineWidth = isActive ? 4 : 2;
    context.setLineDash([12, 10]);
    context.stroke();
    context.restore();
  }

  function drawAsteroidField(context, landmark) {
    context.save();
    context.fillStyle = "#6d5a48";
    for (let index = 0; index < 9; index += 1) {
      const angle = index * 1.7;
      const distance = 34 + (index % 3) * 26;
      context.beginPath();
      context.arc(landmark.x + Math.cos(angle) * distance, landmark.y + Math.sin(angle) * distance, 9 + (index % 4), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawBeacon(context, landmark) {
    context.save();
    context.translate(landmark.x, landmark.y);
    context.strokeStyle = "#f2dfb6";
    context.fillStyle = landmark.id === "relayRuin" ? "#52b69a" : "#f0b84a";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(0, -34);
    context.lineTo(24, 24);
    context.lineTo(-24, 24);
    context.closePath();
    context.stroke();
    context.fillRect(-7, -7, 14, 14);
    context.restore();
  }

  window.LandmarkVisual = { drawLandmarks };
})();
