import { expect, test } from "@playwright/test";

test.describe("Veritas Engine console", () => {
  test("loads the orchestration panel and graph", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("orchestration-panel")).toBeVisible();
    await expect(page.getByTestId("graph-visualizer")).toBeVisible();
    await expect(page.getByText("VERITAS ENGINE")).toBeVisible();
    await expect(page.getByTestId("initiate-research")).toBeDisabled();
  });

  test("demo cycle synthesizes a brief and lights the graph", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("demo-mode").click();
    await page.getByTestId("inquiry-input").fill("Next.js edge execution limits");
    await page.getByTestId("initiate-research").click();

    await expect(page.getByTestId("synthesized-brief")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("synthesized-brief")).toContainText(
      "Engineering Architecture Brief"
    );
    await expect(page.getByTestId("graph-visualizer")).toContainText("Synthesis Engine");
    await expect(page.getByTestId("logstream")).toContainText("Planner");
  });

  test("quality audit tab shows the critic score after a run", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("inquiry-input").fill("LangGraph critic loop");
    await page.getByTestId("initiate-research").click();
    await expect(page.getByTestId("synthesized-brief")).toBeVisible({ timeout: 45_000 });

    await page.getByTestId("tab-critic").click();
    await expect(page.getByTestId("quality-score")).toBeVisible();
    await expect(page.getByTestId("quality-score")).toContainText("/10");
  });

  test("theme toggle switches the console off the default dark canvas", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("div.min-h-screen").first();
    await expect(shell).toHaveClass(/bg-slate-950/);
    await page.getByTestId("theme-toggle").click();
    await expect(shell).toHaveClass(/bg-\[#f8fafc\]/);
  });
});
