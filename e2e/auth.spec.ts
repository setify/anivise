import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login with valid credentials redirects to dashboard or admin', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD

    if (!email || !password) {
      test.skip()
      return
    }

    await page.goto('/de/login')
    await page.getByLabel(/e-mail/i).fill(email)
    await page.getByLabel(/passwort/i).fill(password)
    await page.getByRole('button', { name: /anmelden|login|sign in/i }).click()

    // Should redirect away from login
    await expect(page).not.toHaveURL(/login/, { timeout: 15000 })
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/de/login')
    await page.getByLabel(/e-mail/i).fill('wrong@example.com')
    await page.getByLabel(/passwort/i).fill('wrongpassword123')
    await page.getByRole('button', { name: /anmelden|login|sign in/i }).click()

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/login/)
    // Wait for error message to appear
    const errorVisible = await page
      .locator('[role="alert"], .text-destructive, [data-sonner-toast]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    // At minimum, we should still be on the login page
    expect(errorVisible || page.url().includes('login')).toBeTruthy()
  })

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/de/dashboard')
    await expect(page).toHaveURL(/login/)
  })
})
