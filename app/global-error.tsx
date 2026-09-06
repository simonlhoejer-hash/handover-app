'use client'

import AppErrorPanel from '@/components/errors/AppErrorPanel'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="da">
      <body>
        <AppErrorPanel error={error} reset={reset} />
      </body>
    </html>
  )
}
