import { ReactNode } from 'react'
import TickInput from './TickInput'

interface SceneFns<T> {
  tick: (input: TickInput<T>) => T
  render: (data: T) => ReactNode
  cleanup: (data: T) => void
}

export default SceneFns
