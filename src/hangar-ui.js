(() => {
  function createHangarUi() {
    const coreValue = document.querySelector("#hangarCoreValue");
    const buttons = window.HangarSystem.getUpgradeList().map((upgrade) => ({
      ...upgrade,
      element: document.querySelector(`#hangar-${upgrade.id}`),
    }));

    function sync(hangar) {
      coreValue.textContent = String(hangar.cores);
      for (const upgrade of buttons) {
        const level = hangar.upgrades[upgrade.id] || 0;
        upgrade.element.textContent = `${upgrade.title} Lv${level}/${upgrade.max} - ${upgrade.cost} core`;
        upgrade.element.disabled = level >= upgrade.max || hangar.cores < upgrade.cost;
      }
    }

    return { buttons, sync };
  }

  window.HangarUi = { createHangarUi };
})();
