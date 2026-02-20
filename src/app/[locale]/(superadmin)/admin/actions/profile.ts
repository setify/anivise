'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { updateProfileSchema } from '@/lib/validations/admin'
import { logAudit } from '@/lib/audit/log'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildStoragePath, MEDIA_BUCKET } from '@/lib/media/storage-paths'
import { trackUpload } from '@/lib/media/track-upload'

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

export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const currentUser = await requirePlatformRole('staff')

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) {
    return { success: false, error: 'No file provided' }
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Only PNG, JPG and WebP allowed' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Max 2 MB' }
  }

  const supabase = createAdminClient()

  // Delete old avatar if exists
  if (currentUser.avatarStoragePath) {
    await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([currentUser.avatarStoragePath])
  }

  const storagePath = buildStoragePath('user_avatar', file.name, currentUser.id)

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(storagePath)

  // Track in media_files
  await trackUpload({
    bucket: MEDIA_BUCKET,
    path: storagePath,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    context: 'user_avatar',
    contextEntityId: currentUser.id,
    uploadedBy: currentUser.id,
  })

  // Update user record
  await db
    .update(users)
    .set({
      avatarUrl: urlData.publicUrl,
      avatarStoragePath: storagePath,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'profile.updated',
    entityType: 'user',
    entityId: currentUser.id,
    metadata: { field: 'avatar' },
  })

  revalidatePath('/admin/profile')
  return { success: true, avatarUrl: urlData.publicUrl }
}

export async function removeAvatar(): Promise<{
  success: boolean
  error?: string
}> {
  const currentUser = await requirePlatformRole('staff')

  if (!currentUser.avatarStoragePath) {
    return { success: true }
  }

  const supabase = createAdminClient()

  await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([currentUser.avatarStoragePath])

  await db
    .update(users)
    .set({
      avatarUrl: null,
      avatarStoragePath: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'profile.updated',
    entityType: 'user',
    entityId: currentUser.id,
    metadata: { field: 'avatar', action: 'removed' },
  })

  revalidatePath('/admin/profile')
  return { success: true }
}
