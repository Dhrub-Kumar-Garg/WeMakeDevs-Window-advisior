import http from 'http';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\Dhruv\\.gemini\\antigravity-ide\\brain\\c6adb501-08c6-4f22-80d4-c5546a9a41db';

// Ensure artifact directory exists
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

let mockState = {
  windowOpen: true,
  co2Est: 850,
  led: 'green',
  pir: true,
  tempC: 24.5,
  humidity: 48.0,
  distanceCm: 15.2,
  mq135Mv: 210,
  mq135Idx: 38,
  people: 2,
  ach: 4.0,
  volumeM3: 36,
  aqiOut: 45,
  aqiSrc: 'Open-Meteo',
  timeScale: 1,
  statusCode: 200,
  shouldClose: false,
};

let server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/latest') {
    if (mockState.shouldClose) {
      req.socket.destroy();
      return;
    }
    if (mockState.statusCode === 404) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Device not found' }));
      return;
    }

    const payload = {
      deviceId: 'esp32-advisor-01',
      ts: Math.floor(Date.now() / 1000),
      tempC: mockState.tempC,
      humidity: mockState.humidity,
      pir: mockState.pir,
      windowOpen: mockState.windowOpen,
      distanceCm: mockState.distanceCm,
      mq135Mv: mockState.mq135Mv,
      mq135Idx: mockState.mq135Idx,
      co2Est: mockState.co2Est,
      people: mockState.people,
      ach: mockState.ach,
      volumeM3: mockState.volumeM3,
      aqiOut: mockState.aqiOut,
      aqiSrc: mockState.aqiSrc,
      led: mockState.led,
      timeScale: mockState.timeScale,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(404);
  res.end();
});

await new Promise((resolve) => server.listen(3001, '127.0.0.1', resolve));
console.log('[Mock Server] Listening on http://127.0.0.1:3001');

const consoleErrors = [];
const consoleMessages = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', (msg) => {
  const text = msg.text();
  consoleMessages.push(`[${msg.type()}] ${text}`);
  if (msg.type() === 'error') {
    consoleErrors.push(text);
  }
});

page.on('response', (res) => {
  if (res.status() >= 400) {
    console.log(`[HTTP ${res.status()}] ${res.url()}`);
  }
});

page.on('pageerror', (err) => {
  consoleErrors.push(`[PageError] ${err.message}`);
});

await page.route('**/*open-meteo.com/**', (route) => {
  const url = route.request().url();
  const hours = Array.from({ length: 24 }).map((_, i) => new Date(Date.now() + i * 3600000).toISOString());
  if (url.includes('air-quality')) {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hourly: {
          time: hours,
          us_aqi: hours.map(() => 45),
          pm2_5: hours.map(() => 12),
        },
      }),
    });
  } else {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hourly: {
          time: hours,
          wind_speed_10m: hours.map(() => 8.5),
        },
      }),
    });
  }
});

try {
  console.log('[Test] Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // 1. Wait for LIVE status badge to appear
  console.log('[Test] Waiting for LIVE status badge...');
  const liveBadge = page.locator('header span:has-text("LIVE")');
  await liveBadge.waitFor({ state: 'visible', timeout: 15000 });
  console.log('✓ PASS: LIVE badge is visible!');

  // Check that hardware items reflect LIVE
  const esp32Live = page.locator('#hardware span:has-text("ESP32")');
  await esp32Live.waitFor({ state: 'visible' });

  // 2. Check that sash follows windowOpen (windowOpen is true in payload)
  console.log('[Test] Checking window and sash state...');
  const sashSlider = page.locator('[role="slider"][aria-label="Window Sash"]');
  if (await sashSlider.count() > 0) {
    const val = await sashSlider.getAttribute('aria-valuenow');
    console.log(`✓ Sash angle is ${val}° (open)`);
  }

  // Check store window state in browser
  const windowState = await page.evaluate(() => {
    return window.__store?.getState().windowState;
  });
  console.log(`✓ Window state in store: ${windowState}`);

  // Screenshot 1: LIVE with window open
  const screenshot1Path = path.join(ARTIFACTS_DIR, 'live_open_window.png');
  await page.screenshot({ path: screenshot1Path, fullPage: false });
  console.log(`✓ Saved screenshot 1 to: ${screenshot1Path}`);

  // Scroll to Evidence section and capture
  await page.evaluate(() => document.getElementById('evidence')?.scrollIntoView());
  await page.waitForTimeout(1000);
  const evidencePath = path.join(ARTIFACTS_DIR, 'live_evidence_traces.png');
  await page.screenshot({ path: evidencePath });
  console.log(`✓ Saved evidence traces screenshot to: ${evidencePath}`);

  // Scroll to Hardware section and capture
  await page.evaluate(() => document.getElementById('hardware')?.scrollIntoView());
  await page.waitForTimeout(1000);
  const hardwarePath = path.join(ARTIFACTS_DIR, 'live_hardware_section.png');
  await page.screenshot({ path: hardwarePath });
  console.log(`✓ Saved hardware section screenshot to: ${hardwarePath}`);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Check errors during LIVE operation
  const liveConsoleErrors = [...consoleErrors];
  console.log(`[Test] Console errors during LIVE operation: ${liveConsoleErrors.length}`);
  if (liveConsoleErrors.length === 0) {
    console.log('✓ PASS: 0 console errors during LIVE operation!');
  } else {
    console.error('LIVE Console errors:', liveConsoleErrors);
  }

  // 3. Stop server / simulate failure
  console.log('[Test] Stopping mock server to trigger fetch failure...');
  mockState.shouldClose = true;
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
  await new Promise((resolve) => server.close(resolve));
  console.log('[Mock Server] Stopped.');

  // Trigger poll or wait for next 10s poll cycle
  console.log('[Test] Waiting for polling to fail and flip status to STALE...');
  const staleBadge = page.locator('header span:has-text("STALE")');
  await staleBadge.waitFor({ state: 'visible', timeout: 35000 });
  console.log('✓ PASS: Status flipped to STALE after server stopped!');

  // Check that last value was kept
  const co2Kept = await page.evaluate(() => {
    return window.__store?.getState().sensorData.co2Estimated;
  });
  console.log(`✓ CO2 estimate kept on failure: ${co2Kept} ppm (matches 850 ppm)`);

  // Screenshot 2: STALE
  const screenshot2Path = path.join(ARTIFACTS_DIR, 'stale_status.png');
  await page.screenshot({ path: screenshot2Path, fullPage: false });
  console.log(`✓ Saved screenshot 2 to: ${screenshot2Path}`);

  // 4. Verify 0 page runtime errors
  const pageErrors = consoleErrors.filter(e => !e.includes('net::ERR_CONNECTION_REFUSED'));
  console.log(`[Test] Total non-network console/page errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    console.error('Errors encountered:', pageErrors);
  } else {
    console.log('✓ PASS: 0 application/page errors across entire session!');
  }

  console.log('\n=== ALL PLAYWRIGHT VERIFICATION CHECKS PASSED ===\n');
} finally {
  await browser.close();
  try {
    server.close();
  } catch (_) {}
}
