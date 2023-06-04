import { ReactNode } from 'react'
import Data from './Data'
import * as Tone from 'tone'

interface Props {
  data: Data
  noNode: ReactNode
  yesNode: ReactNode
  yesFrequency: Tone.Unit.Frequency
}

export default Props
