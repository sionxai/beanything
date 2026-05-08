const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const APP_URL = process.env.APP_URL || "http://127.0.0.1:4177/?v=20260508a";

async function openFreshApp(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto(APP_URL);
}

test("home exposes commercial entry points and QR modal", async ({ page }) => {
  await openFreshApp(page);

  await expect(page).toHaveTitle("Be Anything");
  await expect(page.getByRole("heading", { name: /하고 싶은 일을 이번 달 안에/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "내 경로 만들기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "견디는 결", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "접속 QR", exact: true }).click();
  await expect(page.getByRole("heading", { name: "휴대폰으로 바로 열기" })).toBeVisible();
  await expect(page.locator(".qr-code-svg")).toBeVisible();
  await expect(page.locator(".qr-url-box")).toContainText(new URL(APP_URL).origin);
});

test("painfit quiz shows imagination scene before choices", async ({ page }) => {
  await openFreshApp(page);

  await page.getByRole("button", { name: "견디는 결", exact: true }).click();
  await page.getByRole("button", { name: "진단 시작" }).click();
  await page.locator('button[data-action="painfit-mode"][data-mode="transition"]').click();

  await expect(page.locator(".painfit-question-copy h2")).toContainText("8시간 서 있는 일");
  await expect(page.locator(".painfit-imagine-card")).toContainText("상상 장면");
  await expect(page.locator(".painfit-imagine-card")).toContainText("하루를 보냈다고 떠올려보세요");

  await page.locator('button[data-action="painfit-answer"][data-value="unknown"]').click();
  await expect(page.locator(".painfit-progress-toggle-row")).toContainText("잘 모르겠다 1");
});

test("demo recommendation can start a journey dashboard", async ({ page }) => {
  await openFreshApp(page);

  await page.locator('button[data-action="load-demo"][data-demo="creative"]').click();
  await expect(page.getByRole("heading", { name: /경로를 골랐어요/i })).toBeVisible();

  await page.locator('button[data-action="start-journey"]').first().click();
  await expect(page.getByRole("heading", { name: "오늘의 체크인" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "단계 회고" })).toBeVisible();
});

test("file protocol shows a safe warning instead of a broken app", async ({ page }) => {
  const fileUrl = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;

  await page.goto(fileUrl);
  await expect(page.getByRole("heading", { name: "파일로 직접 열면 앱이 제대로 동작하지 않습니다." })).toBeVisible();
  await expect(page.getByRole("link", { name: "배포 주소로 열기" })).toHaveAttribute("href", /beanything\.vercel\.app/);
});
