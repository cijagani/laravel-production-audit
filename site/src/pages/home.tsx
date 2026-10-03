import type { ReactNode } from "react"
import { motion } from "motion/react"
import { ArrowRight, ArrowUpRight, FileText, Folder } from "lucide-react"
import { AuditRun } from "@/components/audit-run"
import { CommandBlock } from "@/components/command-block"
import { Reveal } from "@/components/reveal"
import { Eyebrow } from "@/components/shell"
import { mount } from "@/mount"
import { cn } from "@/lib/utils"
import { configs, install, prompts, SAMPLE_URL, sections, severities, stack, steps, VERSION } from "@/content"

const ease = [0.22, 1, 0.36, 1] as const
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}
const toneText = { critical: "text-critical", high: "text-high", medium: "text-medium", ok: "text-ok" } as const

/** A highlighter swipe behind text — the page's one recurring mark for "cited". */
function Marked({ children, delay = 0.7 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="relative inline-block">
      <motion.span
        aria-hidden
        className="absolute -inset-x-[0.06em] bottom-[0.04em] top-[0.18em] -z-10 origin-left rounded-[0.08em] bg-marker"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay, ease }}
      />
      {children}
    </span>
  )
}

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <Reveal className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="display text-[1.9rem] leading-[1.08] sm:text-[2.4rem]">{title}</h2>
      {children && <p className="mt-4 text-[17px] leading-relaxed text-graphite">{children}</p>}
    </Reveal>
  )
}

