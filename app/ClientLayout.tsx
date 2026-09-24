'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import HeaderTitle from '@/components/layout/HeaderTitle'
import ConnectionStatus from '@/components/pwa/ConnectionStatus'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'

const TABLET_HANDOVER_IDLE_TIMEOUT_MS = 10 * 60 * 1000

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [measurementKeyboardOpen, setMeasurementKeyboardOpen] = useState(false)
  const isFoodWasteMeasurement =
    /^\/(crown|pearl)\/food-waste\/[^/]+$/.test(pathname) &&
    !pathname.endsWith('/overblik')

  useEffect(() => {
    const returnToWasteRoute = pathname.match(
      /^\/(crown|pearl)(?:\/parti\/[^/]+|\/food-waste\/overblik)?$/
    )
    if (!returnToWasteRoute) return

    const hasTouch = navigator.maxTouchPoints > 1 || window.matchMedia('(pointer: coarse)').matches
    const tabletWidth = window.innerWidth >= 600 && window.innerWidth <= 1366
    if (!hasTouch || !tabletWidth) return

    const ship = returnToWasteRoute[1]
    let idleTimer = window.setTimeout(() => {
      window.location.replace(`/${ship}/food-waste`)
    }, TABLET_HANDOVER_IDLE_TIMEOUT_MS)

    const restartIdleTimer = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        window.location.replace(`/${ship}/food-waste`)
      }, TABLET_HANDOVER_IDLE_TIMEOUT_MS)
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'touchstart',
      'keydown',
      'input',
      'scroll',
    ]

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, restartIdleTimer, { passive: true })
    }

    return () => {
      window.clearTimeout(idleTimer)
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, restartIdleTimer)
      }
    }
  }, [pathname])

  useEffect(() => {
    if (!isFoodWasteMeasurement) return

    const isEditable = (element: Element | null) =>
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLElement && element.isContentEditable)

    const updateKeyboardState = () => {
      const editableFocused = isEditable(document.activeElement)
      const viewport = window.visualViewport
      const viewportIsReduced = viewport
        ? window.innerHeight - viewport.height > 140
        : false

      setMeasurementKeyboardOpen(editableFocused && (viewportIsReduced || document.hasFocus()))
    }

    const handleFocusOut = () => {
      window.setTimeout(updateKeyboardState, 100)
    }

    document.addEventListener('focusin', updateKeyboardState)
    document.addEventListener('focusout', handleFocusOut)
    window.visualViewport?.addEventListener('resize', updateKeyboardState)
    window.visualViewport?.addEventListener('scroll', updateKeyboardState)
    const initialCheck = window.requestAnimationFrame(updateKeyboardState)

    return () => {
      window.cancelAnimationFrame(initialCheck)
      document.removeEventListener('focusin', updateKeyboardState)
      document.removeEventListener('focusout', handleFocusOut)
      window.visualViewport?.removeEventListener('resize', updateKeyboardState)
      window.visualViewport?.removeEventListener('scroll', updateKeyboardState)
    }
  }, [isFoodWasteMeasurement])

  const hideChromeForKeyboard = isFoodWasteMeasurement && measurementKeyboardOpen
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/ships' ||
    pathname === '/galley' ||
    pathname === '/crown/adgang' ||
    pathname === '/pearl/adgang' ||
    pathname === '/crown/souschef' ||
    pathname === '/pearl/souschef' ||
    pathname.startsWith('/adgang/')

  if (isStandalonePage) {
    return (
      <>
        <ServiceWorkerRegistration />
        {children}
      </>
    )
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <ConnectionStatus />

      <div className="min-h-screen flex flex-col">
        {!hideChromeForKeyboard && <header
          className="
            w-full px-5 pt-3 pb-3 flex flex-col items-center
            bg-white/90 border-b border-[#0f4f4a]/10 backdrop-blur-xl
            dark:bg-[#073f3d]/90 dark:border-white/10 sticky top-0 z-30
          "
        >
          <HeaderTitle />
        </header>}

        <main className={`flex-1 w-full max-w-5xl mx-auto px-4 ${hideChromeForKeyboard ? 'pb-4' : 'pb-24'}`}>
          {children}
        </main>
      </div>

      {!hideChromeForKeyboard && <BottomNav />}
    </>
  )
}
