import { Pose } from '@tensorflow-models/pose-detection'
import Data from './Data'
import never from 'never'
import handMap from '../handMap'
import Side from '../raiseHandProgress/Side'
import resetTimeout from './resetTimeout'

const tick = (data: Data, pose: Pose): Data => {
  const faceY = pose.keypoints3D?.[0].y ?? never()
  const raisedHands = new Map([...handMap].map(([side, { wrist }]) => {
    const { y } = pose.keypoints3D?.[wrist] ?? never()
    return [side, (side === data.yesHand ? data.canYes : data.canNo) && y < faceY]
  }))
  const setNotRaised = (): Data => {
    if (data.raised) {
      resetTimeout(data)
      return {
        ...data,
        raised: false
      }
    } else {
      return data
    }
  }
  if ((raisedHands.get(Side.LEFT) ?? never()) && (raisedHands.get(Side.RIGHT) ?? never())) {
    return setNotRaised()
  } else {
    const raisedHand = [...raisedHands].find(([, raised]) => raised)?.[0]
    if (raisedHand !== undefined) {
      if (!data.raised || data.raisedData.side !== raisedHand) {
        resetTimeout(data)
        const timeoutId = setTimeout(() => {
          data.onResult(raisedHand === data.yesHand)
        }, data.raiseTime)
        return {
          ...data,
          raised: true,
          raisedData: {
            side: raisedHand,
            startTime: Date.now()
          },
          timeoutId
        }
      }
    } else {
      return setNotRaised()
    }
  }
  return data
}

export default tick
