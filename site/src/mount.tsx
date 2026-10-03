import { StrictMode, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { Shell, type Page } from "@/components/shell"
import "@/index.css"

export function mount(page: Page, content: ReactNode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Shell page={page}>{content}</Shell>
    </StrictMode>,
  )
}
