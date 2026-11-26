import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).hostname !== "127.0.0.1" ||
  new URL(url).pathname !== "/vault_test"
)
  throw new Error("Browser tests require the isolated vault_test database");
const db = new PrismaClient({ datasources: { db: { url } } });
const token = "browser-test-session-token";

test.beforeAll(async () => {
  const user = await db.user.upsert({
    where: { email: "browser-test@example.invalid" },
    update: {},
    create: { name: "Browser Test", email: "browser-test@example.invalid" },
  });
  await db.session.upsert({
    where: { sessionToken: token },
    update: { userId: user.id, expires: new Date("2099-01-01") },
    create: {
      sessionToken: token,
      userId: user.id,
      expires: new Date("2099-01-01"),
    },
  });
});
test.afterAll(async () => {
  await db.$disconnect();
});
test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      url: "http://127.0.0.1:3449",
    },
  ]);
  await page.addInitScript(() =>
    sessionStorage.setItem("vaultEntryGateSeen", "1"),
  );
});

test("creates a transaction through the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Open menu.*Add/i }).click();
  await page.getByRole("menuitem", { name: /Add expense/i }).click();
  const dialog = page.getByRole("dialog", { name: "Add expense" });
  await dialog.getByLabel("Amount").fill("42.50");
  await dialog.getByLabel("Description").fill("Browser test lunch");
  await dialog.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Housing" }).click();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Browser test lunch").first()).toBeVisible();
});

test("creates and edits a reserve by clicking its card", async ({ page }) => {
  await page.goto("/dashboard/reserves");
  await page.getByRole("button", { name: "Add reserve" }).first().click();
  let dialog = page.getByRole("dialog", { name: "Add reserve" });
  await dialog.getByLabel("Name", { exact: true }).fill("Browser reserve");
  await dialog.getByLabel("Reserved amount").fill("125.50");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Edit Browser reserve" }).click();
  dialog = page.getByRole("dialog", { name: "Edit reserve" });
  await dialog.getByLabel("Reserved amount").focus();
  await dialog.getByLabel("Reserved amount").fill("250.00");
  await expect(dialog.getByLabel("Reserved amount")).toHaveValue("250.00");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("250", { exact: false }).first()).toBeVisible();
});

test("persists FIRE scenario inputs after refresh", async ({ page }) => {
  await page.goto("/dashboard/fire");
  await page.getByLabel("Scenario name").fill("Browser FIRE plan");
  await page.getByLabel("Current age").fill("35");
  await page.getByLabel("Invested capital").fill("50000");
  await page.reload();
  await expect(page.getByLabel("Scenario name")).toHaveValue(
    "Browser FIRE plan",
  );
  await expect(page.getByLabel("Current age")).toHaveValue("35");
  await expect(page.getByLabel("Invested capital")).toHaveValue("50,000.00");
});
