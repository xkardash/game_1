const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadDraw() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/draw.js", "utf8"), context, { filename: "src/draw.js" });
  return context.ShooterDraw;
}

function createRecordingContext() {
  const trace = [];
  return {
    trace,
    set fillStyle(value) { trace.push(`fill:${value}`); },
    get fillStyle() { return ""; },
    set globalAlpha(value) { trace.push(`alpha:${Number(value).toFixed(2)}`); },
    get globalAlpha() { return 1; },
    set lineWidth(value) { trace.push(`width:${value}`); },
    get lineWidth() { return 1; },
    set strokeStyle(value) { trace.push(`stroke:${value}`); },
    get strokeStyle() { return ""; },
    arc(x, y, radius) { trace.push(`arc:${Math.round(x)},${Math.round(y)},${Math.round(radius)}`); },
    beginPath() { trace.push("begin"); },
    closePath() { trace.push("close"); },
    ellipse(x, y, radiusX, radiusY) { trace.push(`ellipse:${Math.round(x)},${Math.round(y)},${Math.round(radiusX)},${Math.round(radiusY)}`); },
    fill() { trace.push("paint"); },
    fillRect(x, y, width, height) { trace.push(`rect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    rotate(value) { trace.push(`rotate:${Number(value).toFixed(2)}`); },
    save() { trace.push("save"); },
    stroke() { trace.push("strokePaint"); },
    translate(x, y) { trace.push(`translate:${Math.round(x)},${Math.round(y)}`); },
  };
}

test("meteor renderer uses asteroid mass and debris instead of a torch trail", () => {
  const ShooterDraw = loadDraw();
  const context = createRecordingContext();

  assert.equal(typeof ShooterDraw.drawMeteorHazard, "function");
  ShooterDraw.drawMeteorHazard(context, {
    color: "#f0a040",
    height: 24,
    life: 3.4,
    trailColor: "#f2dfb6",
    vx: -80,
    vy: 360,
    width: 24,
    x: 180,
    y: 120,
  });

  const trace = context.trace.join("|");
  assert.match(trace, /ellipse:/);
  assert.match(trace, /fill:#5a2f22/);
  assert.ok(context.trace.filter((entry) => entry.startsWith("line:")).length >= 6);
  assert.equal(trace.includes("rect:-5,-42,10,38"), false);
});
