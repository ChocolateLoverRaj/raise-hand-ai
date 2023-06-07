import { Pose } from '@tensorflow-models/pose-detection'
import Side from '../../raiseHandProgress/Side'

interface Input {
  ctx: CanvasRenderingContext2D
  pose: Pose
  side: Side
}

export default Input
