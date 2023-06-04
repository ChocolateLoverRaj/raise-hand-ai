import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  startTime: number
  totalTime: number
}

export default Props
