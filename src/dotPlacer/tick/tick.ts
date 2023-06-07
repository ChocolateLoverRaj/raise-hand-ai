import Data from '../Data'
import handMap from '../../handMap'
import never from 'never'
import smallestEnclosingCircle from 'smallest-enclosing-circle'
import Input from './Input'
import isPointIn from '@pelevesque/is-point-in'
import cleanup from '../cleanup'

const tick = ({ data, pose, unscaledSize }: Input): Data => {
  const { shoulder, wrist } = handMap.get(data.side) ?? never()
  const shoulderPoint = pose.keypoints[shoulder]
  const wristPoint = pose.keypoints[wrist]
  if (
    !isPointIn.rectangle(shoulderPoint.x, shoulderPoint.y, 0, 0, unscaledSize.width, unscaledSize.height) ||
    !isPointIn.rectangle(wristPoint.x, wristPoint.y, 0, 0, unscaledSize.width, unscaledSize.height)
  ) {
    return cleanup(data)
  }
  const relativeX = wristPoint.x - shoulderPoint.x
  const relativeY = wristPoint.y - shoulderPoint.y

  const newPositionEntries = [...data.positionEntries, {
    time: Date.now(),
    position: { x: relativeX, y: relativeY }
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
