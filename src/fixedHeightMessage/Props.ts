import { Key, ReactNode } from 'react'

interface Message {
  key: Key
  node: ReactNode
}

interface Props {
  messages: readonly Message[]
  messageToShow: Key | undefined
}

export default Props
