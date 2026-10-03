import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { auditRuns, glyph, type Severity } from "@/content"

const LINE = 24 // px — must match the `h-6` on each code line
const ROWS = Math.max(...auditRuns.map((r) => r.lines.length))

const tone: Record<Severity, { text: string; line: string; card: string }> = {
  critical: { text: "text-critical", line: "bg-critical/12 border-critical", card: "border-critical/40 bg-critical/8" },
  high: { text: "text-high", line: "bg-high/12 border-high", card: "border-high/40 bg-high/8" },
  medium: { text: "text-medium", line: "bg-medium/12 border-medium", card: "border-medium/40 bg-medium/8" },
}

type Phase = "scan" | "flag" | "cite"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * The hero's thesis, acted out: read a file line by line, stop on the line
 * that's wrong, then write the finding that cites it. Cycles through three
 * files. Paused, or with reduced motion, it shows each file's final state.
 */
export function AuditRun() {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("scan")
  const [scan, setScan] = useState(0)
  const [paused, setPaused] = useState(false)
  const [firstRun, setFirstRun] = useState(true)

  const run = auditRuns[idx]
  const hitIndex = run.hit - run.start
  const still = paused || reduce
  const shown: Phase = still ? "cite" : phase

  useEffect(() => {
    if (still) return
    let cancelled = false
    ;(async () => {
      setPhase("scan")
      setScan(0)
      await wait(firstRun ? 900 : 350)
      for (let i = 1; i <= hitIndex && !cancelled; i++) {
        await wait(150)
        if (!cancelled) setScan(i)
      }
      await wait(260)
      if (cancelled) return
      setPhase("flag")
      await wait(420)
      if (cancelled) return
      setPhase("cite")
      setFirstRun(false)
      await wait(3600)
      if (!cancelled) setIdx((i) => (i + 1) % auditRuns.length)
    })()
    return () => {
      cancelled = true
    }
    // firstRun is read once per file; re-running on its change would restart the scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, still, hitIndex])

  // Running tally: everything cited earlier in this loop, plus the current file once cited.
  const cited = auditRuns.slice(0, idx + (shown === "cite" ? 1 : 0))
  const count = (s: Severity) => cited.filter((r) => r.severity === s).length
  const t = tone[run.severity]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
      {/* chrome: file tabs double as the progress indicator and a manual control */}
      <div className="flex items-center gap-1 border-b border-border bg-background/40 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Audited files">
          {auditRuns.map((r, i) => (
            <button
              key={r.file}
              role="tab"
              aria-selected={i === idx}
              onClick={() => setIdx(i)}
              className={cn(
                "relative shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                i === idx ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.file.split("/").pop()}
              {i === idx && (
                <motion.span
                  layoutId="audit-tab"
                  className="absolute inset-x-2 -bottom-1.5 h-px bg-steel"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
        {!reduce && (
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play the audit animation" : "Pause the audit animation"}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          </button>
        )}
      </div>

      <div className="px-4 pt-3 font-mono text-[11px] text-muted-foreground">
        <span className="text-steel">reading</span> {run.file}
      </div>

      {/* code */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={run.file}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative mt-2 overflow-x-auto px-2 font-mono text-[12.5px] sm:text-[13px]"
          style={{ minHeight: ROWS * LINE }}
        >
          {shown === "scan" && (
            <motion.div
              aria-hidden
              className="absolute inset-x-2 h-6 rounded-sm border-l-2 border-steel bg-steel/10"
              initial={false}
              animate={{ y: scan * LINE }}
              transition={{ type: "spring", stiffness: 600, damping: 45 }}
            />
          )}
          {run.lines.map((code, i) => {
            const isHit = i === hitIndex && shown !== "scan"
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-6 items-center rounded-sm border-l-2 border-transparent pr-3 transition-colors duration-300",
                  isHit && t.line,
                )}
              >
                <span className="w-9 shrink-0 select-none pr-3 text-right text-muted-foreground/60">
                  {run.start + i}
                </span>
                <span className={cn("whitespace-pre", isHit ? "text-foreground" : "text-foreground/70")}>
                  {code || " "}
                </span>
                {isHit && (
                  <motion.span
                    aria-hidden
                    className="ml-auto pl-3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  >
                    {glyph[run.severity]}
                  </motion.span>
                )}
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* the finding it writes */}
      <div className="min-h-[120px] px-3 pb-3 pt-3" aria-live="polite">
        <AnimatePresence mode="wait">
          {shown === "cite" && (
            <motion.div
              key={run.file}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn("rounded-lg border px-3.5 py-2.5 font-mono text-[12.5px] leading-relaxed", t.card)}
            >
              <div className="flex flex-wrap items-center gap-x-2">
                <span aria-hidden>{glyph[run.severity]}</span>
                <span className={cn("font-medium", t.text)}>
                  {run.file}:{run.hit}
                </span>
                <span className="text-muted-foreground">{run.section}</span>
              </div>
              <div className="mt-1 text-foreground/90">{run.finding}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* tally */}
      <div className="flex items-center justify-between border-t border-border bg-background/30 px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
        <span>
          file {idx + 1} of {auditRuns.length}
        </span>
        <span className="flex gap-3">
          {(["critical", "high"] as const).map((s) => (
            <span key={s}>
              <span className={tone[s].text}>{count(s)}</span> {s}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
