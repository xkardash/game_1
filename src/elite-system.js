(() => {
  const AFFIXES = [
    { id: "overcharged", color: "#f0a040", scoreBonus: 95, speedScale: 1.35 },
    { id: "coreCarrier", color: "#52d6bd", hpBonus: 2, scoreBonus: 150 },
    { id: "armored", color: "#d7a64f", hpBonus: 5, scoreBonus: 115, widthBonus: 8 },
  ];

  function getEliteAffix(wave, spawnIndex) {
    if (wave < 4 || spawnIndex % 5 !== 0) return null;
    return AFFIXES[(wave + spawnIndex) % AFFIXES.length];
  }

  function applyEliteAffix(enemy, wave, spawnIndex) {
    if (enemy.captain) return enemy;
    const affix = getEliteAffix(wave, spawnIndex);
    if (!affix) return enemy;
    enemy.elite = true;
    enemy.affix = affix.id;
    enemy.affixColor = affix.color;
    enemy.score += affix.scoreBonus;
    if (affix.hpBonus) {
      enemy.hp += affix.hpBonus;
      enemy.maxHp += affix.hpBonus;
    }
    if (affix.speedScale) enemy.speed = Math.round(enemy.speed * affix.speedScale);
    if (affix.widthBonus) enemy.width += affix.widthBonus;
    return enemy;
  }

  window.EliteSystem = { applyEliteAffix, getEliteAffix };
})();
