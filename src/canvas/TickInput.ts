import { Pose } from '@tensorflow-models/pose-detection'
import Size from '../dotPlacer/tick/Size'

interface TickInput<T> {
  data: T
  setScene: (scene: any, sceneData: any) => void
  pose: Pose | undefined
  ctx: CanvasRenderingContext2D
  unscaledSize: Size
}

export default TickInput
