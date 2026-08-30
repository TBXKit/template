import { expect, test } from "@playwright/test";

// Runs against the fixture Tebex server (test/e2e/fixture-server.mjs):
// store "Fixture Store", categories Ranks (id 1) / Keys (id 2), packages
// VIP Rank (100), MVP Rank (101), Crate Key (200).

test("home page renders the store and its catalog", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Fixture Store" }),
  ).toBeVisible();

  // Category names appear both in the header nav and the catalog grid — scope
  // to <main> so this asserts the catalog section specifically.
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Ranks" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Keys" })).toBeVisible();
  await expect(main.getByText("VIP Rank")).toBeVisible();
});

test("category page lists its packages", async ({ page }) => {
  await page.goto("/category/1");

  await expect(page.getByRole("heading", { name: "Ranks" })).toBeVisible();
  await expect(page.getByText("VIP Rank")).toBeVisible();
  await expect(page.getByText("MVP Rank")).toBeVisible();
});

test("package detail renders with an add-to-basket control", async ({
  page,
}) => {
  await page.goto("/package/100");

  await expect(page.getByRole("heading", { name: "VIP Rank" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to basket" }),
  ).toBeVisible();
});

test("an unknown package id shows the not-found UI", async ({ page }) => {
  await page.goto("/package/999999");

  await expect(
    page.getByRole("heading", { name: "Package not found" }),
  ).toBeVisible();
});

test("the cart shows an empty state before anything is added", async ({
  page,
}) => {
  await page.goto("/cart");

  await expect(
    page.getByRole("heading", { name: "Your basket is empty" }),
  ).toBeVisible();
});

test("adding a package puts it in the basket", async ({ page }) => {
  await page.goto("/package/100");

  await page.getByRole("button", { name: "Add to basket" }).click();

  // The success confirmation is an aria-live="polite" region — assert on the
  // accessible text, the way a screen-reader user would perceive it.
  await expect(page.getByText("Added to your basket.")).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("VIP Rank")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your basket is empty" }),
  ).toHaveCount(0);
});
