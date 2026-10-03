import { ArrowUpRight, FileCode2, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CommandBlock } from "@/components/command-block"
import { ReportPanel } from "@/components/report-panel"
import { configs, install, prompts, REPO_URL, sections } from "@/content"

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-steel">
      {children}
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <span className="font-mono text-sm font-medium">
            <span className="text-steel">~/</span>laravel-production-audit
          </span>
          <a
            href={REPO_URL}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            GitHub <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.72_0.11_235/0.16),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <Badge
              variant="outline"
              className="mb-6 border-border font-mono text-xs text-muted-foreground"
            >
              Claude Code plugin
            </Badge>
            <h1 className="font-heading text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              It reads your code,
              <br />
              then <span className="text-steel">cites it.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Point Claude at an existing Laravel app. Get back a severity-rated
              production-readiness report — every finding with a real{" "}
              <span className="font-mono text-sm text-foreground">file:line</span>{" "}
              — plus a folder of drop-in production config.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#install">
                  <Terminal className="size-4" /> Install
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#sample">See a real report</a>
              </Button>
            </div>
          </div>

          <ReportPanel />
        </div>
      </header>

      {/* ── Sections (§) ─────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>{sections.length} sections · run all, or just one</Eyebrow>
          <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight">
            Every layer a production Laravel app gets wrong
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            The § numbers are the actual workflow. Each section is a
            self-contained checklist you can run on its own. Tagged sections
            only run when discovery finds what they audit.
          </p>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <div key={s.n} className="bg-card p-6 transition hover:bg-accent/40">
                <div className="mb-3 flex items-center justify-between gap-2 font-mono text-sm text-steel">
                  §{s.n.toString().padStart(2, "0")}
                  {s.when && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      if {s.when}
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-lg font-medium">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.blurb}
                </p>
              </div>
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

      {/* ── Install ──────────────────────────────────────── */}
      <section id="install" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <Eyebrow>Install</Eyebrow>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Two commands, then ask in English
              </h2>
              <p className="mt-3 text-muted-foreground">
                Add the marketplace, install the plugin. The skill auto-triggers
                when your request matches — no flags, no path syntax.
              </p>
              <div className="mt-6 space-y-2.5">
                {prompts.map((p) => (
                  <Card
                    key={p}
                    className="border-border/70 bg-card/50 p-4 text-sm text-foreground/90"
                  >
                    “{p}”
                  </Card>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <CommandBlock label="Claude Code" lines={install.cc} />
              <CommandBlock label="CLI" lines={install.cli} />
              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                or invoke explicitly:
                <br />
                /laravel-production-audit:laravel-production-audit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deliverables ─────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>What you get back</Eyebrow>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Two artifacts, written into your project
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Card className="gap-0 border-border bg-card p-7">
              <div className="flex items-center gap-2 font-mono text-sm">
                <FileCode2 className="size-4 text-steel" />
                PERF_AUDIT_REPORT.md
              </div>
              <p className="mt-3 text-muted-foreground">
                A hot-path map, then findings grouped by severity, each citing a
                real{" "}
                <span className="font-mono text-sm text-foreground">file:line</span>.
                Critical and high findings show what the code does now, what it
                costs, the fix, expected gain, risk, and what to benchmark. Ends
                with a phased roadmap and a benchmark plan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["🔴 Critical", "text-critical"],
                  ["🟠 High", "text-high"],
                  ["🟡 Medium", "text-medium"],
                  ["✅ Leave as is", "text-ok"],
                ].map(([label, tone]) => (
                  <span
                    key={label}
                    className={`rounded-full border border-border bg-background/40 px-3 py-1 font-mono text-xs ${tone}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="gap-0 border-border bg-card p-7">
              <div className="flex items-center gap-2 font-mono text-sm">
                <Terminal className="size-4 text-steel" />
                PERF_CONFIGS/
              </div>
              <p className="mt-3 text-muted-foreground">
                Complete, production-ready files — populated from the findings,
                every non-obvious line carrying a{" "}
                <span className="font-mono text-sm text-foreground"># reason:</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {configs.map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-border/70 bg-background/40 px-2 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Sample ───────────────────────────────────────── */}
      <section id="sample" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>Sample output · anonymized</Eyebrow>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            What a finding actually looks like
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Not a vibe. A queue that no worker drains, found by reading the
            event class and the worker config. A timeout that outlives
            retry_after, with its cost, fix, risk, and the number to watch.
          </p>
          <Card className="mt-10 overflow-hidden border-border bg-card p-0">
            <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed">
{`## Critical Issues (🔴) — Fix Before Go-Live

`}<span className="text-critical">🔴</span>{` app/Events/InvoicePaid.php:18
   event sets queue = 'broadcasts' but the only worker
   drains 'default' → broadcasts silently never fire.
   `}<span className="text-muted-foreground">fix: add 'broadcasts' to the worker / Horizon supervisor</span>{`

#### Long jobs run twice — `}<span className="text-critical">🔴</span>{` deploy/supervisor/worker.conf:4
- Now:       queue:work --timeout=120; config/queue.php retry_after 90
- Cost:      ExportInvoices (~100s) is handed to a 2nd worker at 90s
             → duplicate exports + 2× DB load on the hot path
- Change:    --timeout=80 here; run exports on a 'long' connection
             (retry_after 330) with a worker using --timeout=300
- Gain:      zero duplicate runs of jobs longer than 90s
- Risk:      exports >300s now time out — check Horizon runtime first
- Benchmark: duplicate ExportInvoices per day; p95 job runtime

## Leave As Is (✅)

`}<span className="text-ok">✅</span>{` Redis split into logical DBs — a cache flush
   can't drop the queue.
`}<span className="text-ok">✅</span>{` UserTableController: whitelisted sorts + capped per_page.
   Looks over-engineered; it's what keeps the query indexed.`}
            </pre>
          </Card>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="font-mono text-sm text-muted-foreground">
            MIT · part of the{" "}
            <a href={REPO_URL} className="text-steel hover:underline">
              corbital-laravel-plugins
            </a>{" "}
            marketplace
          </div>
          <div className="text-xs text-muted-foreground">
            Works on any modern Laravel codebase. Not affiliated with the Laravel project.
          </div>
        </div>
      </footer>
    </div>
  )
}
