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
        <h1 className="display text-[2.3rem] leading-[1.05] sm:text-[3.2rem]">What changed, and why</h1>
        <p className="mt-4 text-lg leading-relaxed text-graphite">
          Every release of the plugin. Update with{" "}
          <code className="font-mono text-[0.88em] text-ink">/plugin marketplace update {MARKETPLACE}</code>, or browse{" "}
          <a href={RELEASES_URL} className="font-medium text-cobalt hover:underline">GitHub releases</a>.
        </p>
      </motion.header>

      <ol className="relative mt-14 border-l border-rule">
        {releases.map((r, i) => (
          <li key={r.version} className="relative pb-14 pl-8 last:pb-0">
            <span
              aria-hidden
              className={`absolute -left-[5px] top-2 size-2.5 rounded-full ${i === 0 ? "bg-marker ring-2 ring-ink" : "bg-white ring-2 ring-rule"}`}
            />
            <Reveal>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="display text-[1.7rem] leading-none">v{r.version}</h2>
                {i === 0 && (
                  <span className="rounded-full border border-ok/30 bg-ok/5 px-2.5 py-0.5 font-mono text-[11px] text-ok">latest</span>
                )}
                <time className="font-mono text-[13px] text-graphite">{r.date}</time>
                {i === 0 && (
                  <a
                    href={`${REPO_URL}/releases/tag/v${r.version}`}
                    className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-cobalt hover:underline"
                  >
                    release <ArrowUpRight className="size-3" />
                  </a>
                )}
              </div>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/80">
                {r.blocks.map((b, j) =>
                  b.kind === "h" ? (
                    <h3 key={j} className="pt-3 font-mono text-[11.5px] uppercase tracking-[0.18em] text-cobalt">{b.text}</h3>
                  ) : b.kind === "p" ? (
                    <p key={j}><Inline text={b.text} /></p>
                  ) : (
                    <ul key={j} className="space-y-2.5">
                      {b.items.map((it, k) => (
                        <li key={k} className="flex gap-3">
                          <span aria-hidden className="mt-2.25 size-1.5 shrink-0 rounded-full bg-ink/30" />
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
