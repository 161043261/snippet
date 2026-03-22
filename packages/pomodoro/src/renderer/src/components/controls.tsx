import React from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface ControlsProps {
  isActive: boolean
  onToggle: () => void
  onReset: () => void
  mode: string
}

const modeColors: Record<string, string> = {
  work: 'bg-red-500 hover:bg-red-600',
  shortBreak: 'bg-green-500 hover:bg-green-600',
  longBreak: 'bg-blue-500 hover:bg-blue-600'
}

export const Controls: React.FC<ControlsProps> = ({ isActive, onToggle, onReset, mode }) => {
  return (
    <div className="flex items-center gap-6 mt-8">
      <button
        onClick={onToggle}
        className={`p-4 rounded-full text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${modeColors[mode]}`}
        aria-label={isActive ? 'Pause' : 'Start'}
      >
        {isActive ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
      </button>

      <button
        onClick={onReset}
        className="p-4 rounded-full bg-gray-200 text-gray-600 shadow-md hover:bg-gray-300 transition-all transform hover:scale-105 active:scale-95"
        aria-label="Reset"
      >
        <RotateCcw size={32} />
      </button>
    </div>
  )
}
