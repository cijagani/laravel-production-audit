import { reportLines } from "@/content"
import { cn } from "@/lib/utils"

const toneText: Record<string, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  ok: "text-ok",
}

export function ReportPanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-background/40 px-4 py-3">
        <span className="size-3 rounded-full bg-critical/80" />
        <span className="size-3 rounded-full bg-high/80" />
        <span className="size-3 rounded-full bg-ok/80" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          PERF_AUDIT_REPORT.md
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          laravel 13 · php 8.4
        </span>
      </div>

      {/* report body */}
      <div className="space-y-2.5 px-5 py-5 font-mono text-[13px] leading-relaxed">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>
            <span className="text-critical">2</span> critical
          </span>
          <span>
            <span className="text-high">3</span> high
          </span>
          <span>
            <span className="text-medium">4</span> medium
          </span>
          <span>
            <span className="text-ok">12</span> ok
          </span>
        </div>

        <div className="my-3 h-px bg-border" />

        {reportLines.map((l, i) => (
          <div key={i} className="flex gap-2.5">
            <span aria-hidden className="shrink-0">
              {l.glyph}
            </span>
            <span className="min-w-0">
              {l.loc && (
                <span className={cn("font-medium", toneText[l.tone])}>
                  {l.loc}{" "}
                </span>
              )}
              <span className="text-foreground/85">{l.text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
