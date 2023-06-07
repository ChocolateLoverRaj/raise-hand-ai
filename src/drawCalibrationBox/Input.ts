import { Pose } from '@tensorflow-models/pose-detection'
import Position from '../dotPlacer/Position'
import Side from '../raiseHandProgress/Side'

interface Input {
  ctx: CanvasRenderingContext2D
  pose: Pose
  bottomPointRelativePos: Position
  bottomPointSide: Side
  topPointRelativePos: Position | undefined
}

export default Input
