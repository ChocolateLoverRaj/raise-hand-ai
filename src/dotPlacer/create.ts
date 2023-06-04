import Side from '../raiseHandProgress/Side'
import Data from './Data'
import OnPlace from './OnPlace'

const create = (maxRadius: number, side: Side, holdStillTime: number, onPlace: OnPlace): Data => ({
  maxRadius,
  positionEntries: [],
  side,
  earliestPositionEntry: undefined,
  holdStillTime,
  onPlace
})

export default create
