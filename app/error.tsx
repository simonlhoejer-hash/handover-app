'use client'

import AppErrorPanel from '@/components/errors/AppErrorPanel'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <AppErrorPanel error={error} reset={reset} />
}
