import Link from 'next/link'

export default function SessionNotFound() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center gap-5">
      <p className="font-display text-[32px] font-medium text-offwhite">Session not found</p>
      <p className="text-[15px] text-pp-text-body max-w-md leading-[1.6]">
        This session may have expired or the link is invalid. Sessions are stored locally and may not survive a server restart.
      </p>
      <Link
        href="/onboarding"
        className="bg-amber text-navy px-6 py-3 rounded-pp font-semibold text-[14px] hover:bg-amber/90 transition-colors"
      >
        Start a new analysis
      </Link>
    </div>
  )
}
