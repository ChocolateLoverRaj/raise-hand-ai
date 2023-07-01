import Data from '../Data'
import handMap from '../../handMap'
import never from 'never'
import smallestEnclosingCircle from 'smallest-enclosing-circle'
import Input from './Input'
import pointInPolygon from 'point-in-polygon'
import cleanup from '../cleanup'

const tick = ({ data, pose, boundaryRect }: Input): Data => {
  const { shoulder, wrist } = handMap.get(data.side) ?? never()
  const shoulderPoint = pose.keypoints[shoulder]
  const wristPoint = pose.keypoints[wrist]
  const relativeX = wristPoint.x - shoulderPoint.x
  const relativeY = wristPoint.y - shoulderPoint.y

  const newPositionEntries = [...data.positionEntries, {
    time: Date.now(),
    position: { x: relativeX, y: relativeY }
  }]
  let shouldCancelTimeout = false
  while ((() => {
    const circle = smallestEnclosingCircle(newPositionEntries.map(({ position }) => position))
    return (
      circle.r > data.maxRadius ||
      !pointInPolygon(
        [shoulderPoint.x + circle.x, shoulderPoint.y + circle.y],
        [
          [boundaryRect.pos1.x, boundaryRect.pos1.y],
          [boundaryRect.pos1.x, boundaryRect.pos2.y],
          [boundaryRect.pos2.x, boundaryRect.pos2.y],
          [boundaryRect.pos2.x, boundaryRect.pos1.y]
        ]
      )
    )
  })()) {
    if (newPositionEntries.shift() === data.earliestPositionEntry?.positionEntry) {
      shouldCancelTimeout = true
    }
    if (newPositionEntries.length === 0) {
      return cleanup(data)
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
