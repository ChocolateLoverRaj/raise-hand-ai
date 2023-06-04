import Side from '../raiseHandProgress/Side'
import OnPlace from './OnPlace'

interface PositionEntry {
  position: { x: number, y: number}
  time: number
}

interface Data {
  positionEntries: PositionEntry[]
  maxRadius: number
  side: Side
  earliestPositionEntry: {
    positionEntry: PositionEntry
    timeoutId: any
    startTime: number
  } | undefined
  holdStillTime: number
  onPlace: OnPlace
}

export default Data
