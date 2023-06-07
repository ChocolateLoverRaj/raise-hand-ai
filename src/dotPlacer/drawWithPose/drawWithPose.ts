import handMap from '../../handMap'
import never from 'never'
import internalDraw from '../internalDraw/internalDraw'
import Input from './Input'

const drawWithPose = ({ ctx, pose, side }: Input): void => {
  const { shoulder, wrist } = handMap.get(side) ?? never()
  const shoulderPoint = pose.keypoints[shoulder]
  const wristPoint = pose.keypoints[wrist]
  const relativeX = wristPoint.x - shoulderPoint.x
  const relativeY = wristPoint.y - shoulderPoint.y

  internalDraw({
    ctx,
    relativePosition: {
      x: relativeX,
      y: relativeY
    },
    shoulderPosition: {
      x: shoulderPoint.x,
      y: shoulderPoint.y
    }
  })
}

export default drawWithPose
