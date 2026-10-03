import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { auditRuns, sections, type Severity } from "@/content"

const LINE = 28 // px — must match the `h-7` on each code line
const ROWS = Math.max(...auditRuns.map((r) => r.lines.length))
const ease = [0.22, 1, 0.36, 1] as const

const tone: Record<Severity, { text: string; dot: string; label: string }> = {
  critical: { text: "text-critical", dot: "bg-critical", label: "Critical" },
  high: { text: "text-high", dot: "bg-high", label: "High" },
  medium: { text: "text-medium", dot: "bg-medium", label: "Medium" },
}
const sectionTitle = (s: string) => sections.find((x) => `§${x.n}` === s)?.title ?? ""

type Phase = "scan" | "flag" | "cite"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * The page's thesis, acted out like an annotated drawing: a reading cursor
 * moves down the listing, a highlighter marks the line that's wrong, and a
 * leader line draws out to the note that cites it. Cycles through three files.
 * Paused, or with reduced motion, each file shows its finished annotation.
 */
export function AuditRun() {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("scan")
  const [scan, setScan] = useState(0)
  const [paused, setPaused] = useState(false)
  const [firstRun, setFirstRun] = useState(true)
  const card = useRef<HTMLDivElement>(null)
  const code = useRef<HTMLDivElement>(null)
  const [codeTop, setCodeTop] = useState(90)

  const run = auditRuns[idx]
  const hitIndex = run.hit - run.start
  const still = paused || !!reduce
  const shown: Phase = still ? "cite" : phase
  const t = tone[run.severity]

  // Where the code rows start inside the card, so the margin note lines up with the cited row.
  useLayoutEffect(() => {
    // + 4: the code area's pt-1 sits above the first row
    if (card.current && code.current) setCodeTop(code.current.offsetTop + card.current.clientTop + 4)
  }, [])

  useEffect(() => {
    if (still) return
    let cancelled = false
    ;(async () => {
      setPhase("scan")
      setScan(0)
      await wait(firstRun ? 1100 : 400)
      for (let i = 1; i <= hitIndex && !cancelled; i++) {
        await wait(170)
        if (!cancelled) setScan(i)
      }
      await wait(280)
      if (cancelled) return
      setPhase("flag")
      await wait(520)
      if (cancelled) return
      setPhase("cite")
      setFirstRun(false)
      await wait(4200)
      if (!cancelled) setIdx((i) => (i + 1) % auditRuns.length)
    })()
    return () => {
      cancelled = true
    }
    // firstRun is read once per file; re-running on its change would restart the scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, still, hitIndex])

  const cited = auditRuns.slice(0, idx + (shown === "cite" ? 1 : 0))
  const count = (s: Severity) => cited.filter((r) => r.severity === s).length

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      {/* ── the listing ── */}
      <div
        ref={card}
        className="relative min-w-0 overflow-hidden rounded-lg border border-rule bg-white shadow-[0_24px_48px_-28px_rgba(14,26,43,0.35)]"
      >
        <div className="flex h-11 items-stretch border-b border-rule bg-paper/60 pr-1.5">
          <div className="flex min-w-0 flex-1 overflow-x-auto" role="tablist" aria-label="Files being audited">
            {auditRuns.map((r, i) => (
              <button
                key={r.file}
                role="tab"
                aria-selected={i === idx}
                onClick={() => setIdx(i)}
                className={cn(
                  "relative shrink-0 border-r border-rule px-4 font-mono text-[12px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                  i === idx ? "bg-white text-ink" : "text-graphite hover:text-ink",
                )}
              >
                {r.file.split("/").pop()}
                {i === idx && (
                  <motion.span layoutId="audit-tab" className="absolute inset-x-0 top-0 h-0.5 bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
              </button>
            ))}
          </div>
          {!reduce && (
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play the audit animation" : "Pause the audit animation"}
              className="my-auto ml-1 rounded-md p-2 text-graphite transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          )}
        </div>

        <div className="flex h-9 items-center gap-2 px-4 font-mono text-[11.5px] text-graphite">
          <span className="text-cobalt">reading</span>
          <span className="truncate">{run.file}</span>
        </div>

        <div ref={code} className="relative overflow-x-auto pb-3 pt-1 font-mono text-[12.5px] sm:text-[13px]" style={{ minHeight: ROWS * LINE + 16 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={run.file} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="relative min-w-max">
              {shown === "scan" && (
                <motion.div
                  aria-hidden
                  className="absolute inset-x-0 h-7 bg-[#eef2f8]"
                  initial={false}
                  animate={{ y: scan * LINE }}
                  transition={{ type: "spring", stiffness: 600, damping: 45 }}
                >
                  <span className="absolute left-0 top-1 h-5 w-0.5 bg-cobalt" />
                </motion.div>
              )}
              {run.lines.map((text, i) => {
                const isHit = i === hitIndex && shown !== "scan"
                return (
                  <div key={i} className="relative flex h-7 items-center pr-6">
                    {isHit && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-[3px] left-11 right-2 origin-left rounded-[3px] bg-marker"
                        initial={still ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.45, ease }}
                      />
                    )}
                    <span className={cn("relative w-11 shrink-0 select-none pr-3 text-right", isHit ? cn("font-semibold", t.text) : "text-graphite/50")}>
                      {run.start + i}
                    </span>
                    <span className={cn("relative whitespace-pre", isHit ? "text-ink" : "text-ink/75")}>{text || " "}</span>
                  </div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex h-10 items-center justify-between border-t border-rule bg-paper/60 px-4 font-mono text-[11.5px] text-graphite">
          <span>
            file {idx + 1} / {auditRuns.length}
          </span>
          <span className="flex gap-4">
            {(["critical", "high"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", tone[s].dot)} />
                <span className="text-ink">{count(s)}</span> {s}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* ── the margin note ── */}
      <div className="relative min-w-0" style={{ "--note-top": `${codeTop + hitIndex * LINE}px` } as CSSProperties} aria-live="polite">
        <AnimatePresence mode="wait">
          {shown === "cite" && (
            <motion.div
              key={run.file}
              className="mt-4 flex items-start lg:absolute lg:inset-x-0 lg:top-(--note-top) lg:mt-0"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {/* leader line from the cited row to the note (wide screens only) */}
              <svg aria-hidden className="hidden h-7 w-12 shrink-0 overflow-visible lg:block" viewBox="0 0 48 28">
                <circle cx="0" cy="14" r="3.5" className="fill-ink" />
                <motion.path
                  d="M 0 14 H 48"
                  className="stroke-ink"
                  strokeWidth="1.25"
                  fill="none"
                  initial={still ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, ease }}
                />
              </svg>
              <motion.div
                className="min-w-0 flex-1 overflow-hidden rounded-md border border-ink/80 bg-white shadow-[0_16px_32px_-20px_rgba(14,26,43,0.4)]"
                initial={still ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: still ? 0 : 0.3, ease }}
              >
                <div className="flex h-7 items-center gap-2 border-b border-rule px-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                  <span className={cn("size-1.5 rounded-full", t.dot)} />
                  <span className={t.text}>{t.label}</span>
                  <span className="truncate text-graphite normal-case tracking-normal">
                    {run.section} · {sectionTitle(run.section)}
                  </span>
                </div>
                <div className="px-3.5 pb-3.5 pt-3">
                  <div className="font-mono text-[12.5px] text-ink">
                    {run.file}:<span className="rounded-[2px] bg-marker px-0.5 font-semibold">{run.hit}</span>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-snug text-ink/85">{run.finding}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
