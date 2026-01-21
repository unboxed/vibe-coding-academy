"use client"

import { AuthProvider, useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { TooltipProvider } from "@/components/ui/tooltip"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isLoading, authError } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile} onSignOut={signOut} isLoading={isLoading} authError={authError} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <LayoutContent>{children}</LayoutContent>
      </TooltipProvider>
    </AuthProvider>
  )
}
