import { Pose } from '@tensorflow-models/pose-detection'
import Data from './Data'
import handMap from '../handMap'
import never from 'never'
import smallestEnclosingCircle from 'smallest-enclosing-circle'

const tick = (data: Data, pose: Pose): Data => {
  const { x, y } = pose.keypoints[(handMap.get(data.side) ?? never()).wrist]
  const newPositionEntries = [...data.positionEntries, {
    time: Date.now(),
    position: { x, y }
  }]
  // const circle = smallestEnclosingCircle(newPositionEntries.map(({ position }) => position))
  let shouldCancelTimeout = false
  while (smallestEnclosingCircle(newPositionEntries.map(({ position }) => position)).r > data.maxRadius) {
    if (newPositionEntries.shift() === data.earliestPositionEntry?.positionEntry) {
      shouldCancelTimeout = true
    }
  }
  let newEarliestPositionEntry = data.earliestPositionEntry
  if (data.earliestPositionEntry === undefined || shouldCancelTimeout) {
    clearTimeout(newEarliestPositionEntry?.timeoutId)
    newEarliestPositionEntry = {
      positionEntry: newPositionEntries[0],
      timeoutId: setTimeout(() => {
        data.onPlace(newPositionEntries[0].position)
      }, data.holdStillTime),
      startTime: Date.now()
    }
  }
  return {
    ...data,
    positionEntries: newPositionEntries,
    earliestPositionEntry: newEarliestPositionEntry
  }
}

export default tick
