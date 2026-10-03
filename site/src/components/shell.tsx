import type { ReactNode } from "react"
import { MotionConfig } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { MARKETPLACE, REPO_URL, RELEASES_URL, VERSION } from "@/content"
export type Page = "home" | "sections" | "changelog"

// Relative links: every page sits next to the others under the Pages base path.
const nav: { page: Page | null; label: string; href: string; wide?: boolean }[] = [
  { page: "sections", label: "Sections", href: "sections.html" },
  { page: "changelog", label: "Changelog", href: "changelog.html" },
  { page: null, label: "Install", href: "./#install", wide: true },
]

export function Shell({ page, children }: { page: Page; children: ReactNode }) {
  return (
    // reducedMotion="user": every motion component honours the OS setting.
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <a href="./" className="font-mono text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
              <span className="text-steel">~/</span>
              <span className="hidden sm:inline">laravel-production-audit</span>
              <span className="sm:hidden">audit</span>
            </a>
            <nav aria-label="Main" className="flex items-center gap-0.5 text-[13px] sm:gap-1 sm:text-sm">
              {nav.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  aria-current={n.page === page ? "page" : undefined}
                  className={cn(
                    n.wide && "hidden sm:block",
                    "rounded-md px-2 py-1.5 transition-colors sm:px-2.5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
                    n.page === page ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {n.label}
                  {n.page === page && <span className="mt-0.5 block h-px bg-steel" />}
                </a>
              ))}
              <a
                href={REPO_URL}
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 sm:px-2.5 text-muted-foreground transition-colors hover:border-steel/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                GitHub <ArrowUpRight className="size-3.5" />
              </a>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 font-mono text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              v{VERSION} · MIT · part of the{" "}
              <a href={REPO_URL} className="text-steel hover:underline">
                {MARKETPLACE}
              </a>{" "}
              marketplace
            </div>
            <div className="flex gap-5">
              <a href="sections.html" className="hover:text-foreground">Sections</a>
              <a href={RELEASES_URL} className="hover:text-foreground">Releases</a>
              <a href={REPO_URL} className="hover:text-foreground">Source</a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-steel">
      {children}
    </div>
  )
}
