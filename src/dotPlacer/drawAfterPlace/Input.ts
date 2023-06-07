import { Pose } from '@tensorflow-models/pose-detection'
import Position from '../Position'
import Side from '../../raiseHandProgress/Side'

interface Input {
  ctx: CanvasRenderingContext2D
  relativePosition: Position
  pose: Pose
  side: Side
}

export default Input
