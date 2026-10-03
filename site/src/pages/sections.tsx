import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/reveal"
import { Eyebrow } from "@/components/shell"
import { mount } from "@/mount"
import { discovery, sections, type Section } from "@/content"

type Entry = Pick<Section, "n" | "title" | "goal" | "checks" | "file"> & { when?: string; always?: string }

const entries: Entry[] = [
  { n: 0, title: "Discovery", always: "always first", ...discovery },
  ...sections,
]

const id = (n: number) => `s${n}`
const num = (n: number) => `§${n.toString().padStart(2, "0")}`

// Scroll-spy: the entry nearest the upper third of the viewport is "current".
function useActive() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const io = new IntersectionObserver(
      (items) => {
        const hit = items.filter((i) => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(Number(hit.target.id.slice(1)))
      },
      { rootMargin: "-25% 0px -65% 0px" },
    )
    entries.forEach((e) => {
      const el = document.getElementById(id(e.n))
      if (el) io.observe(el)
    })
    // Deep links (sections.html#s6) arrive before React renders the target.
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView()
    return () => io.disconnect()
  }, [])
  return active
}

function Index({ active }: { active: number }) {
  return (
    <nav aria-label="Sections" className="sticky top-24 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto lg:block">
      <ul className="space-y-0.5 border-l border-rule">
        {entries.map((e) => (
          <li key={e.n} className="relative">
            {active === e.n && (
              <motion.span
                layoutId="toc-active"
                className="absolute -left-px top-0 h-full w-0.5 bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <a
              href={`#${id(e.n)}`}
              aria-current={active === e.n ? "location" : undefined}
              className={cn(
                "flex gap-2.5 py-1.5 pl-4 text-[14px] transition-colors hover:text-ink focus-visible:outline-2",
                active === e.n ? "font-medium text-ink" : "text-graphite",
              )}
            >
              <span className="w-7 shrink-0 font-mono text-[12px] leading-5 text-graphite">{num(e.n)}</span>
              <span>{e.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Article({ e }: { e: Entry }) {
  return (
    <Reveal>
      <article id={id(e.n)} className="scroll-mt-24 rounded-lg border border-rule bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
          <span className="text-graphite">{num(e.n)}</span>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", e.when ? "border-cobalt/30 bg-cobalt/5 text-cobalt" : "border-ok/30 bg-ok/5 text-ok")}>
            {e.when ? `runs if ${e.when}` : (e.always ?? "always runs")}
          </span>
        </div>
        <h2 className="display mt-3 text-[1.6rem] leading-tight">{e.title}</h2>
        <p className="mt-2 text-lg text-ink/85">{e.goal}</p>
        <ul className="mt-5 space-y-2.5">
          {e.checks.map((c) => (
            <li key={c} className="flex gap-3 text-[15px] leading-relaxed text-graphite">
              <span aria-hidden className="mt-2.25 size-1.5 shrink-0 rounded-full bg-ink/40" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <a
          href={e.file}
          className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-cobalt hover:underline"
        >
          Read the full checklist on GitHub <ArrowUpRight className="size-3.5" />
        </a>
      </article>
    </Reveal>
  )
}

function SectionsPage() {
  const active = useActive()
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl"
      >
        <Eyebrow>The checklist</Eyebrow>
        <h1 className="display text-[2.3rem] leading-[1.05] sm:text-[3.2rem]">The audit, section by section</h1>
        <p className="mt-4 text-lg leading-relaxed text-graphite">
          Discovery runs first. Sections 1–10 always run. Sections 11–14 run only
          when discovery finds a tenancy package, more than one worker host,
          Livewire, or Inertia. You can also ask for any single section on its own.
        </p>
      </motion.header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[220px_1fr]">
        <Index active={active} />
        <div className="space-y-6">
          {entries.map((e) => (
            <Article key={e.n} e={e} />
          ))}
          <Reveal>
            <div className="rounded-lg border border-dashed border-ink/25 p-6 sm:p-8">
              <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-graphite">then</div>
              <h2 className="display mt-2 text-[1.6rem] leading-tight">Two files, written into your project</h2>
              <p className="mt-2 text-graphite">
                <span className="font-mono text-[0.9em] text-ink">PERF_AUDIT_REPORT.md</span> and{" "}
                <span className="font-mono text-[0.9em] text-ink">PERF_CONFIGS/</span>.{" "}
                <a href="./#sample" className="font-medium text-cobalt hover:underline">See a sample finding</a>.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

mount("sections", <SectionsPage />)
