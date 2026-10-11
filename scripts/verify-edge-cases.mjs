import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Dhruv\\.gemini\\antigravity-ide\\brain\\c6adb501-08c6-4f22-80d4-c5546a9a41db';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  // Test 1: ?demo=1 mode
  console.log('[Test] Navigating to http://localhost:3000/?demo=1...');
  await page.goto('http://localhost:3000/?demo=1', { waitUntil: 'domcontentloaded' });
  const demoBadge = page.locator('header span:has-text("DEMO")');
  await demoBadge.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ PASS: DEMO badge appears with ?demo=1');

  const demoPath = path.join(ARTIFACTS_DIR, 'demo_mode_badge.png');
  await page.screenshot({ path: demoPath, fullPage: false });
  console.log(`✓ Saved screenshot to: ${demoPath}`);

  console.log('\n=== ALL EDGE CASES PASSED ===\n');
} finally {
  await browser.close();
}
