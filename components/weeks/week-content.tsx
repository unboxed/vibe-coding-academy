'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Copy, ExternalLink, Pencil } from 'lucide-react'
import { WeekAdminToolbar } from './week-admin-toolbar'
import { WeekSectionEditor } from './week-section-editor'
import { DemoVoteButton } from '@/components/weeks/demo-vote-button'
import { SubmitDemoButton } from '@/components/weeks/submit-demo-button'
import { getInitials } from '@/lib/utils'
import type { Week, WeekSection, Demo } from '@/types/database'

interface WeekContentProps {
  week: Week
  sections: WeekSection[]
  demos: Demo[]
  voteMap: Map<string, number>
  isAdmin: boolean
}

export function WeekContent({
  week,
  sections,
  demos,
  voteMap,
  isAdmin,
}: WeekContentProps) {
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editingSection, setEditingSection] = React.useState<WeekSection | null>(null)

  // Sort sections by sort_order
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  // Filter out empty sections for non-admins
  const visibleSections = isAdmin
    ? sortedSections
    : sortedSections.filter(s => s.content)

  // Determine default tab
  const defaultTab = visibleSections.length > 0 ? visibleSections[0].slug : 'demos'

  const handleEditSection = (section: WeekSection) => {
    setEditingSection(section)
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      {/* Admin Toolbar */}
      {isAdmin && (
        <WeekAdminToolbar
          week={week}
          sections={sections}
          isEditMode={isEditMode}
          onEditModeChange={setIsEditMode}
        />
      )}

      {/* Content Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className={`grid w-full grid-cols-${Math.min(visibleSections.length + 1, 6)}`}>
          {visibleSections.map((section) => (
            <TabsTrigger key={section.slug} value={section.slug}>
              {section.title}
            </TabsTrigger>
          ))}
          <TabsTrigger value="demos">Demos</TabsTrigger>
        </TabsList>

        {/* Dynamic Section Tabs */}
        {visibleSections.map((section) => (
          <TabsContent key={section.slug} value={section.slug} className="relative">
            {isAdmin && isEditMode && (
              <Button
                variant="outline"
                size="sm"
                className="absolute top-0 right-0"
                onClick={() => handleEditSection(section)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Section
              </Button>
            )}
            <div className="prose prose-slate max-w-none">
              {section.content ? (
                section.slug === 'prompts' ? (
                  <ReactMarkdown
                    components={{
                      code: ({ children, className }) => {
                        const isBlock = className?.includes('language-')
                        if (isBlock) {
                          return (
                            <div className="relative group">
                              <pre className="!mt-0">
                                <code className={className}>{children}</code>
                              </pre>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  navigator.clipboard.writeText(String(children))
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        }
                        return <code className={className}>{children}</code>
                      },
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                ) : (
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                )
              ) : (
                <p className="text-muted-foreground">
                  {isAdmin ? 'No content yet. Click "Edit Section" to add content.' : 'No content available.'}
                </p>
              )}
            </div>
          </TabsContent>
        ))}

        {/* Demos Tab */}
        <TabsContent value="demos">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Submitted Demos ({demos?.length || 0})
              </h3>
              <SubmitDemoButton weekId={week.id} weekNumber={week.number} />
            </div>

            {demos && demos.length > 0 ? (
              <div className="space-y-3">
                {demos.map((demo) => (
                  <Card key={demo.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={demo.profile?.avatar_url || ''}
                              alt={demo.profile?.name || ''}
                            />
                            <AvatarFallback>
                              {getInitials(demo.profile?.name || '?')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{demo.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              by {demo.profile?.name}
                            </p>
                            {demo.description && (
                              <p className="text-sm mt-2">{demo.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DemoVoteButton
                            demoId={demo.id}
                            currentVotes={voteMap.get(demo.id) || 0}
                          />
                          {demo.url && (
                            <a
                              href={demo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No demos submitted yet. Be the first!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {week.feedback_url && (
            <div className="mt-6">
              <a
                href={week.feedback_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Submit Feedback
                </Button>
              </a>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Section Dialog */}
      <WeekSectionEditor
        section={editingSection}
        weekId={week.id}
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        onSuccess={handleRefresh}
      />
    </>
  )
}
