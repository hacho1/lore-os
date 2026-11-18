import { test, expect } from "@playwright/test";

test("모바일 서랍은 닫히면 비활성화되고 초점을 순환·복귀한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "세계관 개요", exact: true })).toBeVisible();
  const sidebar = page.locator("#workspace-navigation"), rail = page.locator("#workspace-details");
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(rail).toHaveAttribute("inert", "");
  const opener = page.getByRole("button", { name: "탐색 메뉴 열기", exact: true });
  await opener.click();
  await expect(sidebar).toHaveAttribute("role", "dialog");
  await expect(sidebar.getByRole("button", { name: "탐색 닫기", exact: true })).toBeFocused();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Shift+Tab");
  await expect(sidebar.getByRole("button", { name: "설정", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(sidebar.getByRole("button", { name: "탐색 닫기", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(sidebar).toHaveAttribute("inert", "");
  const panelOpener = page.getByRole("button", { name: "오른쪽 패널 열기·닫기", exact: true });
  await panelOpener.click();
  await expect(rail.getByRole("tab", { name: "상세 정보", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(rail.getByRole("tab", { name: "AI 도우미", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(panelOpener).toBeFocused();
  await expect(rail).toHaveAttribute("inert", "");
  // Reopening the AI tab must skip the inactive details tab (tabIndex=-1).
  await panelOpener.click();
  await expect(rail.getByRole("tab", { name: "AI 도우미", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await rail.evaluate(node => node.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.press("Tab");
  await expect(rail.getByRole("tab", { name: "AI 도우미", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  for (const button of [opener, panelOpener, page.getByRole("button", { name: "새 항목", exact: true })]) {
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("반복·서식 제목의 목차와 문서 탭은 올바른 대상으로 이동한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 세계관 만들기", exact: true }).click();
  await page.getByLabel("세계관 이름", { exact: true }).fill("목차 테스트 세계");
  await page.getByRole("button", { name: "세계관 만들기", exact: true }).click();
  await expect(page.locator(".world-cover h2")).toHaveText("목차 테스트 세계");
  await page.getByRole("button", { name: "문서 작성", exact: true }).click();
  await page.getByLabel("이름", { exact: true }).fill("목차 회귀 검증");
  await page.locator('textarea[name="body"]').fill("## 반복 제목\n\n첫 기록.\n\n## 반복 제목\n\n두 번째 기록.\n\n## **강조된** 제목\n\n마지막 기록.");
  await page.getByRole("button", { name: "저장하기", exact: true }).click();
  await expect(page.getByRole("heading", { name: "목차 회귀 검증", level: 1 })).toBeVisible();
  const headings = page.locator(".markdown h2");
  await expect(headings).toHaveCount(3);
  const ids = await headings.evaluateAll(nodes => nodes.map(node => node.id));
  expect(new Set(ids).size).toBe(3);
  expect(ids.every(Boolean)).toBeTruthy();
  await page.locator(".toc summary").click();
  await page.locator(".toc").getByRole("button", { name: "반복 제목", exact: true }).nth(1).click();
  await expect(headings.nth(1)).toBeFocused();
  await page.locator(".toc").getByRole("button", { name: "강조된 제목", exact: true }).click();
  await expect(headings.nth(2)).toBeFocused();
  await page.getByRole("tab", { name: "본문", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^연결/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "변경 이력", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "본문", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("긴 제목과 빈 세계관은 좁은 화면에서 잘리지 않고 작업을 안내한다", async ({ page }) => {
  await page.route("**/api/workspace*", async route => {
    const response = await route.fetch();
    const data = await response.json();
    data.project = { ...data.project, name: "아주 긴 이름을 가진 세계관의 잊혀지지 않는 기록과 오래된 약속", demo: false };
    data.entities = []; data.proposals = []; data.relations = [];
    await route.fulfill({ response, json: data });
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "첫 문서 작성", exact: true })).toBeVisible();
  await expect(page.getByText("검토할 제안이 없습니다.", { exact: true })).toBeVisible();
  await expect(page.locator(".review-notice")).toHaveCount(0);
  await expect(page.locator(".example-label")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const cover = await page.locator(".world-cover").boundingBox(), title = await page.locator(".world-cover h2").boundingBox();
  expect(title!.x + title!.width).toBeLessThanOrEqual(cover!.x + cover!.width);
});
