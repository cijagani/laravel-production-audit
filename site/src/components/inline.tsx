import { Fragment, type ReactNode } from "react"
import { REPO_URL } from "@/content"

// Inline Markdown used by CHANGELOG.md: `code`, **bold**, [links](url).
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = []
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  for (const m of text.matchAll(re)) {
    out.push(text.slice(last, m.index))
    if (m[1]) out.push(<code className="rounded bg-background/60 px-1 py-0.5 font-mono text-[0.85em] text-foreground">{m[1]}</code>)
    else if (m[2]) out.push(<strong className="font-semibold text-foreground">{m[2]}</strong>)
    // relative links in CHANGELOG.md are repo paths, not site paths
    else out.push(<a href={/^https?:/.test(m[4]) ? m[4] : `${REPO_URL}/blob/main/${m[4]}`} className="text-steel hover:underline">{m[3]}</a>)
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>
}
