import { test, expect } from '@playwright/test'

test.describe('Admin: Organizations', () => {
  test('organization list loads with table', async ({ page }) => {
    await page.goto('/de/admin/organizations')

    // Should see the organizations page heading
    await expect(
      page.getByRole('heading', { name: /organisationen/i })
    ).toBeVisible({ timeout: 10000 })

    // Table or list container should be visible
    const tableVisible = await page
      .locator('table, [role="table"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    const listVisible = await page
      .locator('[data-testid="org-list"], .org-list')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    expect(tableVisible || listVisible).toBeTruthy()
  })

  test('organization detail page shows tabs', async ({ page }) => {
    await page.goto('/de/admin/organizations')

    // Click on the first organization link/row
    const firstOrgLink = page.locator('table tbody tr a, table tbody tr').first()
    await firstOrgLink.click()

    // Wait for navigation to detail page
    await expect(page).toHaveURL(/admin\/organizations\/[a-f0-9-]+/, {
      timeout: 10000,
    })

    // Check for tab navigation elements
    const tabs = page.locator('[role="tablist"], [data-tabs]')
    await expect(tabs.first()).toBeVisible({ timeout: 5000 })
  })

  test('organization detail tabs are navigable', async ({ page }) => {
    await page.goto('/de/admin/organizations')

    // Click first org
    const firstOrgLink = page.locator('table tbody tr a, table tbody tr').first()
    await firstOrgLink.click()

    await expect(page).toHaveURL(/admin\/organizations\/[a-f0-9-]+/, {
      timeout: 10000,
    })

    // Look for tab triggers and try clicking through them
    const tabTriggers = page.locator('[role="tab"]')
    const tabCount = await tabTriggers.count()

    // We should have at least 2 tabs (Details + another)
    expect(tabCount).toBeGreaterThanOrEqual(2)

    // Click each tab and verify it becomes selected
    for (let i = 0; i < Math.min(tabCount, 5); i++) {
      await tabTriggers.nth(i).click()
      await expect(tabTriggers.nth(i)).toHaveAttribute('data-state', 'active', {
        timeout: 3000,
      })
    }
  })
})
