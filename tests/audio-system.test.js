const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadAudioSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/audio-system.js", "utf8"), context, { filename: "src/audio-system.js" });
  return context.AudioSystem;
}

function createStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
  };
}

class FakeAudioParam {
  constructor() {
    this.value = 0;
    this.values = [];
  }

  setValueAtTime(value, time) {
    this.value = value;
    this.values.push({ method: "set", time, value });
  }

  exponentialRampToValueAtTime(value, time) {
    this.value = value;
    this.values.push({ method: "ramp", time, value });
  }
}

class FakeAudioNode {
  connect(target) {
    this.target = target;
  }
}

class FakeOscillator extends FakeAudioNode {
  constructor(context) {
    super();
    this.context = context;
    this.frequency = new FakeAudioParam();
    this.type = "";
  }

  start(time) {
    this.context.starts.push(time);
  }

  stop(time) {
    this.context.stops.push(time);
  }
}

class FakeGain extends FakeAudioNode {
  constructor(context) {
    super();
    this.gain = new FakeAudioParam();
    context.gains.push(this);
  }
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 2;
    this.destination = {};
    this.gains = [];
    this.starts = [];
    this.stops = [];
    this.oscillators = [];
    this.state = "suspended";
  }

  createOscillator() {
    const oscillator = new FakeOscillator(this);
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return new FakeGain(this);
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }
}

test("audio settings clamp and persist mute and volume", () => {
  const AudioSystem = loadAudioSystem();
  const storage = createStorage({ "dalga.audio.muted": "1", "dalga.audio.volume": "0.8" });
  const audio = AudioSystem.createAudioSystem({ storage, audioContextFactory: () => new FakeAudioContext() });

  assert.equal(audio.getSettings().muted, true);
  assert.equal(audio.getSettings().volume, 0.8);
  assert.equal(audio.setMuted(false), false);
  assert.equal(storage.data["dalga.audio.muted"], "0");
  assert.equal(audio.setVolume(1.4), 1);
  assert.equal(storage.data["dalga.audio.volume"], "1");
});

test("muted playback does not create an audio context", () => {
  const AudioSystem = loadAudioSystem();
  const storage = createStorage();
  let createdContexts = 0;
  const audio = AudioSystem.createAudioSystem({
    storage,
    audioContextFactory: () => {
      createdContexts += 1;
      return new FakeAudioContext();
    },
  });

  audio.setMuted(true);

  assert.equal(audio.play("shoot"), false);
  assert.equal(createdContexts, 0);
});

test("play schedules generated oscillator audio and rate limits repeated events", () => {
  const AudioSystem = loadAudioSystem();
  const context = new FakeAudioContext();
  const audio = AudioSystem.createAudioSystem({
    storage: createStorage(),
    audioContextFactory: () => context,
  });

  audio.setVolume(0.5);

  assert.equal(audio.play("shoot"), true);
  assert.equal(context.starts.length, 1);
  assert.equal(context.stops.length, 1);
  assert.ok(context.stops[0] > context.starts[0]);
  assert.ok(context.oscillators[0].frequency.values[0].value > 100);
  assert.ok(context.gains[0].gain.values[0].value <= 0.5);
  assert.equal(audio.play("shoot"), false);
});
