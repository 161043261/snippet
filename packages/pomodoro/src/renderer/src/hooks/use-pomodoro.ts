import { useState, useEffect, useRef, useCallback } from 'react'
import type { TimerConfig, TimerMode } from '../types'

const DEFAULT_CONFIG: TimerConfig = {
  work: 25,
  shortBreak: 5,
  longBreak: 15
}

export const usePomodoro = () => {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG)
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(config.work * 60)
  const [isActive, setIsActive] = useState(false)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const switchMode = useCallback(() => {
    let nextMode: TimerMode = 'work'

    if (mode === 'work') {
      const nextCycles = cyclesCompleted + 1
      setCyclesCompleted(nextCycles)

      if (nextCycles > 0 && nextCycles % 4 === 0) {
        nextMode = 'longBreak'
        if (Notification.permission === 'granted') {
          new Notification('Time for a long break!', {
            body: 'You completed 4 cycles. Take 15 minutes.'
          })
        }
      } else {
        nextMode = 'shortBreak'
        if (Notification.permission === 'granted') {
          new Notification('Time for a break!', {
            body: 'Good job! Take 5 minutes.'
          })
        }
      }
    } else if (mode === 'longBreak') {
      // After long break, reset cycles
      nextMode = 'work'
      setCyclesCompleted(0)
      if (Notification.permission === 'granted') {
        new Notification('Back to work!', {
          body: 'Long break is over. Fresh start!'
        })
      }
    } else {
      // Short break
      nextMode = 'work'
      if (Notification.permission === 'granted') {
        new Notification('Back to work!', {
          body: 'Break is over. Focus time!'
        })
      }
    }

    setMode(nextMode)
    setTimeLeft(config[nextMode] * 60)
    setIsActive(false)
  }, [mode, cyclesCompleted, config])

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000) as unknown as number
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, timeLeft])

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      // Use setTimeout to defer the state update to the next tick, avoiding the synchronous update warning
      // This breaks the "synchronous" chain.
      const timeoutId = setTimeout(() => {
        setIsActive(false)
        switchMode()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [timeLeft, isActive, switchMode])

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(config[mode] * 60)
  }

  const updateConfig = (newConfig: TimerConfig) => {
    setConfig(newConfig)
    if (!isActive) {
      setTimeLeft(newConfig[mode] * 60)
    }
  }

  return {
    mode,
    timeLeft,
    isActive,
    cyclesCompleted,
    config,
    toggleTimer,
    resetTimer,
    updateConfig
  }
}
