import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/de/login')
    await expect(page).toHaveTitle(/Anivise/)
    await expect(page.locator('form')).toBeVisible()
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/de/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('admin panel redirects unauthenticated users', async ({ page }) => {
    await page.goto('/de/admin')
    await expect(page).toHaveURL(/login/)
  })
})
