import puppeteer, { Browser, Page } from "puppeteer";

const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://localhost:3001";

interface ConsoleLog {
  type: string;
  text: string;
  timestamp: string;
}

const consoleLogs: ConsoleLog[] = [];
const networkErrors: string[] = [];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Capture console logs
  page.on("console", (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
    });
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
    consoleLogs.push({
      type: "error",
      text: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  // Capture network failures
  page.on("requestfailed", (request) => {
    const failure = `${request.url()} - ${request.failure()?.errorText}`;
    networkErrors.push(failure);
    console.log(`[NETWORK FAILED] ${failure}`);
  });

  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  return page;
}

async function testHealthCheck(): Promise<boolean> {
  console.log("\n=== Testing Backend Health Check ===");
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    console.log(`Backend health: ${JSON.stringify(data)}`);
    return data.status === "ok";
  } catch (error) {
    console.log(`Backend health check failed: ${error}`);
    return false;
  }
}

async function testHomePage(page: Page): Promise<void> {
  console.log("\n=== Testing Home Page ===");

  await page.goto(FRONTEND_URL, { waitUntil: "networkidle0" });
  await page.screenshot({ path: "/tmp/test-screenshots/01-homepage.png" });

  // Check page title and content
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Check for Brief header
  const headerText = await page.$eval("header h1", (el) => el.textContent);
  console.log(`Header text: ${headerText}`);

  // Check for hero section
  const heroText = await page.$eval("h2", (el) => el.textContent);
  console.log(`Hero text: ${heroText}`);

  // Check for CTA buttons
  const voiceButton = await page.$('a[href="/checkin"]');
  const textButton = await page.$('a[href="/checkin/text"]');
  console.log(`Voice Update button present: ${!!voiceButton}`);
  console.log(`Text Update button present: ${!!textButton}`);

  // Check for feature cards
  const featureCards = await page.$$(".rounded-xl.border");
  console.log(`Feature cards count: ${featureCards.length}`);
}

async function testVoiceCheckinFlow(page: Page): Promise<void> {
  console.log("\n=== Testing Voice Check-in Flow ===");

  // Navigate to voice checkin
  await page.goto(`${FRONTEND_URL}/checkin`, { waitUntil: "networkidle0" });
  await delay(500);
  await page.screenshot({ path: "/tmp/test-screenshots/02-voice-checkin-start.png" });

  // Check question 1 is displayed
  const question1 = await page.$eval("h2", (el) => el.textContent);
  console.log(`First question: ${question1}`);

  // Check progress bar
  const progressBar = await page.$(".h-1.bg-muted");
  console.log(`Progress bar present: ${!!progressBar}`);

  // Check step indicators
  const stepIndicators = await page.$$(".h-2.w-2.rounded-full");
  console.log(`Step indicators count: ${stepIndicators.length}`);

  // Check mic button
  const micButton = await page.$("button.rounded-full");
  console.log(`Mic button present: ${!!micButton}`);

  // Check keyboard hint
  const keyboardHint = await page.$("kbd");
  console.log(`Keyboard hint present: ${!!keyboardHint}`);

  // Check exit link
  const exitLink = await page.$('a[href="/"]');
  console.log(`Exit link present: ${!!exitLink}`);

  // Test clicking mic button (will fail without real mic, but we can see the state change)
  console.log("Testing mic button click...");
  await micButton?.click();
  await delay(100);
  await page.screenshot({ path: "/tmp/test-screenshots/03-voice-recording-state.png" });

  // Check if recording state is shown
  const recordingText = await page.$eval("button.rounded-full + p", (el) => el.textContent);
  console.log(`Recording state text: ${recordingText}`);
}

async function testTextCheckinFlow(page: Page): Promise<void> {
  console.log("\n=== Testing Text Check-in Flow ===");

  // Navigate to text checkin
  await page.goto(`${FRONTEND_URL}/checkin/text`, { waitUntil: "networkidle0" });
  await delay(500);
  await page.screenshot({ path: "/tmp/test-screenshots/04-text-checkin-start.png" });

  // Check if text input page loads
  const pageContent = await page.content();
  console.log(`Text checkin page loaded: ${pageContent.includes("checkin")}`);

  // Look for textarea or text input elements
  const textarea = await page.$("textarea");
  const textInput = await page.$('input[type="text"]');
  console.log(`Textarea present: ${!!textarea}`);
  console.log(`Text input present: ${!!textInput}`);
}

