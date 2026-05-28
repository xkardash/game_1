(() => {
  function createAudioUi(audio) {
    const button = document.querySelector("#audioButton");
    const slider = document.querySelector("#volumeSlider");

    function sync() {
      const settings = audio.getSettings();
      button.textContent = settings.muted ? "Ses Kapali" : "Ses Acik";
      button.setAttribute("aria-label", settings.muted ? "Sesi ac" : "Sesi kapat");
      slider.value = String(settings.volume);
    }

    button.addEventListener("click", () => {
      audio.toggleMuted();
      audio.unlock();
      sync();
    });
    slider.addEventListener("input", () => {
      audio.setMuted(false);
      audio.setVolume(Number(slider.value));
      audio.unlock();
      sync();
    });
    sync();

    return { button, slider, sync };
  }

  window.AudioUi = { createAudioUi };
})();
