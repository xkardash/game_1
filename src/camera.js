(() => {
  function createCamera(viewport, world) {
    const camera = { x: 0, y: 0, width: viewport.width, height: viewport.height };
    updateCamera(camera, { x: world.width / 2, y: world.height / 2 }, world, viewport);
    return camera;
  }

  function updateCamera(camera, target, world, viewport) {
    camera.width = viewport.width;
    camera.height = viewport.height;
    camera.x = clamp(target.x - viewport.width / 2, 0, Math.max(0, world.width - viewport.width));
    camera.y = clamp(target.y - viewport.height / 2, 0, Math.max(0, world.height - viewport.height));
  }

  function toScreen(camera, point) {
    return { x: point.x - camera.x, y: point.y - camera.y };
  }

  function isVisible(camera, item, padding = 90) {
    return item.x + item.width / 2 > camera.x - padding
      && item.x - item.width / 2 < camera.x + camera.width + padding
      && item.y + item.height / 2 > camera.y - padding
      && item.y - item.height / 2 < camera.y + camera.height + padding;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  window.ShooterCamera = { createCamera, isVisible, toScreen, updateCamera };
})();
