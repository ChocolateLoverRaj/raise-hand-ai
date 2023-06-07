import Input from './Input'
import handMap from '../../handMap'
import never from 'never'
import internalDraw from '../internalDraw/internalDraw'

const drawAfterPlace = ({ ctx, relativePosition, pose, side }: Input): void => {
  const shoulderPoint = pose.keypoints[(handMap.get(side) ?? never()).shoulder]
  internalDraw({
    ctx,
    relativePosition,
    shoulderPosition: {
      x: shoulderPoint.x,
      y: shoulderPoint.y
    }
  })
}

export default drawAfterPlace
