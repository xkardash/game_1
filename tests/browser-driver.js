const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findBrowserPath() {
  const browserPath = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!browserPath) throw new Error("No supported Chromium browser found");
  return browserPath;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve(JSON.parse(body)));
    }).on("error", reject);
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDevtools(port) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const pages = await getJson(`http://127.0.0.1:${port}/json`);
      const page = pages.find((item) => item.type === "page" && item.url.includes("index.html"));
      if (page) return page;
    } catch {
      await wait(100);
    }
  }
  throw new Error("Chrome DevTools endpoint did not become ready");
}

async function openGamePage(search = "?test=1") {
  const port = 9400 + Math.floor(Math.random() * 500);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "dalga-test-"));
  const gameUrl = `file:///${path.resolve("index.html").replace(/\\/g, "/")}${search}`;
  const browser = spawn(findBrowserPath(), [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--disable-gpu",
    "--disable-extensions",
    "--force-device-scale-factor=1",
    "--window-size=1280,900",
    "--no-first-run",
    `--user-data-dir=${profileDir}`,
    gameUrl,
  ], { stdio: "ignore" });

  const page = await waitForDevtools(port);
  let nextId = 1;
  const pending = new Map();
  const socket = new WebSocket(page.webSocketDebuggerUrl);

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const resolver = pending.get(message.id);
    if (resolver) {
      pending.delete(message.id);
      resolver(message);
    }
  });

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = nextId;
      nextId += 1;
      pending.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (response.result.exceptionDetails) {
      const details = response.result.exceptionDetails;
      const message = details.exception?.description || details.exception?.value || details.text;
      throw new Error(message);
    }
    return response.result.result.value;
  }

  async function key(code) {
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true }))`);
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }))`);
  }

  async function close() {
    try {
      await send("Browser.close");
    } catch {
      browser.kill();
    }
    socket.close();
    await Promise.race([
      new Promise((resolve) => browser.once("exit", resolve)),
      wait(500).then(() => { if (!browser.killed) browser.kill(); }),
    ]);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        fs.rmSync(profileDir, { recursive: true, force: true });
        break;
      } catch {
        await wait(120);
      }
    }
  }

  await send("Runtime.enable");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await evaluate("Boolean(window.DalgaSavunmasiTest)")) return { close, evaluate, key };
    await wait(80);
  }
  throw new Error("Game test API did not become ready");
}

async function waitUntil(page, expression, timeout = 2600) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await page.evaluate(expression)) return;
    await wait(80);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

module.exports = { openGamePage, wait, waitUntil };
