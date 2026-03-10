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
    <div className="w-full">

      {/* PAGE INDICATOR – MOBILE ONLY */}
      <div className="flex justify-center gap-2 mt-4 mb-4 md:hidden">
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

      {/* SLIDER WRAPPER */}
      <div className="relative overflow-hidden">

        <motion.div
          className="flex w-[200%]"
          animate={{ x: page === 0 ? '0%' : '-50%' }}
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
          drag="x"
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={(e, info) => {
            if (info.offset.x < -80) setPage(1)
            else if (info.offset.x > 80) setPage(0)
          }}
        >
          {/* OVERLEVERING */}
          <div className="w-1/2">
            <HandoverPage
              department="galley"
              itemName={parti}
            />
          </div>

          {/* MATERIALE */}
          <div className="w-1/2">
            <MaterialeView
              department="galley"
              parti={parti}
            />
          </div>
        </motion.div>

      </div>

      {/* DESKTOP ARROWS */}
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
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

    </div>
  )
}