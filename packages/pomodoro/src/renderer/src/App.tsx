import { FC } from 'react'
import { usePomodoro } from './hooks/use-pomodoro'
import { TimerDisplay } from './components/timer-display'
import { Controls } from './components/controls'
import { CycleIndicator } from './components/cycle-indicator'
import { Settings } from './components/settings'

const App: FC = () => {
  const {
    mode,
    timeLeft,
    isActive,
    cyclesCompleted,
    config,
    toggleTimer,
    resetTimer,
    updateConfig
  } = usePomodoro()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
        {/* Decorative Background Blur */}
        <div
          className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-700
          ${mode === 'work' ? 'bg-red-400' : mode === 'shortBreak' ? 'bg-green-400' : 'bg-blue-400'}`}
        />
        <div
          className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-700
          ${mode === 'work' ? 'bg-orange-400' : mode === 'shortBreak' ? 'bg-teal-400' : 'bg-indigo-400'}`}
        />

        <Settings config={config} onUpdate={updateConfig} />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Pomodoro Timer</h1>
          </div>

          <TimerDisplay timeLeft={timeLeft} totalTime={config[mode] * 60} mode={mode} />

          <Controls isActive={isActive} onToggle={toggleTimer} onReset={resetTimer} mode={mode} />

          <CycleIndicator completed={cyclesCompleted} total={4} />
        </div>
      </div>
    </div>
  )
}

export default App