function Hero() {
  return (
    <section className="graph-paper border-b border-rule">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1 }}>
          <motion.div variants={rise} className="mb-7 inline-flex items-center gap-2 rounded-full border border-rule bg-white px-3 py-1 font-mono text-[12px] text-graphite">
            <span className="size-1.5 rounded-full bg-ok" />
            Claude Code plugin · v{VERSION}
          </motion.div>
          <h1 className="display isolate text-[2.35rem] leading-[1.02] sm:text-[3.6rem] lg:text-[4.6rem]">
            <motion.span variants={rise} className="block">
              It reads <br className="sm:hidden" />
              your code,
            </motion.span>
            <motion.span variants={rise} className="block">
              then <Marked>cites it.</Marked>
            </motion.span>
          </h1>
          <motion.div variants={rise} className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-xl text-[17px] leading-relaxed text-graphite sm:text-lg">
              A production-readiness audit for existing Laravel apps, run by Claude.
              Every finding points at a real <span className="font-mono text-[0.9em] text-ink">file:line</span>,
              and the audit ends with production config written for your app.
            </p>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a href="#install" className="rounded-md bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2">
                Install the plugin
              </a>
              <a href="sections.html" className="inline-flex items-center gap-2 rounded-md border border-ink/20 bg-white px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:border-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2">
                See all {sections.length} sections <ArrowRight className="size-4" />
              </a>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 lg:mt-14"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease }}
        >
          <AuditRun />
        </motion.div>

        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-graphite" aria-label="Supported stack">
          {stack.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-graphite/50" />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section className="border-b border-rule bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Heading eyebrow="How an audit runs" title="Read first. Prescribe second.">
          Most bad performance advice comes from guessing at defaults. The audit
          reads the code and config first, and only then recommends.
        </Heading>
        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-[15px] hidden h-px origin-left bg-ink/25 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "0px 0px -120px 0px" }}
            transition={{ duration: 1.2, ease }}
          />
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease }}
            >
              <span className="relative z-10 grid size-8 place-items-center rounded-full border border-ink bg-white font-mono text-[12px] font-medium text-ink">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-graphite">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function SectionIndex() {
  return (
    <section className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading eyebrow={`${sections.length} sections · run all, or just one`} title="Every layer a production Laravel app gets wrong">
            The § numbers match the skill's own files. Four sections run only when
            discovery finds what they audit.
          </Heading>
          <Reveal>
            <a href="sections.html" className="inline-flex items-center gap-1.5 font-medium text-cobalt hover:underline">
              Full checklist <ArrowRight className="size-4" />
            </a>
          </Reveal>
        </div>

        <Reveal className="mt-12 overflow-hidden rounded-lg border border-rule bg-white">
          <div aria-hidden className="hidden grid-cols-[4rem_15rem_1fr_11rem] gap-x-6 border-b border-rule bg-paper/70 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite md:grid">
            <span>§</span>
            <span>Section</span>
            <span>What it catches</span>
            <span>Runs</span>
          </div>
          <ul>
            {sections.map((s) => (
              <li key={s.n} className="border-b border-rule last:border-b-0">
                <a
                  href={`sections.html#s${s.n}`}
                  className="group grid grid-cols-[3rem_1fr] gap-x-4 px-5 py-4 transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:-outline-offset-2 md:grid-cols-[4rem_15rem_1fr_11rem] md:items-baseline md:gap-x-6 md:px-6"
                >
                  <span className="font-mono text-[13px] text-graphite">§{s.n.toString().padStart(2, "0")}</span>
                  <span className="font-semibold text-ink">
                    {s.title}
                    <ArrowRight className="ml-1.5 inline size-3.5 -translate-x-1 text-ink opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="col-start-2 mt-1 text-[15px] leading-relaxed text-graphite md:col-start-auto md:mt-0">{s.blurb}</span>
                  <span className="col-start-2 mt-2 md:col-start-auto md:mt-0">
                    {s.when ? (
                      <span className="whitespace-nowrap rounded-full border border-cobalt/30 bg-cobalt/5 px-2.5 py-0.5 font-mono text-[11.5px] text-cobalt">if {s.when}</span>
                    ) : (
                      <span className="font-mono text-[12px] text-graphite">always</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Severity() {
  return (
    <section className="border-b border-rule bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Heading eyebrow="How findings are rated" title="By impact, never by how hard the fix is">
          A critical finding stays critical even when the fix is a big refactor —
          and a pattern that costs nothing measurable isn't inflated into one.
        </Heading>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {severities.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="bg-white p-6">
              <div className="flex items-center gap-2">
                <span aria-hidden>{s.glyph}</span>
                <span className={cn("font-semibold", toneText[s.tone])}>{s.label}</span>
              </div>
              <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-graphite">{s.when}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Install() {
  return (
    <section id="install" className="scroll-mt-14 border-b border-rule">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr]">
          <div className="min-w-0">
            <Heading eyebrow="Install" title="Two commands, then ask in plain English">
              Add the marketplace and install the plugin. The skill starts when your
              request matches — no flags, no paths.
            </Heading>
            <Reveal delay={0.1}>
              <ul className="mt-8 space-y-2">
                {prompts.map((p) => (
                  <li key={p} className="rounded-md border border-rule bg-white px-4 py-3 text-[15px] text-ink/90">
                    “{p}”
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="min-w-0 space-y-4 lg:pt-12">
            <CommandBlock label="In Claude Code" lines={install.cc} />
            <CommandBlock label="From a terminal" lines={install.cli} />
            <p className="font-mono text-[12px] leading-relaxed text-graphite">
              Or run it directly: /laravel-production-audit:laravel-production-audit
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const reportToc = [
  "Executive summary",
  "Architecture & hot paths",
  "🔴 Critical — fix before go-live",
  "🟠 High — fix this sprint",
  "🟡 Medium — fix this month",
  "✅ Leave as is",
  "Section-by-section findings",
  "Implementation roadmap",
  "Benchmark plan",
]

function Deliverables() {
  return (
    <section className="border-b border-rule bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Heading eyebrow="What you get back" title="Two artifacts, written into your project" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-lg border border-rule bg-paper/50 p-7">
              <div className="flex items-center gap-2 font-mono text-[13px] font-medium text-ink">
                <FileText className="size-4" /> PERF_AUDIT_REPORT.md
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-graphite">
                Every finding cites <span className="font-mono text-[0.9em] text-ink">file:line</span>.
                Critical and high findings also state what the code does now, what it
                costs, the fix, the expected gain, the risk, and what to measure.
              </p>
              <ol className="mt-6 divide-y divide-rule rounded-md border border-rule bg-white">
                {reportToc.map((h, i) => (
                  <li key={h} className="flex gap-3 px-4 py-2 text-[14px] text-ink/85">
                    <span className="w-5 shrink-0 font-mono text-[12px] text-graphite">{i + 1}</span>
                    {h}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-lg border border-rule bg-paper/50 p-7">
              <div className="flex items-center gap-2 font-mono text-[13px] font-medium text-ink">
                <Folder className="size-4" /> PERF_CONFIGS/
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-graphite">
                Complete production files filled in from the findings. Every
                non-obvious line carries a <span className="font-mono text-[0.9em] text-ink"># reason:</span>,
                and every sized value shows its formula.
              </p>
              <ul className="mt-6 rounded-md border border-rule bg-white py-2 font-mono text-[13px]">
                {configs.map((c, i) => (
                  <li key={c} className="flex items-center gap-2 px-4 py-1 text-ink/85">
                    <span className="text-graphite/60" aria-hidden>{i === configs.length - 1 ? "└─" : "├─"}</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const sample: [string, ReactNode][] = [
  ["Now", <>queue:work <code>--timeout=120</code>; <code>config/queue.php</code> has retry_after 90</>],
  ["Cost", "ExportInvoices (~100s) is handed to a second worker at 90s — duplicate exports and twice the report-query load."],
  ["Change", <><code>--timeout=80</code> here; run exports on a <code>long</code> connection (retry_after 330) with <code>--timeout=300</code>.</>],
  ["Gain", "No duplicate runs for jobs longer than 90s."],
  ["Risk", "Exports over 300s now fail instead of running twice — check real runtimes first."],
  ["Measure", "Duplicate ExportInvoices runs per day; p95 job runtime."],
]

function Sample() {
  return (
    <section id="sample" className="scroll-mt-14">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Heading eyebrow="Sample output · anonymized" title="What a finding looks like">
          Found by reading the worker config and the queue config side by side.
        </Heading>
        <Reveal delay={0.1}>
          <article className="mt-12 overflow-hidden rounded-lg border border-rule bg-white">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule px-6 py-4">
              <span className="flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-critical">
                <span className="size-1.5 rounded-full bg-critical" /> Critical
              </span>
              <h3 className="font-semibold text-ink">Long jobs run twice</h3>
              <span className="font-mono text-[13px] text-ink">
                deploy/supervisor/worker.conf:<span className="rounded-[2px] bg-marker px-0.5 font-semibold">4</span>
              </span>
              <span className="ml-auto font-mono text-[12px] text-graphite">§2 Queue & Horizon</span>
            </header>
            <dl className="divide-y divide-rule [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-ink">
              {sample.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-6 py-3.5 sm:grid-cols-[7rem_1fr] sm:gap-6">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.12em] text-graphite sm:pt-0.5">{k}</dt>
                  <dd className="text-[15px] leading-relaxed text-ink/85">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
          <a href={SAMPLE_URL} className="mt-5 inline-flex items-center gap-1.5 font-medium text-cobalt hover:underline">
            Read the full sample report <ArrowUpRight className="size-4" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}

mount(
  "home",
  <>
    <Hero />
    <Steps />
    <SectionIndex />
    <Severity />
    <Install />
    <Deliverables />
    <Sample />
  </>,
)