async function testNavigationBetweenPages(page: Page): Promise<void> {
  console.log("\n=== Testing Navigation ===");

  // Start from home
  await page.goto(FRONTEND_URL, { waitUntil: "networkidle0" });

  // Click Voice Update
  console.log("Navigating to Voice Update...");
  await page.click('a[href="/checkin"]');
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log(`Current URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/test-screenshots/05-nav-to-voice.png" });

  // Go back to home via Exit
  console.log("Navigating back to home...");
  await page.click('a[href="/"]');
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log(`Current URL: ${page.url()}`);

  // Click Text Update
  console.log("Navigating to Text Update...");
  await page.click('a[href="/checkin/text"]');
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log(`Current URL: ${page.url()}`);
  await page.screenshot({ path: "/tmp/test-screenshots/06-nav-to-text.png" });
}

async function testReportGenerationAPI(): Promise<void> {
  console.log("\n=== Testing Report Generation API ===");

  const testResponses = {
    work_done: "I worked on implementing the authentication module and fixing some bugs in the dashboard.",
    progress: "About 70%",
    on_track: "Yes, should be done by Friday",
    blockers: "Waiting on API documentation from the backend team",
    next_week: "Will focus on testing and code review",
    other: "Nothing else to add",
  };

  try {
    const response = await fetch(`${BACKEND_URL}/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses: testResponses }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log(`Report generation failed: ${JSON.stringify(error)}`);
      return;
    }

    const report = await response.json();
    console.log("Generated report:");
    console.log(`  Summary: ${report.summary}`);
    console.log(`  Progress: ${report.progress}%`);
    console.log(`  Status: ${report.status}`);
    console.log(`  This week items: ${report.thisWeek?.length || 0}`);
    console.log(`  Blockers: ${report.blockers?.length || 0}`);
    console.log(`  Next week items: ${report.nextWeek?.length || 0}`);
  } catch (error) {
    console.log(`Report generation API error: ${error}`);
  }
}

async function testResponsiveDesign(page: Page): Promise<void> {
  console.log("\n=== Testing Responsive Design ===");

  const viewports = [
    { width: 375, height: 667, name: "mobile" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 1920, height: 1080, name: "desktop" },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle0" });
    await delay(300);
    await page.screenshot({ path: `/tmp/test-screenshots/07-responsive-${vp.name}.png` });
    console.log(`Screenshot taken for ${vp.name} (${vp.width}x${vp.height})`);
  }

  // Reset viewport
  await page.setViewport({ width: 1280, height: 800 });
}

async function testKeyboardAccessibility(page: Page): Promise<void> {
  console.log("\n=== Testing Keyboard Accessibility ===");

  await page.goto(`${FRONTEND_URL}/checkin`, { waitUntil: "networkidle0" });
  await delay(500);

  // Test spacebar to start recording
  console.log("Testing spacebar to start recording...");
  await page.keyboard.press("Space");
  await delay(200);
  await page.screenshot({ path: "/tmp/test-screenshots/08-spacebar-recording.png" });

  const statusText = await page.$eval("button.rounded-full + p", (el) => el.textContent);
  console.log(`Status after spacebar: ${statusText}`);
}

async function testDarkModeStyles(page: Page): Promise<void> {
  console.log("\n=== Testing Dark Mode Styles ===");

  await page.goto(FRONTEND_URL, { waitUntil: "networkidle0" });

  // Add dark class to html element
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });

  await delay(300);
  await page.screenshot({ path: "/tmp/test-screenshots/09-dark-mode.png" });
  console.log("Dark mode screenshot taken");

  // Remove dark class
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
  });
}

async function runAllTests(): Promise<void> {
  console.log("Starting comprehensive Puppeteer tests...\n");

  // Create screenshots directory
  const { mkdir } = await import("fs/promises");
  await mkdir("/tmp/test-screenshots", { recursive: true });

  // Check backend health first
  const backendHealthy = await testHealthCheck();
  if (!backendHealthy) {
    console.log("\n⚠️  Backend is not running. Some tests will fail.");
    console.log("Start the backend with: OPENAI_API_KEY=... pnpm dev:backend\n");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await setupPage(browser);

    // Run all tests
    await testHomePage(page);
    await testVoiceCheckinFlow(page);
    await testTextCheckinFlow(page);
    await testNavigationBetweenPages(page);
    await testResponsiveDesign(page);
    await testKeyboardAccessibility(page);
    await testDarkModeStyles(page);

    if (backendHealthy) {
      await testReportGenerationAPI();
    }

    // Summary
    console.log("\n=== Test Summary ===");
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Console errors: ${consoleLogs.filter((l) => l.type === "error").length}`);
    console.log(`Console warnings: ${consoleLogs.filter((l) => l.type === "warning").length}`);
    console.log(`Network errors: ${networkErrors.length}`);

    if (consoleLogs.filter((l) => l.type === "error").length > 0) {
      console.log("\n=== Console Errors ===");
      consoleLogs
        .filter((l) => l.type === "error")
        .forEach((l) => console.log(`  - ${l.text}`));
    }

    if (networkErrors.length > 0) {
      console.log("\n=== Network Errors ===");
      networkErrors.forEach((e) => console.log(`  - ${e}`));
    }

    console.log("\n✅ Screenshots saved to /tmp/test-screenshots/");

  } finally {
    await browser.close();
  }
}

runAllTests().catch(console.error);
