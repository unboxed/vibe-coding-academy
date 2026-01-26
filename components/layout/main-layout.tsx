"use client"

import { useClerk } from "@clerk/nextjs"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useProfile } from "@/hooks/use-profile"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk()
  const { user, profile, isLoading, error } = useProfile()

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
        isLoading={isLoading}
        authError={error}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <LayoutContent>{children}</LayoutContent>
    </TooltipProvider>
  )
}
