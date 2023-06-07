import Side from '../raiseHandProgress/Side'
import YesNoData from '../handYesNo/Data'
import Position from '../dotPlacer/Position'
import DotPlacerData from '../dotPlacer/Data'
import Scene from './Scene'

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
  state: Scene.RAISE_HAND
  data: RaisedHands
} | {
  state: Scene.CONFIRM_HAND
  data: YesNoData
} | {
  state: Scene.CALIBRATE_BOTTOM_CORNER
  data: {
    side: Side
    yesNo: YesNoData
    dotPlacer: DotPlacerData
  }
} | {
  state: Scene.CONFIRM_BOTTOM_CORNER
  data: {
    side: Side
    bottomCornerPosition: Position
    yesNo: YesNoData
  }
})

export default StateData
