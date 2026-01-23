'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Award, MessageSquare, Plus, ChevronDown, ChevronUp, Loader2, Pencil, Trash2 } from 'lucide-react'
import { addProjectFeedback, updateProjectFeedback, deleteProjectFeedback } from '@/app/actions/admin'
import { getInitials } from '@/lib/utils'
import type { Project, Profile, BadgeAward, ProjectFeedback } from '@/types/database'

interface ProjectWithDetails extends Project {
  profile: Profile
  ownerBadges: BadgeAward[]
  feedback: ProjectFeedback[]
}

interface ProjectsTableProps {
  projects: ProjectWithDetails[]
  isAdmin: boolean
}

type SortField = 'title' | 'owner'
type SortDirection = 'asc' | 'desc'

export function ProjectsTable({ projects, isAdmin }: ProjectsTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = React.useState<SortField>('title')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set())
  const [feedbackDialogOpen, setFeedbackDialogOpen] = React.useState(false)
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [feedbackContent, setFeedbackContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingFeedback, setEditingFeedback] = React.useState<ProjectFeedback | null>(null)

  const toggleSort = (field: SortField) => {
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

  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) => {
      let comparison = 0
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title)
      } else if (sortField === 'owner') {
        comparison = (a.profile?.name || '').localeCompare(b.profile?.name || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [projects, sortField, sortDirection])

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
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
        <TableBody>
          {sortedProjects.map((project) => {
            const isExpanded = expandedProjects.has(project.id)
            const hasFeedback = project.feedback && project.feedback.length > 0

            return (
              <React.Fragment key={project.id}>
                <TableRow className="hover:bg-muted/50">
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
                    {project.ownerBadges && project.ownerBadges.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.ownerBadges.slice(0, 4).map((award) => (
                          <div
                            key={award.id}
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: award.badge?.color }}
                            title={award.badge?.name}
                          >
                            <Award className="h-3 w-3 text-white" />
                          </div>
                        ))}
                        {project.ownerBadges.length > 4 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{project.ownerBadges.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {hasFeedback ? (
                        <button
                          onClick={() => toggleExpanded(project.id)}
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
                          onClick={() => openFeedbackDialog(project.id)}
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
                    <TableCell colSpan={4} className="bg-muted/30 py-3">
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
                                    onClick={() => openFeedbackDialog(project.id, fb)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:text-destructive"
                                    onClick={() => handleDeleteFeedback(fb.id)}
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
          })}
        </TableBody>
      </Table>

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
