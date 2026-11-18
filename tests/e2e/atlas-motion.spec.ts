import { test, expect } from "@playwright/test";

test("아틀라스는 실제 계보와 방향이 있는 관계를 보여주고 기록을 연다", async ({ page, request }) => {
  const data = await (await request.get("/api/workspace")).json();
  await page.goto("/");
  await expect(page.locator(".world-cover h2")).toHaveText(data.project.name);
  await expect(page.getByRole("button", { name: "오른쪽 패널 열기·닫기" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".atlas-node")).toHaveCount(3);
  await expect(page.locator(".atlas-heading")).toContainText("4개 중 3개");
  await expect(page.locator(".atlas-footer")).toContainText(data.relations.length + "개의 관계");
  const incoming = page.locator(".atlas-node").filter({ hasText: "노엘" });
  await incoming.focus();
  await expect(page.locator(".atlas-description")).toHaveText("노엘 → 시온: 동행한다");
  await expect(incoming).toHaveAccessibleName("노엘 → 시온: 동행한다. 노엘 기록 열기");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "노엘", level: 1 })).toBeVisible();
  await page.getByRole("navigation").getByRole("button", { name: "세계관 개요", exact: true }).click();
  await expect(page.getByRole("heading", { name: "세계관 개요", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "시온 원본 기록 열기", exact: true }).click();
  await expect(page.getByRole("heading", { name: "시온", level: 1 })).toBeVisible();
  expect(page.url()).toContain("original-sion");
});

test("모바일 관계 미리보기는 명시적으로 펼치고 키보드로 사용할 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "시온의 연결 살펴보기", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".atlas-body")).toBeHidden();
  await toggle.focus(); await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".atlas-node").first()).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(".atlas-anchor")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".atlas-node").first()).toBeFocused();
  await expect(page.locator(".atlas-description")).toHaveText("시온 → 잔등회: 소속이다");
  const clearance = await page.locator(".atlas-map").evaluate(map => {
    const edge = map.querySelector<SVGPathElement>(".atlas-edge")!;
    const start = edge.getPointAtLength(0).matrixTransform(edge.getScreenCTM()!);
    return start.x - map.querySelector(".atlas-anchor-mark")!.getBoundingClientRect().right;
  });
  expect(clearance).toBeGreaterThanOrEqual(2);
  expect(clearance).toBeLessThanOrEqual(6);
  await toggle.click();
  await expect(page.locator(".atlas-body")).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("긴 관계명은 이웃 노드를 덮지 않고 초점 설명에서 전문을 보여준다", async ({ page }) => {
  const label = "오래된 약속과 잊힌 기록을 바탕으로 이 세계의 여러 인물과 함께 동행하는 관계입니다. ".repeat(3);
  await page.route("**/api/workspace*", async route => {
    const response = await route.fetch(); const data = await response.json();
    data.relations = data.relations.map((r: { label: string }) => ({ ...r, label }));
    await route.fulfill({ response, json: data });
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await page.locator(".atlas-expand").click();
  const nodes = page.locator(".atlas-node");
  const boxes = await nodes.evaluateAll(elements => elements.map(node => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom })));
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThan(boxes[i-1].bottom);
  await nodes.first().focus();
  await expect(page.locator(".atlas-description")).toContainText(label.trim());
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("모션 도중 패널을 반복해서 닫아도 초점과 비활성 상태가 즉시 복귀한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "탐색 메뉴 열기", exact: true });
  const sidebar = page.locator("#workspace-navigation");
  for (let i = 0; i < 10; i++) {
    await menu.click();
    await expect(sidebar).not.toHaveAttribute("inert");
    await page.keyboard.press("Escape");
    await expect(sidebar).toHaveAttribute("inert", "");
    await expect(menu).toBeFocused();
  }
  const panel = page.getByRole("button", { name: "오른쪽 패널 열기·닫기", exact: true });
  await panel.click(); await page.keyboard.press("Escape"); await panel.click();
  await expect(page.locator("#workspace-details")).not.toHaveAttribute("inert");
  await expect(page.getByRole("tab", { name: "상세 정보", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert");
});

test("모션 감소 설정은 진행 중 화면 전환도 중단하며 입력 중 다시 시작하지 않는다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".recent-row").first()).toBeVisible();
  // Observe the actual navigation animation without waiting for locator stability.
  await page.locator(".recent-row").first().evaluate((node: HTMLButtonElement) => node.click());
  await page.waitForFunction(() => document.querySelector(".main-canvas")!.getAnimations().some(a => a.playState === "running"), { }, { polling: "raf" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.locator("main").evaluate(node => node.getAnimations().filter(a => a.playState === "running").length)).toBe(0);
  await page.getByRole("navigation").getByRole("button", { name: "세계관 개요", exact: true }).click();
  await page.getByRole("button", { name: "문서 작성", exact: true }).click();
  await page.getByLabel("이름", { exact: true }).fill("한글 입력 모션 확인");
  await expect(page.getByLabel("이름", { exact: true })).toBeFocused();
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue("한글 입력 모션 확인");
  expect(await page.locator("main").evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
});
