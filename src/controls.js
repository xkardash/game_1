(() => {
  function installControls(options) {
    const { pressedKeys, state, startGame, togglePause, touchInput } = options;
    window.addEventListener("keydown", (event) => handleKeyDown(event, options));
    window.addEventListener("keyup", (event) => pressedKeys.delete(event.code));
    bindTouchButton("#leftTouch", "left", state, startGame, touchInput);
    bindTouchButton("#rightTouch", "right", state, startGame, touchInput);
    bindTouchButton("#upTouch", "up", state, startGame, touchInput);
    bindTouchButton("#downTouch", "down", state, startGame, touchInput);
    window.ShooterControls.togglePause = togglePause;
  }

  function handleKeyDown(event, options) {
    const { pressedKeys, state, startGame, togglePause } = options;
    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      togglePause();
      return;
    }
    pressedKeys.add(event.code);
    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "ready" || state.phase === "gameOver") startGame();
    }
    if (["Digit1", "Digit2", "Digit3"].includes(event.code) && (state.phase === "levelUp" || state.phase === "relicChoice")) {
      options.chooseUpgrade(Number(event.code.replace("Digit", "")) - 1);
    }
  }

  function bindTouchButton(buttonId, inputName, state, startGame, touchInput) {
    const button = document.querySelector(buttonId);
    const setActive = (isActive) => {
      touchInput[inputName] = isActive;
      if (inputName === "fire" && isActive && (state.phase === "ready" || state.phase === "gameOver")) startGame();
    };
    button.addEventListener("pointerdown", () => setActive(true));
    button.addEventListener("pointerup", () => setActive(false));
    button.addEventListener("pointerleave", () => setActive(false));
    button.addEventListener("pointercancel", () => setActive(false));
  }

  window.ShooterControls = { installControls, togglePause: null };
})();
