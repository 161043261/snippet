import React from 'react'
import { motion } from 'framer-motion'

interface CycleIndicatorProps {
  completed: number
  total: number
}

export const CycleIndicator: React.FC<CycleIndicatorProps> = ({ completed, total }) => {
  return (
    <div className="flex flex-col items-center mt-6 text-gray-500 text-sm">
      <div className="mb-2 uppercase tracking-wide">Cycles</div>
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: i < completed ? 1.2 : 0.8,
              opacity: i < completed ? 1 : 0.3,
              backgroundColor: i < completed ? '#EF4444' : '#E5E7EB' // Red for work cycles
            }}
            className="w-3 h-3 rounded-full bg-gray-200 transition-colors duration-300"
          />
        ))}
      </div>
      <div className="mt-2 text-xs font-mono opacity-60">
        {completed}/{total}
      </div>
    </div>
  )
}
