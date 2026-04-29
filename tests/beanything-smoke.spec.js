const { test, expect } = require("playwright/test");

test("demo flow reaches dashboard", async ({ page }) => {
  const appUrl = process.env.APP_URL || "http://127.0.0.1:4177/?v=20260424aa";

  await page.goto(appUrl);
  await page.getByRole("button", { name: "창작형" }).click();
  await expect(page.getByRole("heading", { name: /경로를 골랐어요/i })).toBeVisible();
  await page.getByRole("button", { name: "이 경로 시작" }).first().click();
  await expect(page.getByRole("heading", { name: "오늘의 체크인" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "단계 회고" })).toBeVisible();
});
