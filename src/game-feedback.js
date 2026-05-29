(() => {
  function createGameFeedback(audio, juice) {
    return {
      bossVolley: (state, event) => {
        juice.addBossVolleyWarning(state, event.boss, event.phase);
        audio.play("bossVolley");
      },
      bossTelegraph: (state, event) => {
        juice.addPing(state, "bossVolley", event.telegraph.x, event.telegraph.y, {
          color: event.telegraph.color,
          life: event.telegraph.maxLife,
          lineWidth: event.telegraph.lineWidth,
          maxRadius: event.telegraph.radius + 22,
          radius: Math.max(30, event.telegraph.radius * 0.46),
        });
      },
      eliteSpawn: (state, enemy) => {
        juice.addEliteSpawnPing(state, enemy);
        audio.play("elite");
      },
      enemyHit: (state, enemy) => {
        juice.addPing(state, "hit", enemy.x, enemy.y);
        audio.play(enemy.type === "boss" ? "bossHit" : "hit");
      },
      gameOver: () => audio.play("gameOver"),
      levelUp: (state) => {
        juice.addLevelUpPing(state, state.player);
        audio.play("levelUp");
      },
      lootCollect: (state, loot) => {
        juice.addPickupPing(state, loot);
        audio.play("loot");
      },
      playerHit: (state) => {
        juice.addPlayerHitPing(state, state.player);
        audio.play("playerHit");
      },
      shieldAbsorb: (state) => {
        juice.addPing(state, "shieldPickup", state.player.x, state.player.y);
        audio.play("shield");
      },
      shoot: () => audio.play("shoot"),
      xpCollect: (state, gem) => {
        juice.addXpPing(state, gem);
        audio.play("xp");
      },
    };
  }

  window.GameFeedback = { createGameFeedback };
})();
