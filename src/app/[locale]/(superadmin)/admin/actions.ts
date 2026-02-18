// Barrel re-exports from split action modules.
// Each module has its own 'use server' directive.
// NOTE: Do NOT add 'use server' here — it disallows re-exports.

export { updateProfile } from './actions/profile'

export {
  getTeamMembers,
  getPendingInvitations,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  cancelInvitation,
} from './actions/team'

export {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  deleteOrganization,
  updateOrganization,
  checkSlugAvailability,
  createOrganizationWithAdmin,
} from './actions/organizations'

export {
  getOrgInvitations,
  resendOrgInvitation,
  cancelOrgInvitation,
} from './actions/org-invitations'

export { getAuditLogs } from './actions/activity'

export {
  updatePlatformSettings,
  uploadPlatformLogo,
  deletePlatformLogo,
  setPlatformLogoUrl,
} from './actions/settings'

export { startImpersonationAction } from './actions/impersonation'

export {
  updateEmailTemplate,
  resetEmailTemplate,
  sendTestTemplateEmail,
} from './actions/email-templates'

export {
  getRecentNotifications,
  getUnreadCount,
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './actions/notifications'

export {
  getAnalysisJobs,
  getAnalysisJobStats,
  cancelAnalysisJob,
  retryAnalysisJob,
  checkN8nHealthAction,
} from './actions/jobs'

export { getPlatformStats } from './actions/stats'

export {
  getActiveProducts,
  getAllProducts,
  getProductById,
  getProductOrganizations,
  getProductOrgCount,
  createProduct,
  updateProduct,
  archiveProduct,
  reactivateProduct,
  assignOrganizationPlan,
  removeOrganizationPlan,
  getOrganizationProductAction,
} from './actions/plans'
