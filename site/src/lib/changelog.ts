// A deliberately tiny renderer for CHANGELOG.md — it only needs what that file
// uses: release headings, sub-headings, paragraphs, bullets with wrapped lines,
// and inline `code`, **bold**, and [links](url).
// ponytail: not a general Markdown parser; swap in one if the changelog grows tables.

export type Release = { version: string; date: string; blocks: Block[] }
type Block = { kind: "p"; text: string } | { kind: "h"; text: string } | { kind: "ul"; items: string[] }

export function parseChangelog(md: string): Release[] {
  const releases: Release[] = []
  let cur: Release | null = null
  let para: string[] = []
  let list: string[] | null = null

  const flush = () => {
    if (!cur) return
    if (para.length) cur.blocks.push({ kind: "p", text: para.join(" ") })
    if (list) cur.blocks.push({ kind: "ul", items: list })
    para = []
    list = null
  }

  for (const line of md.split(/\r?\n/)) {
    const release = line.match(/^## \[(.+?)\]\s*[—-]\s*(.+)$/)
    if (release) {
      flush()
      cur = { version: release[1], date: release[2].trim(), blocks: [] }
      releases.push(cur)
    } else if (!cur || line.startsWith("# ")) {
      continue // preamble before the first release
    } else if (line.startsWith("### ")) {
      flush()
      cur.blocks.push({ kind: "h", text: line.slice(4) })
    } else if (line.startsWith("- ")) {
      if (para.length) flush()
      ;(list ??= []).push(line.slice(2))
    } else if (/^\s{2,}\S/.test(line) && list) {
      list[list.length - 1] += " " + line.trim()
    } else if (line.trim() === "") {
      flush()
    } else {
      if (list) flush()
      para.push(line.trim())
    }
  }
  flush()
  return releases
}
