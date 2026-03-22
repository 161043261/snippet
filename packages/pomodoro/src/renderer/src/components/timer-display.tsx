import React from 'react'
import { motion } from 'framer-motion'
import { formatTime } from '../utils/time'
import type { TimerMode } from '../types'

interface TimerDisplayProps {
  timeLeft: number
  totalTime: number
  mode: TimerMode
}

const modeColors: Record<TimerMode, string> = {
  work: 'text-red-500 stroke-red-500',
  shortBreak: 'text-green-500 stroke-green-500',
  longBreak: 'text-blue-500 stroke-blue-500'
}

const modeLabels: Record<TimerMode, string> = {
  work: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break'
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, totalTime, mode }) => {
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / totalTime
  const dashoffset = circumference * (1 - progress)

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* SVG Circle */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
          {/* Background Circle */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            className="stroke-gray-200"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="130"
            cy="130"
            r={radius}
            className={`${modeColors[mode]} transition-colors duration-500`}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        {/* Time Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-2xl font-medium mb-2 uppercase tracking-widest ${modeColors[mode].split(' ')[0]}`}
          >
            {modeLabels[mode]}
          </motion.div>
          <div className="text-6xl font-bold text-gray-800 font-mono">{formatTime(timeLeft)}</div>
        </div>
      </div>
    </div>
  )
}
