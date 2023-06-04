import { Pose } from '@tensorflow-models/pose-detection'
import Side from '../raiseHandProgress/Side'
import handMap from '../handMap'
import never from 'never'
import drawWithPosition from './drawWithPosition'

const drawWithPose = (ctx: CanvasRenderingContext2D, pose: Pose, side: Side): void => {
  const { x, y } = pose.keypoints[(handMap.get(side) ?? never()).wrist]
  drawWithPosition(ctx, { x, y })
}

export default drawWithPose
