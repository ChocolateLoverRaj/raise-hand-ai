import { Pose } from '@tensorflow-models/pose-detection'
import Data from '../Data'
import Size from './Size'

interface Input {
  data: Data
  pose: Pose
  unscaledSize: Size
}

export default Input
