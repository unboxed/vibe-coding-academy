'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { deleteSection } from '@/app/actions/admin'
import { WeekSectionEditor } from './week-section-editor'
import type { Week, WeekSection } from '@/types/database'

interface WeekAdminToolbarProps {
  week: Week
  sections: WeekSection[]
  isEditMode: boolean
  onEditModeChange: (editMode: boolean) => void
}

export function WeekAdminToolbar({
  week,
  sections,
  isEditMode,
  onEditModeChange,
}: WeekAdminToolbarProps) {
  const router = useRouter()
  const [isAddSectionOpen, setIsAddSectionOpen] = React.useState(false)
  const [editingSection, setEditingSection] = React.useState<WeekSection | null>(null)
  const [deletingSection, setDeletingSection] = React.useState<WeekSection | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDeleteSection = async () => {
    if (!deletingSection) return

    setIsDeleting(true)
    try {
      await deleteSection(deletingSection.id)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete section:', err)
    } finally {
      setIsDeleting(false)
      setDeletingSection(null)
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  const nextSortOrder = sections.length > 0
    ? Math.max(...sections.map((s) => s.sort_order)) + 1
    : 0

  return (
    <>
      <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-dashed border-primary/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="edit-mode"
              checked={isEditMode}
              onCheckedChange={onEditModeChange}
            />
            <Label htmlFor="edit-mode" className="text-sm font-medium">
              Edit Mode
            </Label>
          </div>

          <Button size="sm" onClick={() => setIsAddSectionOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {isEditMode && sections.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Sections (click to edit):</p>
            <div className="flex flex-wrap gap-2">
              {sections
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((section) => (
                  <div
                    key={section.id}
                    className="inline-flex items-center gap-1 bg-background border rounded-md px-2 py-1 text-sm"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <span>{section.title}</span>
                    <button
                      onClick={() => setEditingSection(section)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeletingSection(section)}
                      className="hover:bg-destructive/10 hover:text-destructive rounded p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Section Dialog */}
      <WeekSectionEditor
        section={null}
        weekId={week.id}
        open={isAddSectionOpen}
        onOpenChange={setIsAddSectionOpen}
        onSuccess={handleSuccess}
        nextSortOrder={nextSortOrder}
      />

      {/* Edit Section Dialog */}
      <WeekSectionEditor
        section={editingSection}
        weekId={week.id}
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSection} onOpenChange={(open) => !open && setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSection?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
