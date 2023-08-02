import { Pose } from '@tensorflow-models/pose-detection'
import Side from '../../raiseHandProgress/Side'
import Position from '../../dotPlacer/Position'
import handMap from '../../handMap'
import never from 'never'

const getShoulderPosition = (pose: Pose, side: Side): Position => {
  const { x, y } = pose.keypoints[(handMap.get(side) ?? never()).shoulder]
  return { x, y }
}

export default getShoulderPosition
