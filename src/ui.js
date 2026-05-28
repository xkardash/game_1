(() => {
  function createGameUi() {
    const actionButton = document.querySelector("#actionButton");
    const overlay = document.querySelector("#overlay");
    const phaseLabel = document.querySelector("#phaseLabel");
    const phaseTitle = document.querySelector("#phaseTitle");
    const scoreValue = document.querySelector("#scoreValue");
    const livesValue = document.querySelector("#livesValue");
    const waveValue = document.querySelector("#waveValue");
    const xpValue = document.querySelector("#xpValue");
    const bestValue = document.querySelector("#bestValue");
    const upgradePanel = document.querySelector("#upgradePanel");
    const upgradeButtons = [0, 1, 2].map((index) => document.querySelector(`#upgradeChoice${index}`));

    function sync(state) {
      const copy = getPhaseCopy(state);
      scoreValue.textContent = String(state.score);
      livesValue.textContent = String(Math.max(0, state.player.lives));
      waveValue.textContent = String(state.wave);
      xpValue.textContent = `${state.xp}/${state.xpNeeded}`;
      bestValue.textContent = String(state.highScore);
      overlay.classList.toggle("is-hidden", state.phase === "playing");
      actionButton.textContent = ["countdown", "playing", "paused", "levelUp"].includes(state.phase) ? "Sifirla" : "Baslat";
      phaseLabel.textContent = copy.label;
      phaseTitle.textContent = copy.title;
      syncUpgradePanel(state);
    }

    function syncUpgradePanel(state) {
      upgradePanel.hidden = state.phase !== "levelUp";
      for (const [index, button] of upgradeButtons.entries()) {
        const upgrade = state.upgradeChoices[index];
        button.textContent = upgrade ? `${index + 1}. ${upgrade.title}\n${upgrade.body}` : "";
      }
    }

    return { actionButton, sync, upgradeButtons };
  }

  function getPhaseCopy(state) {
    if (state.phase === "countdown") return { label: "Hazirlan", title: String(Math.max(1, Math.ceil(state.countdown / 0.6))) };
    if (state.phase === "paused") return { label: "Mola", title: "Duraklatildi" };
    if (state.phase === "levelUp") return { label: "Seviye Atladi", title: "Bir guc sec" };
    if (state.phase === "gameOver") return { label: "Bitti", title: `Puan ${state.score}` };
    return { label: "Hazir", title: "Uzay hattini koru" };
  }

  window.ShooterUi = { createGameUi };
})();
