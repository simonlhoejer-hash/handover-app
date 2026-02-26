'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import HandoverPage from '@/components/handover/HandoverPage'
import MaterialeView from './MaterialeView'

type Props = {
  parti: string
}

export default function PartiTabs({ parti }: Props) {
  const [page, setPage] = useState(0) // 0 = overlevering, 1 = materiale

  return (
    <div className="relative w-full overflow-hidden">

      {/* SLIDER TRACK */}
      <motion.div
        className="flex w-[200%]"
        animate={{ x: page === 0 ? '0%' : '-50%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100) setPage(1)
          if (info.offset.x > 100) setPage(0)
        }}
      >
        <div className="w-1/2">
          <HandoverPage
            department="galley"
            itemName={parti}
          />
        </div>

        <div className="w-1/2">
          <MaterialeView
            department="galley"
            parti={parti}
          />
        </div>
      </motion.div>

      {/* FIXED VIEWPORT ARROWS */}
      {page === 0 && (
        <button
          onClick={() => setPage(1)}
          className="
            hidden md:flex
            fixed right-6 top-1/2 -translate-y-1/2
            z-50
            w-14 h-14
            items-center justify-center
            rounded-full
            bg-white/80 dark:bg-white/10
            backdrop-blur
            shadow-xl
            hover:scale-110
            transition
          "
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {page === 1 && (
        <button
          onClick={() => setPage(0)}
          className="
            hidden md:flex
            fixed left-6 top-1/2 -translate-y-1/2
            z-20
            w-14 h-14
            items-center justify-center
            rounded-full
            bg-white/80 dark:bg-white/10
            backdrop-blur
            shadow-xl
            hover:scale-110
            transition
          "
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}
{/* PAGE INDICATOR */}
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
  <div
    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
      page === 0
        ? 'bg-gray-900 dark:bg-white scale-110'
        : 'bg-gray-400/40 dark:bg-white/30'
    }`}
  />
  <div
    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
      page === 1
        ? 'bg-gray-900 dark:bg-white scale-110'
        : 'bg-gray-400/40 dark:bg-white/30'
    }`}
  />
</div>
    </div>
  )
}   