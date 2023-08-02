import { Pose } from '@tensorflow-models/pose-detection'
import Size from '../dotPlacer/tick/Size'
import SetScene from './SetScene'

interface TickInput<T> {
  data: T
  setScene: SetScene
  pose: Pose | undefined
  ctx: CanvasRenderingContext2D
  unscaledSize: Size
}

export default TickInput
