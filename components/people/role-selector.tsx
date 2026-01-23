'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { updateProfileRole } from '@/app/actions/admin'
import type { UserRole } from '@/types/database'

interface RoleSelectorProps {
  userId: string
  currentRole: UserRole
  disabled?: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  member: 'Member',
}

export function RoleSelector({ userId, currentRole, disabled }: RoleSelectorProps) {
  const [role, setRole] = React.useState<UserRole>(currentRole)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === role) return

    setIsUpdating(true)
    try {
      await updateProfileRole(userId, newRole)
      setRole(newRole)
    } catch (err) {
      console.error('Failed to update role:', err)
      // Reset to previous value on error
      setRole(role)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
      <Select
        value={role}
        onValueChange={(value) => handleRoleChange(value as UserRole)}
        disabled={disabled || isUpdating}
      >
        <SelectTrigger className="h-7 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  )
}
