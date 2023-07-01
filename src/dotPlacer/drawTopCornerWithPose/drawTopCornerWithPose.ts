import handMap from '../../handMap'
import never from 'never'
import Input from './Input'
import internalDrawTopCorner from '../internalDrawTopCorner/internalDrawTopCorner'

const drawTopCornerWithPose = ({ ctx, pose, side, bottomCornerRelativePos }: Input): void => {
  const { shoulder, wrist } = handMap.get(side) ?? never()
  const shoulderPoint = pose.keypoints[shoulder]
  const wristPoint = pose.keypoints[wrist]
  const relativeX = wristPoint.x - shoulderPoint.x
  const relativeY = wristPoint.y - shoulderPoint.y

  internalDrawTopCorner({
    ctx,
    relativePositionBottomCorner: bottomCornerRelativePos,
    relativePositionTopCorner: {
      x: relativeX,
      y: relativeY
    },
    shoulderPosition: {
      x: shoulderPoint.x,
      y: shoulderPoint.y
    }
  })
}

export default drawTopCornerWithPose
