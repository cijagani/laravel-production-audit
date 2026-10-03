import { motion } from "motion/react"
import { ArrowRight, FileCode2, FolderCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AuditRun } from "@/components/audit-run"
import { CommandBlock } from "@/components/command-block"
import { Reveal } from "@/components/reveal"
import { Eyebrow } from "@/components/shell"
import { mount } from "@/mount"
import { configs, install, prompts, SAMPLE_URL, sections, stack, steps, VERSION } from "@/content"

const ease = [0.22, 1, 0.36, 1] as const
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(55%_100%_at_70%_0%,oklch(0.72_0.11_235/0.14),transparent)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <motion.div className="min-w-0" initial="hidden" animate="show" transition={{ staggerChildren: 0.09 }}>
          <motion.div variants={rise} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-ok" />
            Claude Code plugin · v{VERSION}
          </motion.div>
          <h1 className="font-heading text-[2.15rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl sm:whitespace-nowrap lg:text-[3.2rem] xl:text-[3.6rem]">
            <motion.span variants={rise} className="block">It reads your code,</motion.span>
            <motion.span variants={rise} className="block">
              then <span className="text-steel">cites it.</span>
            </motion.span>
          </h1>
          <motion.p variants={rise} className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            A production-readiness audit for existing Laravel apps. Every finding
            points at a real <span className="font-mono text-sm text-foreground">file:line</span>,
            and the audit ends with production config written for your app.
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#install">Install the plugin</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="sections.html">
                See all {sections.length} sections <ArrowRight className="size-4" />
              </a>
            </Button>
          </motion.div>
          <motion.ul variants={rise} className="mt-10 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground" aria-label="Supported stack">
            {stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <AuditRun />
        </motion.div>
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <Eyebrow>How an audit runs</Eyebrow>
          <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight">
            Read first. Prescribe second.
          </h2>
        </Reveal>
        <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* the line that connects the steps draws itself once, left to right */}
          <motion.span
            aria-hidden
            className="absolute left-0 right-0 top-[11px] hidden h-px origin-left bg-gradient-to-r from-steel/70 via-border to-border lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "0px 0px -120px 0px" }}
            transition={{ duration: 1.1, ease }}
          />
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative list-none"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease }}
            >
              <span className="relative z-10 grid size-6 place-items-center rounded-full border border-steel/60 bg-background font-mono text-[11px] text-steel">
                {i + 1}
              </span>
              <h3 className="mt-4 font-heading text-lg font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Sections() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{sections.length} sections · run all, or just one</Eyebrow>
            <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight">
              Every layer a production Laravel app gets wrong
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              The § numbers match the skill's own files. Sections with a tag run
              only when discovery finds what they audit.
            </p>
          </div>
          <a href="sections.html" className="inline-flex items-center gap-1.5 font-mono text-sm text-steel hover:underline">
            Full checklist <ArrowRight className="size-3.5" />
          </a>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) * 0.06} className="bg-card">
              <a
                href={`sections.html#s${s.n}`}
                className="group block h-full p-6 transition-colors hover:bg-accent/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <div className="mb-3 flex items-center justify-between gap-2 font-mono text-sm text-steel">
                  §{s.n.toString().padStart(2, "0")}
                  {s.when && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      if {s.when}
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-lg font-medium">
                  {s.title}
                  <ArrowRight className="ml-1.5 inline size-4 -translate-x-1 text-steel opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
              </a>
            </Reveal>
          ))}
          <div className="flex items-center justify-center bg-card/40 p-6 text-center sm:col-span-2 lg:col-span-1">
            <span className="text-sm text-muted-foreground">
              Read first.
              <br />
              Prescribe second.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Install() {
  return (
    <section id="install" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="min-w-0">
            <Eyebrow>Install</Eyebrow>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Two commands, then ask in plain English
            </h2>
            <p className="mt-3 text-muted-foreground">
              Add the marketplace and install the plugin. The skill starts when
              your request matches — no flags, no paths.
            </p>
            <ul className="mt-6 space-y-2.5">
              {prompts.map((p) => (
                <li key={p}>
                  <Card className="border-border/70 bg-card/50 p-4 text-sm text-foreground/90">“{p}”</Card>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="min-w-0 space-y-4">
            <CommandBlock label="Claude Code" lines={install.cc} />
            <CommandBlock label="CLI" lines={install.cli} />
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              or run it directly:
              <br />
              /laravel-production-audit:laravel-production-audit
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Deliverables() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <Eyebrow>What you get back</Eyebrow>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Two artifacts, written into your project
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full gap-0 border-border bg-card p-7">
              <div className="flex items-center gap-2 font-mono text-sm">
                <FileCode2 className="size-4 text-steel" /> PERF_AUDIT_REPORT.md
              </div>
              <p className="mt-3 text-muted-foreground">
                A hot-path map, then findings by severity, each citing a real{" "}
                <span className="font-mono text-sm text-foreground">file:line</span>.
                Critical and high findings show what the code does now, what it
                costs, the fix, the expected gain, the risk, and what to measure.
                It ends with a phased roadmap and a benchmark plan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["🔴 Critical", "text-critical"],
                  ["🟠 High", "text-high"],
                  ["🟡 Medium", "text-medium"],
                  ["✅ Leave as is", "text-ok"],
                ].map(([label, tone]) => (
                  <span key={label} className={`rounded-full border border-border bg-background/40 px-3 py-1 font-mono text-xs ${tone}`}>
                    {label}
                  </span>
                ))}
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="h-full gap-0 border-border bg-card p-7">
              <div className="flex items-center gap-2 font-mono text-sm">
                <FolderCog className="size-4 text-steel" /> PERF_CONFIGS/
              </div>
              <p className="mt-3 text-muted-foreground">
                Complete production files filled in from the findings. Every
                non-obvious line carries a{" "}
                <span className="font-mono text-sm text-foreground"># reason:</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {configs.map((c) => (
                  <span key={c} className="rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-xs text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Sample() {
  return (
    <section id="sample" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <Eyebrow>Sample output · anonymized</Eyebrow>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">What a finding looks like</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Found by reading the worker config and the queue config side by side,
            with its cost, fix, risk, and the number to watch.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="mt-10 overflow-hidden border-border bg-card p-0">
            <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed">
{`#### Long jobs run twice — `}<span className="text-critical">🔴</span>{` deploy/supervisor/worker.conf:4
- Now:       queue:work --timeout=120; config/queue.php retry_after 90
- Cost:      ExportInvoices (~100s) is handed to a 2nd worker at 90s
             → duplicate exports + 2× DB load on the hot path
- Change:    --timeout=80 here; run exports on a 'long' connection
             (retry_after 330) with a worker using --timeout=300
- Gain:      zero duplicate runs of jobs longer than 90s
- Risk:      exports >300s now time out — check real runtimes first
- Benchmark: duplicate ExportInvoices per day; p95 job runtime

## Leave As Is (✅)

`}<span className="text-ok">✅</span>{` Redis split into logical DBs — a cache flush can't drop the queue.
`}<span className="text-ok">✅</span>{` UserTableController: whitelisted sorts + capped per_page.
   Looks over-engineered; it's what keeps the query indexed.`}
            </pre>
          </Card>
          <a href={SAMPLE_URL} className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-steel hover:underline">
            Read the full sample report <ArrowRight className="size-3.5" />
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
    <Sections />
    <Install />
    <Deliverables />
    <Sample />
  </>,
)
