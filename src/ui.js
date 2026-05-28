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
    const hangarReturnButton = document.querySelector("#hangarReturnButton");

    const dashboard = document.querySelector("#dashboard");
    const dashboardStatsList = document.querySelector("#dashboardStatsList");
    const runtimeStatsToggle = document.querySelector("#runtimeStatsToggle");
    const runtimeStatsPanel = document.querySelector("#runtimeStatsPanel");
    let lastDashboardStatsSignature = "";
    let lastRuntimeStatsSignature = "";
    let runtimeStatsOpen = false;
    let runtimeStatsRows = [];

    if (runtimeStatsToggle) {
      runtimeStatsToggle.addEventListener("click", () => {
        runtimeStatsOpen = !runtimeStatsOpen;
        lastRuntimeStatsSignature = "";
        syncRuntimeStatsPanel(runtimeStatsRows, true, "");
      });
    }

    function sync(state) {
      const copy = getPhaseCopy(state);
      scoreValue.textContent = String(state.score);
      livesValue.textContent = String(Math.max(0, state.player.lives));
      waveValue.textContent = String(state.wave);
      xpValue.textContent = `${state.xp}/${state.xpNeeded}`;
      bestValue.textContent = String(state.highScore);
      overlay.classList.toggle("is-hidden", ["playing", "ready", "gameOver"].includes(state.phase));
      if (dashboard) {
        dashboard.classList.toggle("is-hidden", !["ready", "gameOver"].includes(state.phase));
        const aegisBtn = document.querySelector("#ship-aegis");
        const dreadnoughtBtn = document.querySelector("#ship-dreadnought");
        if (aegisBtn && dreadnoughtBtn) {
          const isAegis = (state.selectedShip || "aegis") === "aegis";
          aegisBtn.classList.toggle("active", isAegis);
          dreadnoughtBtn.classList.toggle("active", !isAegis);
        }
        const colorBtns = ["cyan", "crimson", "acid", "gold"].map(c => document.querySelector(`#trail-${c}`));
        colorBtns.forEach(btn => {
          if (btn) {
            const activeColor = state.trailColor || ((state.selectedShip || "aegis") === "aegis" ? "cyan" : "crimson");
            btn.classList.toggle("active", btn.getAttribute("data-color") === activeColor);
          }
        });
      }
      if (hangarReturnButton) {
        hangarReturnButton.hidden = !["countdown", "playing", "paused", "levelUp", "relicChoice"].includes(state.phase);
      }
      actionButton.textContent = ["countdown", "playing", "paused", "levelUp", "relicChoice"].includes(state.phase) ? "Sifirla" : "Baslat";
      phaseLabel.textContent = copy.label;
      phaseTitle.textContent = copy.title;
      syncUpgradePanel(state);
      syncStatPanels(state);
    }

    function syncUpgradePanel(state) {
      const isChoicePhase = state.phase === "levelUp" || state.phase === "relicChoice";
      upgradePanel.hidden = !isChoicePhase;
      if (!isChoicePhase) return;
      for (const [index, button] of upgradeButtons.entries()) {
        if (state.phase === "relicChoice") renderRelicCard(button, state.relicChoices[index], index);
        else renderUpgradeCard(button, state.upgradeChoices[index], index, state.player);
      }
    }

    function renderUpgradeCard(button, upgrade, index, player) {
      button.replaceChildren();
      if (!upgrade) {
        button.className = "upgrade-card";
        button.removeAttribute("data-rarity");
        button.disabled = true;
        return;
      }

      const view = window.UpgradeCodex.getUpgradeView(upgrade, player);
      button.disabled = false;
      button.className = "upgrade-card";
      button.dataset.rarity = view.rarity;
      button.setAttribute("aria-label", `${index + 1}. ${view.title}. ${view.effect}. ${view.synergy || view.body}`);
      button.append(
        createMetaRow(view),
        createTextElement("upgrade-title", `${index + 1}. ${view.title}`),
        createTextElement("upgrade-body", view.body),
        createTextElement("upgrade-effect", view.effect),
      );
      if (view.synergy) button.append(createTextElement("upgrade-synergy", view.synergy));
    }

    function renderRelicCard(button, relic, index) {
      button.replaceChildren();
      if (!relic) {
        button.className = "upgrade-card relic-card";
        button.removeAttribute("data-rarity");
        button.disabled = true;
        return;
      }

      const view = window.RelicSystem.getRelicView(relic);
      button.disabled = false;
      button.className = "upgrade-card relic-card";
      button.dataset.rarity = view.rarity;
      button.setAttribute("aria-label", `${index + 1}. ${view.title}. ${view.effect}. ${view.body}`);
      button.append(
        createRelicMetaRow(view),
        createTextElement("relic-title", `${index + 1}. ${view.title}`),
        createTextElement("relic-body", view.body),
        createTextElement("relic-effect", view.effect),
      );
    }

    function createRelicMetaRow(view) {
      const row = document.createElement("span");
      row.className = "upgrade-meta relic-meta";
      row.append(
        createTextElement("upgrade-rarity", view.rarityLabel),
        createTextElement("relic-category", view.category),
      );
      return row;
    }

    function syncStatPanels(state) {
      if (!window.StatSystem) return;
      const rows = window.StatSystem.createStatRows(state);
      const signature = rows.map((row) => `${row.key}:${row.value}:${row.detail}`).join("|");
      runtimeStatsRows = rows;
      if (dashboardStatsList && signature !== lastDashboardStatsSignature) {
        renderStatRows(dashboardStatsList, rows);
        lastDashboardStatsSignature = signature;
      }

      const showRuntimeStats = ["countdown", "playing", "paused", "levelUp", "relicChoice"].includes(state.phase);
      syncRuntimeStatsPanel(rows, showRuntimeStats, signature);
    }

    function syncRuntimeStatsPanel(rows, showRuntimeStats, signature) {
      if (!runtimeStatsPanel || !runtimeStatsToggle) return;
      if (!showRuntimeStats) runtimeStatsOpen = false;
      runtimeStatsToggle.hidden = !showRuntimeStats;
      runtimeStatsToggle.textContent = runtimeStatsOpen ? "STAT -" : "STAT +";
      runtimeStatsToggle.setAttribute("aria-expanded", showRuntimeStats && runtimeStatsOpen ? "true" : "false");
      runtimeStatsPanel.hidden = !showRuntimeStats || !runtimeStatsOpen;
      if (runtimeStatsPanel.hidden) return;
      const nextSignature = signature || rows.map((row) => `${row.key}:${row.value}:${row.detail}`).join("|");
      if (nextSignature !== lastRuntimeStatsSignature) {
        renderStatRows(runtimeStatsPanel, rows);
        lastRuntimeStatsSignature = nextSignature;
      }
    }

    function renderStatRows(container, rows) {
      container.replaceChildren(...rows.map(createStatRow));
    }

    function createStatRow(row) {
      const element = document.createElement("div");
      element.className = "stat-row";
      element.dataset.statKey = row.key;
      element.append(
        createTextElement("stat-label", row.label),
        createTextElement("stat-value", row.value),
        createTextElement("stat-detail", row.detail),
      );
      return element;
    }

    function createMetaRow(view) {
      const row = document.createElement("span");
      row.className = "upgrade-meta";
      row.append(
        createTextElement("upgrade-rarity", view.rarityLabel),
        createTextElement("upgrade-category", view.category),
      );
      return row;
    }

    function createTextElement(className, text) {
      const element = document.createElement("span");
      element.className = className;
      element.textContent = text;
      return element;
    }

    return { actionButton, hangarReturnButton, sync, upgradeButtons };
  }

  function getPhaseCopy(state) {
    if (state.phase === "countdown") return { label: "Hazirlan", title: String(Math.max(1, Math.ceil(state.countdown / 0.6))) };
    if (state.phase === "paused") return { label: "Mola", title: "Duraklatildi" };
    if (state.phase === "levelUp") return { label: "Seviye Atladi", title: "Bir guc sec" };
    if (state.phase === "relicChoice") return { label: "Boss Relic", title: "Bir enkaz odulu sec" };
    if (state.phase === "gameOver") return { label: "Bitti", title: `Puan ${state.score}` };
    return { label: "Hazir", title: "Uzay hattini koru" };
  }

  window.ShooterUi = { createGameUi };
})();
