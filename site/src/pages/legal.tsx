import type { ReactNode } from "react"
import { Eyebrow } from "@/components/shell"
import { mount } from "@/mount"
import { REPO_URL } from "@/content"

const UPDATED = "2026-10-03"
const CONTACT = "admin@corbitaltechnologies.com"

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-20">
      <h2 className="display text-[1.7rem] leading-none">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink/80">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, k) => (
        <li key={k} className="flex gap-3">
          <span aria-hidden className="mt-2.25 size-1.5 shrink-0 rounded-full bg-ink/30" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

const a = "font-medium text-cobalt hover:underline"
const code = "font-mono text-[0.88em] text-ink"

function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <header>
        <Eyebrow>Legal</Eyebrow>
        <h1 className="display text-[2.3rem] leading-[1.05] sm:text-[3.2rem]">Privacy &amp; terms</h1>
        <p className="mt-4 text-lg leading-relaxed text-graphite">
          The laravel-production-audit plugin for Claude Code, by Corbital Technologies. Last updated{" "}
          <time className="font-mono text-[0.9em]">{UPDATED}</time>.
        </p>
      </header>

      <Section id="privacy" title="Privacy policy">
        <p>
          The plugin is Markdown instructions and text templates. It has no code that runs, no telemetry, no
          analytics, and no accounts. We collect nothing.
        </p>
        <Bullets
          items={[
            <>
              <strong>Reads:</strong> files in the Laravel project you run it in, on your machine, through Claude
              Code. It reads <code className={code}>.env.example</code>, never <code className={code}>.env</code>.
            </>,
            <>
              <strong>Writes:</strong> <code className={code}>PERF_AUDIT_REPORT.md</code> and a{" "}
              <code className={code}>PERF_CONFIGS/</code> folder in that project. Nothing else unless you ask.
            </>,
            <>
              <strong>Sends:</strong> nothing. Claude Code itself sends your conversation, including file content
              Claude reads, to Anthropic to run the model; that is covered by{" "}
              <a href="https://www.anthropic.com/legal/privacy" className={a}>Anthropic&apos;s privacy policy</a>, not
              this one.
            </>,
            <>
              <strong>Laravel Boost:</strong> if your project already has Boost connected, the audit may use its
              docs search, which sends a topic query (never your code or data) to Laravel&apos;s docs service under
              Laravel&apos;s own policies.
            </>,
            <>
              <strong>This website:</strong> static pages on GitHub Pages with self-hosted fonts, no cookies and no
              analytics. GitHub may log visits as described in the{" "}
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" className={a}>
                GitHub privacy statement
              </a>
              .
            </>,
          ]}
        />
      </Section>

      <Section id="terms" title="Terms of use">
        <Bullets
          items={[
            <>
              The plugin is free and open source under the{" "}
              <a href={`${REPO_URL}/blob/main/LICENSE`} className={a}>MIT license</a>, which is the full licence
              for using, copying, and changing it.
            </>,
            <>
              It is provided as is, without warranty. Audit findings and config files are recommendations: review
              and test them before applying them to production. You are responsible for changes you make.
            </>,
            <>
              Using it also means using Claude Code (and Laravel Boost, if connected), each under its own terms.
            </>,
            <>
              Not affiliated with or endorsed by Laravel or Anthropic. Laravel is a trademark of Laravel Holdings
              Inc.
            </>,
          ]}
        />
      </Section>

      <Section id="contact" title="Contact">
        <p>
          Questions about this page: <a href={`mailto:${CONTACT}`} className={a}>{CONTACT}</a>. Bugs and requests:{" "}
          <a href={`${REPO_URL}/issues`} className={a}>GitHub issues</a>. Changes to this page are listed in the
          changelog.
        </p>
      </Section>
    </div>
  )
}

mount("legal", <LegalPage />)
