import { Pose } from '@tensorflow-models/pose-detection'
import Data from './Data'
import never from 'never'
import handMap from '../handMap'
import Side from '../raiseHandProgress/Side'
import resetTimeout from './resetTimeout'

const tick = (data: Data, setData: (newData: Data) => void, pose: Pose): void => {
  const faceY = pose.keypoints3D?.[0].y ?? never()
  const raisedHands = new Map([...handMap].map(([side, { wrist }]) => {
    const { y } = pose.keypoints3D?.[wrist] ?? never()
    return [side, y < faceY]
  }))
  const setNotRaised = (): void => {
    if (data.raised) {
      resetTimeout(data)
      setData({
        ...data,
        raised: false
      })
    }
  }
  if ((raisedHands.get(Side.LEFT) ?? never()) && (raisedHands.get(Side.RIGHT) ?? never())) {
    setNotRaised()
  } else {
    const raisedHand = [...raisedHands].find(([, raised]) => raised)?.[0]
    if (raisedHand !== undefined) {
      if (!data.raised || data.raisedData.side !== raisedHand) {
        resetTimeout(data)
        setData({
          ...data,
          raised: true,
          raisedData: {
            side: raisedHand,
            startTime: Date.now()
          }
        })
        data.timeoutId = setTimeout(() => {
          data.onResult(raisedHand === data.yesHand)
        }, data.raiseTime)
      }
    } else {
      setNotRaised()
    }
  }
}

export default tick
