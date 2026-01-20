import { test, expect } from "@playwright/test"

test.describe("Home Page", () => {
  test("should display the home page", async ({ page }) => {
    await page.goto("/")

    // Check for main heading
    await expect(page.getByRole("heading", { name: /Zero to Hero/i })).toBeVisible()

    // Check for navigation links
    await expect(page.getByRole("link", { name: /Weeks/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /People/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Badges/i })).toBeVisible()

    // Check for level cards
    await expect(page.getByText("Level 1")).toBeVisible()
    await expect(page.getByText("Level 2")).toBeVisible()
    await expect(page.getByText("Level 3")).toBeVisible()
  })

  test("should navigate to weeks page", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("link", { name: /View Curriculum/i }).click()

    await expect(page).toHaveURL("/weeks")
    await expect(page.getByRole("heading", { name: /Curriculum/i })).toBeVisible()
  })
})

test.describe("Weeks Page", () => {
  test("should display weeks grouped by level", async ({ page }) => {
    await page.goto("/weeks")

    // Check for page title
    await expect(page.getByRole("heading", { name: /Curriculum/i })).toBeVisible()

    // Check for level sections
    await expect(page.getByText("Level 1: Foundation")).toBeVisible()
    await expect(page.getByText("Level 2: Intermediate")).toBeVisible()
    await expect(page.getByText("Level 3: Advanced")).toBeVisible()
  })

  test("should navigate to week detail page", async ({ page }) => {
    await page.goto("/weeks")

    // Click on Week 1
    await page.getByRole("link", { name: /Week 1/i }).first().click()

    await expect(page).toHaveURL("/weeks/1")
  })
})

test.describe("Week Detail Page", () => {
  test("should display week content with tabs", async ({ page }) => {
    await page.goto("/weeks/1")

    // Check for week title
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    // Check for tabs
    await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Pre-work/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Session/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Prompts/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Demos/i })).toBeVisible()
  })

  test("should switch between tabs", async ({ page }) => {
    await page.goto("/weeks/1")

    // Click on Pre-work tab
    await page.getByRole("tab", { name: /Pre-work/i }).click()

    // Verify the tab content changed (tab should be active)
    await expect(page.getByRole("tab", { name: /Pre-work/i })).toHaveAttribute(
      "data-state",
      "active"
    )
  })
})

test.describe("People Page", () => {
  test("should display people directory", async ({ page }) => {
    await page.goto("/people")

    // Check for page title
    await expect(page.getByRole("heading", { name: /People/i })).toBeVisible()
  })
})

test.describe("Badges Page", () => {
  test("should display badges page with tabs", async ({ page }) => {
    await page.goto("/badges")

    // Check for page title
    await expect(page.getByRole("heading", { name: /Badges & Awards/i })).toBeVisible()

    // Check for tabs
    await expect(page.getByRole("tab", { name: /Leaderboard/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /All Badges/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Recent Awards/i })).toBeVisible()
  })
})

test.describe("Search Page", () => {
  test("should display search page", async ({ page }) => {
    await page.goto("/search")

    // Check for page title
    await expect(page.getByRole("heading", { name: /Search/i })).toBeVisible()

    // Check for search input
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible()
  })

  test("should perform search", async ({ page }) => {
    await page.goto("/search")

    // Enter search query
    await page.getByPlaceholder(/Search/i).fill("prompt")
    await page.getByRole("button", { name: /Search/i }).click()

    // URL should update with query
    await expect(page).toHaveURL(/q=prompt/)
  })
})

test.describe("Login Page", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login")

    // Check for page title
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible()

    // Check for Google login button
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible()
  })
})
