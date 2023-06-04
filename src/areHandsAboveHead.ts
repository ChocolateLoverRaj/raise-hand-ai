import { Pose } from '@tensorflow-models/pose-detection'
import never from 'never'
import handMap from './handMap'

/**
 * Returns `true` if 1 or more hands are above head
 */
const areHandsAboveHead = (pose: Pose): boolean => {
  const faceY = pose.keypoints3D?.[0].y ?? never()
  const isAboveHead = [...handMap].some(([side, { wrist }]) => {
    const { y } = pose.keypoints3D?.[wrist] ?? never()
    return y < faceY
  })
  return isAboveHead
}

export default areHandsAboveHead
