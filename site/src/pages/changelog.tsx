import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { Inline } from "@/components/inline"
import { parseChangelog } from "@/lib/changelog"
import { Reveal } from "@/components/reveal"
import { Eyebrow } from "@/components/shell"
import { mount } from "@/mount"
import { MARKETPLACE, RELEASES_URL, REPO_URL } from "@/content"
// Single source of truth: the repo's CHANGELOG.md, bundled at build time.
import changelog from "../../../CHANGELOG.md?raw"

const releases = parseChangelog(changelog)

function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Eyebrow>Changelog</Eyebrow>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">What changed, and why</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Every release of the plugin. Update with{" "}
          <code className="font-mono text-sm text-foreground">/plugin marketplace update {MARKETPLACE}</code>, or browse{" "}
          <a href={RELEASES_URL} className="text-steel hover:underline">GitHub releases</a>.
        </p>
      </motion.header>

      <ol className="relative mt-14 border-l border-border">
        {releases.map((r, i) => (
          <li key={r.version} className="relative pb-14 pl-8 last:pb-0">
            <span
              aria-hidden
              className={`absolute -left-[5px] top-2 size-2.5 rounded-full ${i === 0 ? "bg-steel ring-4 ring-steel/15" : "bg-border"}`}
            />
            <Reveal>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">v{r.version}</h2>
                {i === 0 && (
                  <span className="rounded-full border border-ok/40 px-2.5 py-0.5 font-mono text-[11px] text-ok">latest</span>
                )}
                <time className="font-mono text-sm text-muted-foreground">{r.date}</time>
                {i === 0 && (
                  <a
                    href={`${REPO_URL}/releases/tag/v${r.version}`}
                    className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    release <ArrowUpRight className="size-3" />
                  </a>
                )}
              </div>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                {r.blocks.map((b, j) =>
                  b.kind === "h" ? (
                    <h3 key={j} className="pt-2 font-mono text-xs uppercase tracking-[0.18em] text-steel">{b.text}</h3>
                  ) : b.kind === "p" ? (
                    <p key={j}><Inline text={b.text} /></p>
                  ) : (
                    <ul key={j} className="space-y-2.5">
                      {b.items.map((it, k) => (
                        <li key={k} className="flex gap-3">
                          <span aria-hidden className="mt-2.25 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                          <span><Inline text={it} /></span>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  )
}

mount("changelog", <ChangelogPage />)
