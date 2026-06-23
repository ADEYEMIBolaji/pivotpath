'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-amber text-navy px-5 py-[10px] rounded-pp font-semibold text-[14px] hover:bg-amber/90 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 1h6v4H4zM2 5h10a1 1 0 011 1v4a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4 10v3h6v-3" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      Download PDF
    </button>
  )
}
