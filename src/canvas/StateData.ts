import Side from '../raiseHandProgress/Side'
import YesNoData from '../handYesNo/Data'
import Position from '../dotPlacer/Position'
import DotPlacerData from '../dotPlacer/Data'
import State from './State'

interface RaisedHand {
  startTime: number
  side: Side
}
type RaisedHands = {
  count: 2
} | {
  count: 1
  data: RaisedHand
} | {
  count: 0
}
interface BaseStateData {
  needsToLowerHand: boolean
}
type StateData = BaseStateData & ({
  state: State.RAISE_HAND
  data: RaisedHands
} | {
  state: State.CONFIRM_HAND
  data: YesNoData
} | {
  state: State.CALIBRATE_BOTTOM_CORNER
  data: {
    side: Side
    yesNo: YesNoData
    dotPlacer: DotPlacerData
  }
} | {
  state: State.CONFIRM_BOTTOM_CORNER
  data: {
    side: Side
    bottomCornerPosition: Position
    yesNo: YesNoData
  }
})

export default StateData
