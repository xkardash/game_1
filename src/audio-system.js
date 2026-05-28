(() => {
  const STORAGE_KEYS = {
    muted: "dalga.audio.muted",
    volume: "dalga.audio.volume",
  };
  const EVENT_PRESETS = {
    bossHit: { frequency: 140, endFrequency: 82, duration: 0.14, gain: 0.1, minGap: 0.08, type: "sawtooth" },
    bossVolley: { frequency: 92, endFrequency: 58, duration: 0.22, gain: 0.13, minGap: 0.32, type: "sawtooth" },
    elite: { frequency: 520, endFrequency: 760, duration: 0.18, gain: 0.09, minGap: 0.26, type: "triangle" },
    gameOver: { frequency: 220, endFrequency: 70, duration: 0.42, gain: 0.12, minGap: 0.5, type: "sawtooth" },
    hit: { frequency: 210, endFrequency: 118, duration: 0.08, gain: 0.08, minGap: 0.035, type: "square" },
    levelUp: { frequency: 520, endFrequency: 980, duration: 0.24, gain: 0.11, minGap: 0.35, type: "triangle" },
    loot: { frequency: 760, endFrequency: 1120, duration: 0.12, gain: 0.08, minGap: 0.08, type: "triangle" },
    playerHit: { frequency: 150, endFrequency: 70, duration: 0.2, gain: 0.12, minGap: 0.28, type: "sawtooth" },
    shield: { frequency: 430, endFrequency: 310, duration: 0.16, gain: 0.08, minGap: 0.18, type: "sine" },
    shoot: { frequency: 620, endFrequency: 360, duration: 0.045, gain: 0.045, minGap: 0.045, type: "square" },
    xp: { frequency: 660, endFrequency: 820, duration: 0.08, gain: 0.045, minGap: 0.045, type: "triangle" },
  };

  function createAudioSystem(options = {}) {
    const storage = options.storage || getStorage();
    const audioContextFactory = options.audioContextFactory || getAudioContextFactory();
    const lastPlayed = {};
    let audioContext = null;
    let muted = readMuted(storage);
    let volume = readVolume(storage);

    function ensureContext() {
      if (audioContext || !audioContextFactory) return audioContext;
      try {
        audioContext = audioContextFactory();
      } catch (error) {
        audioContext = null;
      }
      return audioContext;
    }

    function unlock() {
      const context = ensureContext();
      if (!context || typeof context.resume !== "function") return Promise.resolve(false);
      return context.resume().then(() => true, () => false);
    }

    function play(eventName) {
      const preset = EVENT_PRESETS[eventName];
      if (!preset || muted) return false;
      const context = ensureContext();
      if (!context || typeof context.createOscillator !== "function" || typeof context.createGain !== "function") return false;
      const now = Number(context.currentTime) || 0;
      if (lastPlayed[eventName] !== undefined && now - lastPlayed[eventName] < preset.minGap) return false;
      lastPlayed[eventName] = now;
      resumeContext(context);
      scheduleTone(context, preset, now, volume);
      return true;
    }

    function setMuted(isMuted) {
      muted = Boolean(isMuted);
      writeStorage(storage, STORAGE_KEYS.muted, muted ? "1" : "0");
      return muted;
    }

    function toggleMuted() {
      return setMuted(!muted);
    }

    function setVolume(nextVolume) {
      volume = clamp(Number(nextVolume), 0, 1);
      writeStorage(storage, STORAGE_KEYS.volume, String(volume));
      return volume;
    }

    function getSettings() {
      return { muted, volume };
    }

    return { getEventNames, getSettings, play, setMuted, setVolume, toggleMuted, unlock };
  }

  function scheduleTone(context, preset, startTime, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = preset.type;
    setParam(oscillator.frequency, preset.frequency, startTime);
    rampParam(oscillator.frequency, preset.endFrequency, startTime + preset.duration);
    setParam(gain.gain, Math.max(0.0001, preset.gain * volume), startTime);
    rampParam(gain.gain, 0.0001, startTime + preset.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + preset.duration);
  }

  function resumeContext(context) {
    if (context.state !== "suspended" || typeof context.resume !== "function") return;
    const result = context.resume();
    if (result && typeof result.catch === "function") result.catch(() => {});
  }

  function setParam(param, value, time) {
    if (typeof param.setValueAtTime === "function") param.setValueAtTime(value, time);
    else param.value = value;
  }

  function rampParam(param, value, time) {
    if (typeof param.exponentialRampToValueAtTime === "function") param.exponentialRampToValueAtTime(value, time);
    else param.value = value;
  }

  function getEventNames() {
    return Object.keys(EVENT_PRESETS);
  }

  function readMuted(storage) {
    return readStorage(storage, STORAGE_KEYS.muted) === "1";
  }

  function readVolume(storage) {
    const stored = Number(readStorage(storage, STORAGE_KEYS.volume));
    return Number.isFinite(stored) ? clamp(stored, 0, 1) : 0.55;
  }

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function readStorage(storage, key) {
    try {
      return storage ? storage.getItem(key) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      if (storage) storage.setItem(key, value);
    } catch (error) {
      return false;
    }
    return true;
  }

  function getAudioContextFactory() {
    const ContextClass = window.AudioContext || window.webkitAudioContext;
    return ContextClass ? () => new ContextClass() : null;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  window.AudioSystem = { createAudioSystem };
})();
