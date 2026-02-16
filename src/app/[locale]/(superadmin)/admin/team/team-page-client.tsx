'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  cancelInvitation,
} from '../actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, MoreHorizontal, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  email: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  platformRole: 'superadmin' | 'staff' | null
  avatarUrl: string | null
  createdAt: Date
}

interface Invitation {
  id: string
  email: string
  role: 'superadmin' | 'staff'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: Date
  createdAt: Date
}

interface CurrentUser {
  id: string
  platformRole: 'superadmin' | 'staff' | null
}

export function TeamPageClient({
  currentUser,
  members,
  invitations,
}: {
  currentUser: CurrentUser
  members: TeamMember[]
  invitations: Invitation[]
}) {
  const t = useTranslations('admin.team')
  const tCommon = useTranslations('common')
  const [inviteOpen, setInviteOpen] = useState(false)
  const isSuperadmin = currentUser.platformRole === 'superadmin'

  async function handleInvite(formData: FormData) {
    const result = await inviteTeamMember(formData)
    if (result.success) {
      toast.success(t('invited'))
      setInviteOpen(false)
    } else {
      toast.error(result.error || t('error'))
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const formData = new FormData()
    formData.set('userId', userId)
    formData.set('role', newRole)
    const result = await updateTeamMemberRole(formData)
    if (result.success) {
      toast.success(t('roleUpdated'))
    } else {
      toast.error(result.error || t('error'))
    }
  }

  async function handleRemove(userId: string) {
    const formData = new FormData()
    formData.set('userId', userId)
    const result = await removeTeamMember(formData)
    if (result.success) {
      toast.success(t('memberRemoved'))
    } else {
      toast.error(result.error || t('error'))
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    const result = await cancelInvitation(invitationId)
    if (result.success) {
      toast.success(t('invitationCancelled'))
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {isSuperadmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 size-4" />
                {t('inviteMember')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('inviteMember')}</DialogTitle>
                <DialogDescription>{t('inviteDescription')}</DialogDescription>
              </DialogHeader>
              <form action={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{tCommon('email')}</Label>
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">{tCommon('role')}</Label>
                  <Select name="role" defaultValue="staff">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">{t('roles.staff')}</SelectItem>
                      <SelectItem value="superadmin">
                        {t('roles.superadmin')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit">{tCommon('invite')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            {t('members')} ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            {t('invitations')} ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>{t('members')}</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t('noMembers')}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tCommon('name')}</TableHead>
                      <TableHead>{tCommon('email')}</TableHead>
                      <TableHead>{tCommon('role')}</TableHead>
                      {isSuperadmin && (
                        <TableHead className="w-[80px]">
                          {tCommon('actions')}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.displayName ||
                            member.fullName ||
                            [member.firstName, member.lastName]
                              .filter(Boolean)
                              .join(' ') ||
                            '—'}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {member.platformRole
                              ? t(`roles.${member.platformRole}`)
                              : '—'}
                          </Badge>
                        </TableCell>
                        {isSuperadmin && (
                          <TableCell>
                            {member.id !== currentUser.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRoleChange(
                                        member.id,
                                        member.platformRole === 'superadmin'
                                          ? 'staff'
                                          : 'superadmin'
                                      )
                                    }
                                  >
                                    {t('changeRole')}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive"
                                      >
                                        {t('removeMember')}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          {t('removeConfirm')}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t('removeWarning')}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          {tCommon('cancel')}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleRemove(member.id)
                                          }
                                        >
                                          {tCommon('remove')}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>{t('invitations')}</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t('noInvitations')}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tCommon('email')}</TableHead>
                      <TableHead>{tCommon('role')}</TableHead>
                      <TableHead>{tCommon('status')}</TableHead>
                      {isSuperadmin && (
                        <TableHead className="w-[80px]">
                          {tCommon('actions')}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {t(`roles.${inv.role}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inv.status}</Badge>
                        </TableCell>
                        {isSuperadmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelInvitation(inv.id)}
                            >
                              <X className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
