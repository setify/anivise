import { test as setup, expect } from '@playwright/test'

const ADMIN_FILE = 'e2e/.auth/admin.json'

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in environment variables'
    )
  }

  await page.goto('/de/login')
  await page.getByLabel(/e-mail/i).fill(email)
  await page.getByLabel(/passwort/i).fill(password)
  await page.getByRole('button', { name: /anmelden|login|sign in/i }).click()

  // Wait for redirect away from login page
  await expect(page).not.toHaveURL(/login/, { timeout: 15000 })

  await page.context().storageState({ path: ADMIN_FILE })
})
