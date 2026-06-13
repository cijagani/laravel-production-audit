import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

export function CommandBlock({
  label,
  lines,
}: {
  label: string
  lines: string[]
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card/60 font-mono text-sm">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <button
          onClick={copy}
          aria-label={`Copy ${label} commands`}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-ok" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto px-4 py-3.5">
        {lines.map((l, i) => (
          <div key={i} className={cn("whitespace-pre", i > 0 && "mt-1.5")}>
            <span className="select-none text-steel">$ </span>
            <span className="text-foreground">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
