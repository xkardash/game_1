(() => {
  function installControls(options) {
    const { pressedKeys, state, startGame, togglePause, touchInput } = options;
    window.addEventListener("keydown", (event) => handleKeyDown(event, options));
    window.addEventListener("keyup", (event) => pressedKeys.delete(event.code));
    bindTouchButton("#leftTouch", "left", state, startGame, touchInput);
    bindTouchButton("#rightTouch", "right", state, startGame, touchInput);
    bindTouchButton("#upTouch", "up", state, startGame, touchInput);
    bindTouchButton("#downTouch", "down", state, startGame, touchInput);
    bindOverdriveButton("#overdriveTouch", state, options.activateOverdrive);
    window.ShooterControls.togglePause = togglePause;
  }

  function handleKeyDown(event, options) {
    const { pressedKeys, state, startGame, togglePause } = options;
    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      togglePause();
      return;
    }
    if (event.code === "KeyE" && state.phase === "playing") {
      event.preventDefault();
      options.activateOverdrive?.();
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

  function bindOverdriveButton(buttonId, state, activateOverdrive) {
    const button = document.querySelector(buttonId);
    if (!button) return;
    let pointerHandled = false;
    const activate = (event) => {
      event?.preventDefault?.();
      if (state.phase !== "playing") return;
      activateOverdrive?.();
    };
    button.addEventListener("pointerdown", (event) => {
      pointerHandled = true;
      activate(event);
    });
    button.addEventListener("click", (event) => {
      if (pointerHandled) {
        pointerHandled = false;
        event.preventDefault?.();
        return;
      }
      activate(event);
    });
  }

  window.ShooterControls = { installControls, togglePause: null };
})();
