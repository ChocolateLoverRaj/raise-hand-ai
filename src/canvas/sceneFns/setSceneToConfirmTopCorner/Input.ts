import Position from '../../../dotPlacer/Position'
import Side from '../../../raiseHandProgress/Side'
import SetScene from '../../SetScene'

interface Input {
  setScene: SetScene
  bottomCornerRelativePosition: Position
  topCornerRelativePosition: Position
  raisedHand: Side
  goBack: () => void
}

export default Input
