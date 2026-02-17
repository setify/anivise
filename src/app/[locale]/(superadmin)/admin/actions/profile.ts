'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { updateProfileSchema } from '@/lib/validations/admin'
import { logAudit } from '@/lib/audit/log'

export async function updateProfile(formData: FormData) {
  const currentUser = await requirePlatformRole('staff')

  const raw = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    displayName: formData.get('displayName') as string,
    phone: formData.get('phone') as string,
    timezone: formData.get('timezone') as string,
    preferredLocale: formData.get('preferredLocale') as string,
  }

  const parsed = updateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const { firstName, lastName, displayName, phone, timezone, preferredLocale } =
    parsed.data

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null

  await db
    .update(users)
    .set({
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: displayName || null,
      fullName,
      phone: phone || null,
      timezone: timezone || null,
      preferredLocale,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'profile.updated',
    entityType: 'user',
    entityId: currentUser.id,
  })

  revalidatePath('/admin/profile')
  return { success: true }
}
