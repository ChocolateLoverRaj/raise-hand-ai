import { Pose } from '@tensorflow-models/pose-detection'
import Side from '../../raiseHandProgress/Side'
import Position from '../Position'

interface Input {
  ctx: CanvasRenderingContext2D
  pose: Pose
  side: Side
  bottomCornerRelativePos: Position
}

export default Input
