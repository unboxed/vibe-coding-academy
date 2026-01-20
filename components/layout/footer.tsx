import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Vibe Coding Academy - Zero to Hero Journey
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/weeks"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Curriculum
          </Link>
          <Link
            href="/people"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Community
          </Link>
          <Link
            href="/badges"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Achievements
          </Link>
        </div>
      </div>
    </footer>
  )
}
