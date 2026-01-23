'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ArrowRight, CheckCircle, Plus, Pencil, Trash2, EyeOff } from 'lucide-react'
import { deleteWeek } from '@/app/actions/admin'
import { WeekEditor } from './week-editor'
import { getLevelForWeek, getLevelName } from '@/lib/utils'
import type { Week } from '@/types/database'

interface WeeksListContentProps {
  weeks: Week[]
  demoCountMap: Map<string, number>
  isAdmin: boolean
}

const levelColors = {
  1: { bg: 'bg-[hsl(199,89%,48%)]', text: 'text-white', border: 'border-[hsl(199,89%,48%)]' },
  2: { bg: 'bg-[hsl(262,83%,58%)]', text: 'text-white', border: 'border-[hsl(262,83%,58%)]' },
  3: { bg: 'bg-[hsl(142,76%,36%)]', text: 'text-white', border: 'border-[hsl(142,76%,36%)]' },
}

export function WeeksListContent({ weeks, demoCountMap, isAdmin }: WeeksListContentProps) {
  const router = useRouter()
  const [showUnpublished, setShowUnpublished] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingWeek, setEditingWeek] = React.useState<Week | null>(null)
  const [deletingWeek, setDeletingWeek] = React.useState<Week | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Filter weeks based on admin preference
  const visibleWeeks = isAdmin && showUnpublished
    ? weeks
    : weeks.filter(w => w.published)

  // Group weeks by level
  const weeksByLevel = visibleWeeks.reduce((acc, week) => {
    const level = getLevelForWeek(week.number)
    if (!acc[level]) acc[level] = []
    acc[level].push(week)
    return acc
  }, {} as Record<number, Week[]>)

  // Get existing week numbers for the editor
  const existingWeekNumbers = weeks.map(w => w.number)

  const handleDeleteWeek = async () => {
    if (!deletingWeek) return

    setIsDeleting(true)
    try {
      await deleteWeek(deletingWeek.id)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete week:', err)
    } finally {
      setIsDeleting(false)
      setDeletingWeek(null)
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      {/* Admin Toolbar */}
      {isAdmin && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-dashed border-primary/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-unpublished"
                  checked={showUnpublished}
                  onCheckedChange={setShowUnpublished}
                />
                <Label htmlFor="show-unpublished" className="text-sm font-medium">
                  Show Unpublished
                </Label>
              </div>
            </div>

            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Week
            </Button>
          </div>
        </div>
      )}

      {/* Weeks by Level */}
      <div className="space-y-12">
        {[1, 2, 3].map((level) => (
          <section key={level}>
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`h-8 w-1 rounded-full ${levelColors[level as keyof typeof levelColors].bg}`}
              />
              <div>
                <h2 className="text-xl font-semibold">{getLevelName(level)}</h2>
                <p className="text-sm text-muted-foreground">
                  {level === 1 && 'Weeks 1-3: Foundation'}
                  {level === 2 && 'Weeks 4-5: Intermediate'}
                  {level === 3 && 'Weeks 6-10: Advanced'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeksByLevel?.[level]?.map((week) => (
                <div key={week.id} className="relative group">
                  <Link href={`/weeks/${week.number}`}>
                    <Card className={`h-full hover:shadow-md transition-all hover:border-primary/50 ${!week.published ? 'opacity-60 border-dashed' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={`level${level}` as 'level1' | 'level2' | 'level3'}
                            >
                              Week {week.number}
                            </Badge>
                            {!week.published && (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <CardTitle className="text-lg mt-2">{week.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {week.overview && (
                          <CardDescription className="line-clamp-2">
                            {week.overview.replace(/^#+\s*Overview\s*\n*/i, '').replace(/^#+\s*[^\n]+\n*/gm, '').slice(0, 150)}...
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                          {demoCountMap.get(week.id) ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              {demoCountMap.get(week.id)} demos
                            </span>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Admin Edit/Delete Buttons */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingWeek(week)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeletingWeek(week)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(!weeksByLevel?.[level] || weeksByLevel[level].length === 0) && (
              <p className="text-muted-foreground text-sm">No weeks in this level yet.</p>
            )}
          </section>
        ))}
      </div>

      {visibleWeeks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No weeks available yet.</p>
        </div>
      )}

      {/* Create Week Dialog */}
      <WeekEditor
        week={null}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleSuccess}
        existingWeekNumbers={existingWeekNumbers}
      />

      {/* Edit Week Dialog */}
      <WeekEditor
        week={editingWeek}
        open={!!editingWeek}
        onOpenChange={(open) => !open && setEditingWeek(null)}
        onSuccess={handleSuccess}
        existingWeekNumbers={existingWeekNumbers}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingWeek} onOpenChange={(open) => !open && setDeletingWeek(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Week</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Week {deletingWeek?.number}: &quot;{deletingWeek?.title}&quot;? This will also delete all sections and demos for this week. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWeek}
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
