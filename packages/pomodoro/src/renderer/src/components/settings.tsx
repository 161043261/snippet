import React, { useState } from 'react'
import { X, Settings as SettingsIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TimerConfig } from '../types'

interface SettingsProps {
  config: TimerConfig
  onUpdate: (newConfig: TimerConfig) => void
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState(config)

  const handleChange = (key: keyof TimerConfig, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0) {
      setLocalConfig({ ...localConfig, [key]: numValue })
    }
  }

  const handleSave = () => {
    onUpdate(localConfig)
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <SettingsIcon size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Timer Settings</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <label className="font-medium text-gray-600">Focus Duration</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localConfig.work}
                      onChange={(e) => handleChange('work', e.target.value)}
                      className="w-20 p-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <span className="text-gray-400 text-sm">min</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <label className="font-medium text-gray-600">Short Break</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localConfig.shortBreak}
                      onChange={(e) => handleChange('shortBreak', e.target.value)}
                      className="w-20 p-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                    <span className="text-gray-400 text-sm">min</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <label className="font-medium text-gray-600">Long Break</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localConfig.longBreak}
                      onChange={(e) => handleChange('longBreak', e.target.value)}
                      className="w-20 p-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <span className="text-gray-400 text-sm">min</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
