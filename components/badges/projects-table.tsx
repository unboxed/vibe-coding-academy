'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Award, MessageSquare, Plus, ChevronDown, ChevronUp, Loader2, Pencil, Trash2, GripVertical, X } from 'lucide-react'
import { addProjectFeedback, updateProjectFeedback, deleteProjectFeedback, reorderProjects, awardBadgeToProject, removeBadgeFromProject } from '@/app/actions/admin'
import { getInitials } from '@/lib/utils'
import type { Project, Profile, BadgeAward, ProjectFeedback, Badge } from '@/types/database'

interface ProjectWithDetails extends Project {
  profile: Profile
  ownerBadges: BadgeAward[]
  feedback: ProjectFeedback[]
}

interface ProjectsTableProps {
  projects: ProjectWithDetails[]
  isAdmin: boolean
  badges: Badge[]
}

type SortField = 'title' | 'owner' | null
type SortDirection = 'asc' | 'desc'

// Sortable row component for drag-and-drop
function SortableRow({
  project,
  isAdmin,
  badges,
  isExpanded,
  onToggleExpanded,
  onOpenFeedbackDialog,
  onDeleteFeedback,
  onAwardBadge,
  onRemoveBadge,
}: {
  project: ProjectWithDetails
  isAdmin: boolean
  badges: Badge[]
  isExpanded: boolean
  onToggleExpanded: (projectId: string) => void
  onOpenFeedbackDialog: (projectId: string, feedback?: ProjectFeedback) => void
  onDeleteFeedback: (feedbackId: string) => void
  onAwardBadge: (projectId: string, badgeId: string) => void
  onRemoveBadge: (awardId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !isAdmin })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasFeedback = project.feedback && project.feedback.length > 0

  // Get badges not yet awarded to this project
  const availableBadges = badges.filter(
    badge => !project.ownerBadges?.some(award => award.badge_id === badge.id)
  )

  return (
    <React.Fragment>
      <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50">
        {isAdmin && (
          <TableCell className="w-[40px] pr-0">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </TableCell>
        )}
        <TableCell>
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:underline"
          >
            {project.title}
          </Link>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {project.description}
            </p>
          )}
        </TableCell>
        <TableCell>
          <Link
            href={`/people/${project.profile?.id}`}
            className="flex items-center gap-2 hover:underline"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={project.profile?.avatar_url || ''}
                alt={project.profile?.name || ''}
              />
              <AvatarFallback className="text-xs">
                {getInitials(project.profile?.name || '?')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{project.profile?.name}</span>
          </Link>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 flex-wrap">
            {project.ownerBadges && project.ownerBadges.length > 0 ? (
              <>
                {project.ownerBadges.slice(0, 4).map((award) => (
                  <div
                    key={award.id}
                    className="group relative w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: award.badge?.color }}
                    title={award.badge?.name}
                  >
                    <Award className="h-3 w-3 text-white" />
                    {isAdmin && (
                      <button
                        onClick={() => onRemoveBadge(award.id)}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full items-center justify-center hidden group-hover:flex"
                      >
                        <X className="h-2 w-2 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                {project.ownerBadges.length > 4 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{project.ownerBadges.length - 4}
                  </span>
                )}
              </>
            ) : null}
            {isAdmin && availableBadges.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {availableBadges.map((badge) => (
                    <DropdownMenuItem
                      key={badge.id}
                      onClick={() => onAwardBadge(project.id, badge.id)}
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2 flex items-center justify-center"
                        style={{ backgroundColor: badge.color }}
                      >
                        <Award className="h-2 w-2 text-white" />
                      </div>
                      {badge.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isAdmin && (!project.ownerBadges || project.ownerBadges.length === 0) && (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {hasFeedback ? (
              <button
                onClick={() => onToggleExpanded(project.id)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <MessageSquare className="h-4 w-4" />
                {project.feedback.length}
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onOpenFeedbackDialog(project.id)}
                title="Add feedback"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && hasFeedback && (
        <TableRow>
          <TableCell colSpan={isAdmin ? 5 : 4} className="bg-muted/30 py-3">
            <div className="space-y-3 pl-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Instructor Feedback
              </p>
              {project.feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{fb.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {fb.instructor && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarImage
                                src={fb.instructor.avatar_url || ''}
                                alt={fb.instructor.name}
                              />
                              <AvatarFallback className="text-[8px]">
                                {getInitials(fb.instructor.name)}
                              </AvatarFallback>
                            </Avatar>
                            {fb.instructor.name}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onOpenFeedbackDialog(project.id, fb)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-destructive"
                          onClick={() => onDeleteFeedback(fb.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  )
}

export function ProjectsTable({ projects, isAdmin, badges }: ProjectsTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set())
  const [feedbackDialogOpen, setFeedbackDialogOpen] = React.useState(false)
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [feedbackContent, setFeedbackContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingFeedback, setEditingFeedback] = React.useState<ProjectFeedback | null>(null)
  const [localProjects, setLocalProjects] = React.useState(projects)

  // Update local projects when props change
  React.useEffect(() => {
    setLocalProjects(projects)
  }, [projects])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleSort = (field: SortField) => {
    if (field === null) return
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  // Sort projects - if no sort field, use original order (sort_order)
  const sortedProjects = React.useMemo(() => {
    if (!sortField) {
      return localProjects
    }
    return [...localProjects].sort((a, b) => {
      let comparison = 0
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title)
      } else if (sortField === 'owner') {
        comparison = (a.profile?.name || '').localeCompare(b.profile?.name || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [localProjects, sortField, sortDirection])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Reset sort to manual order when dragging
      setSortField(null)

      const oldIndex = localProjects.findIndex((p) => p.id === active.id)
      const newIndex = localProjects.findIndex((p) => p.id === over.id)

      const newProjects = arrayMove(localProjects, oldIndex, newIndex)
      setLocalProjects(newProjects)

      // Persist to database
      try {
        await reorderProjects(newProjects.map((p) => p.id))
      } catch (err) {
        console.error('Failed to reorder projects:', err)
        // Revert on error
        setLocalProjects(projects)
      }
    }
  }

  const openFeedbackDialog = (projectId: string, feedback?: ProjectFeedback) => {
    setSelectedProjectId(projectId)
    if (feedback) {
      setEditingFeedback(feedback)
      setFeedbackContent(feedback.content)
    } else {
      setEditingFeedback(null)
      setFeedbackContent('')
    }
    setFeedbackDialogOpen(true)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedProjectId || !feedbackContent.trim()) return

    setIsSubmitting(true)
    try {
      if (editingFeedback) {
        await updateProjectFeedback(editingFeedback.id, feedbackContent.trim())
      } else {
        await addProjectFeedback(selectedProjectId, feedbackContent.trim())
      }
      setFeedbackDialogOpen(false)
      setFeedbackContent('')
      setEditingFeedback(null)
      router.refresh()
    } catch (err) {
      console.error('Failed to save feedback:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      await deleteProjectFeedback(feedbackId)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete feedback:', err)
    }
  }

  const handleAwardBadge = async (projectId: string, badgeId: string) => {
    try {
      await awardBadgeToProject({ badge_id: badgeId, project_id: projectId })
      router.refresh()
    } catch (err) {
      console.error('Failed to award badge:', err)
    }
  }

  const handleRemoveBadge = async (awardId: string) => {
    try {
      await removeBadgeFromProject(awardId)
      router.refresh()
    } catch (err) {
      console.error('Failed to remove badge:', err)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  if (projects.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No projects yet.
      </p>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && <TableHead className="w-[40px]" />}
              <TableHead className={isAdmin ? "w-[35%]" : "w-[40%]"}>
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Project Name
                  <SortIcon field="title" />
                </button>
              </TableHead>
              <TableHead className="w-[25%]">
                <button
                  onClick={() => toggleSort('owner')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Owner
                  <SortIcon field="owner" />
                </button>
              </TableHead>
              <TableHead className="w-[15%]">Badges</TableHead>
              <TableHead className="w-[20%]">Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext
            items={sortedProjects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {sortedProjects.map((project) => (
                <SortableRow
                  key={project.id}
                  project={project}
                  isAdmin={isAdmin}
                  badges={badges}
                  isExpanded={expandedProjects.has(project.id)}
                  onToggleExpanded={toggleExpanded}
                  onOpenFeedbackDialog={openFeedbackDialog}
                  onDeleteFeedback={handleDeleteFeedback}
                  onAwardBadge={handleAwardBadge}
                  onRemoveBadge={handleRemoveBadge}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>

      {/* Add/Edit Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFeedback ? 'Edit Feedback' : 'Add Instructor Feedback'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="Write your feedback for this project..."
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || !feedbackContent.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFeedback ? 'Save' : 'Add Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
