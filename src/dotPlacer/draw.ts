import { Pose } from '@tensorflow-models/pose-detection'
import Side from '../raiseHandProgress/Side'
import target from './target.svg'
import handMap from '../handMap'
import never from 'never'

const draw = (ctx: CanvasRenderingContext2D, pose: Pose, side: Side): void => {
  const img = new Image()
  img.src = target
  const { x, y } = pose.keypoints[(handMap.get(side) ?? never()).wrist]
  ctx.drawImage(img, x - 50 / 2, y - 50 / 2, 50, 50)
}

export default draw
