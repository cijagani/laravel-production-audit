import type { ReactNode } from "react"
import { MotionConfig } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { MARKETPLACE, REPO_URL, RELEASES_URL, VERSION } from "@/content"

export type Page = "home" | "sections" | "changelog" | "legal"

// Relative links: every page sits next to the others under the Pages base path.
const nav: { page: Page; label: string; href: string }[] = [
  { page: "sections", label: "Sections", href: "sections.html" },
  { page: "changelog", label: "Changelog", href: "changelog.html" },
]

function Wordmark() {
  return (
    <a href="./" className="group flex items-center gap-2.5 rounded-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-4">
      {/* the mark: a listing with one cited line */}
      <svg aria-hidden viewBox="0 0 32 32" className="size-7">
        <rect x="1" y="1" width="30" height="30" rx="6" fill="#fff" stroke="currentColor" strokeWidth="2" />
        <rect x="7" y="8" width="13" height="2.4" rx="1.2" fill="currentColor" opacity=".3" />
        <rect x="6" y="13.6" width="20" height="5" rx="1" className="fill-marker" />
        <rect x="7" y="14.9" width="15" height="2.4" rx="1.2" fill="currentColor" />
        <rect x="7" y="22" width="10" height="2.4" rx="1.2" fill="currentColor" opacity=".3" />
      </svg>
      <span className="font-mono text-[13px] font-medium">
        <span className="hidden sm:inline">laravel-production-</span>audit
      </span>
    </a>
  )
}

export function Shell({ page, children }: { page: Page; children: ReactNode }) {
  return (
    // reducedMotion="user": every motion component honours the OS setting.
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Wordmark />
            <nav aria-label="Main" className="flex items-center gap-1 text-[14px]">
              {nav.map((n) => (
                <a
                  key={n.page}
                  href={n.href}
                  aria-current={n.page === page ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-2.5 py-1.5 transition-colors hover:text-ink focus-visible:outline-2",
                    n.page === page ? "font-medium text-ink" : "text-graphite",
                  )}
                >
                  {n.label}
                  {n.page === page && <span className="absolute inset-x-2.5 -bottom-2.75 h-0.5 bg-ink" />}
                </a>
              ))}
              <a
                href={REPO_URL}
                className="hidden items-center gap-1 rounded-md px-2.5 py-1.5 text-graphite transition-colors hover:text-ink focus-visible:outline-2 sm:inline-flex"
              >
                GitHub <ArrowUpRight className="size-3.5" />
              </a>
              <a
                href="./#install"
                className="ml-1.5 rounded-md bg-ink px-3 py-1.5 font-medium text-white transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Install
              </a>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="border-t border-rule bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-graphite sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="font-mono text-[12.5px]">
              v{VERSION} · MIT · the{" "}
              <a href={REPO_URL} className="text-cobalt hover:underline">
                {MARKETPLACE}
              </a>{" "}
              marketplace
            </div>
            <div className="flex gap-5">
              <a href="sections.html" className="hover:text-ink">Sections</a>
              <a href="changelog.html" className="hover:text-ink">Changelog</a>
              <a href={RELEASES_URL} className="hover:text-ink">Releases</a>
              <a href="legal.html" className="hover:text-ink">Privacy &amp; terms</a>
              <a href={REPO_URL} className="hover:text-ink">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.18em] text-cobalt">{children}</div>
}
