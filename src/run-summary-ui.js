(() => {
  function createRunSummaryUi() {
    const panel = document.querySelector("#runSummaryPanel");
    const score = document.querySelector("#summaryScore");
    const best = document.querySelector("#summaryBest");
    const lines = [0, 1, 2, 3, 4].map((index) => document.querySelector(`#summaryLine${index}`));

    function sync(state) {
      const summary = state.runSummary;
      const isVisible = state.phase === "gameOver" && Boolean(summary);
      panel.hidden = !isVisible;
      if (!isVisible) return;
      score.textContent = `Puan ${summary.score}`;
      best.textContent = `En iyi ${summary.best}`;
      for (const [index, line] of lines.entries()) {
        line.textContent = summary.lines[index] || "";
      }
    }

    return { sync };
  }

  window.RunSummaryUi = { createRunSummaryUi };
})();
