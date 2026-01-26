import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only these routes are accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',                    // Home page
  '/sign-in(.*)',         // Clerk sign-in
  '/sign-up(.*)',         // Clerk sign-up
])

export default clerkMiddleware(async (auth, req) => {
  // If NOT a public route, require authentication
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
