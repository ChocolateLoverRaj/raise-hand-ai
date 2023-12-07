import SceneFns from '../SceneFns'
import never from 'never'
import handMap from '../../handMap'
import Side from '../../raiseHandProgress/Side'
import * as Tone from 'tone'
import createYesNo from '../../handYesNo/create'
import createDotPlacer from '../../dotPlacer/create'
import RaiseHandProgress from '../../raiseHandProgress/RaiseHandProgress'
import Scene from '../Scene'
import { raiseHandTime, stayStillRadius, stayStillTime } from '../../config'
import cleanupDotPlacer from '../../dotPlacer/cleanup'
import cleanupYesNo from '../../handYesNo/cleanup'
import Heading from '../Heading'
import setSceneToConfirmTopCorner from './setSceneToConfirmTopCorner/setSceneToConfirmTopCorner'

interface RaisedHand {
  startTime: number
  side: Side
}
interface BaseData {
  raiseHandTimeout: any | undefined
}
type Data = BaseData & ({
  count: 2
} | {
  count: 1
  data: RaisedHand
} | {
  count: 0
})
const clearRaiseHandTimeout = (data: Data): Data => {
  clearTimeout(data.raiseHandTimeout)
  return {
    ...data,
    raiseHandTimeout: undefined
  }
}

const raiseHandSceneFns: SceneFns<Data> = {
  tick: ({ data, setScene, pose }) => {
    if (pose === undefined || (pose.score !== undefined && pose.score < 0.5)) return data

    const faceY = pose.keypoints3D?.[0].y ?? never()
    const raisedHands = new Map([...handMap].map(([side, { wrist }]) => {
      const { y } = pose.keypoints3D?.[wrist] ?? never()
      return [side, y < faceY]
    }))
    if ((raisedHands.get(Side.LEFT) ?? never()) && (raisedHands.get(Side.RIGHT) ?? never())) {
      return {
        ...clearRaiseHandTimeout(data),
        count: 2
      }
    } else {
      const raisedHand = [...raisedHands].find(([, raised]) => raised)?.[0]
      if (raisedHand !== undefined) {
        if (data.count !== 1 || data.data.side !== raisedHand) {
          const t = setTimeout(() => {
            const synth = new Tone.Synth().toDestination()
            synth.triggerAttackRelease('D4', '4n')
            const setStateToConfirmHand = (): void => {
              const data = createYesNo(1000, raisedHand, yes => {
                if (yes) {
                  synth.triggerAttackRelease('F4', '4n')
                  const setStateToCalibrateBottomCorner = (): void => {
                    const dotPlacer = createDotPlacer(stayStillRadius, raisedHand, stayStillTime, bottomCornerRelativePosition => {
                      synth.triggerAttackRelease('A4', '4n')
                      const setSceneToConfirmBottomCorner = (): void => {
                        setScene(Scene.CONFIRM_BOTTOM_CORNER, {
                          bottomCornerRelativePosition,
                          yesNo: createYesNo(1000, raisedHand, yes => {
                            if (yes) {
                              synth.triggerAttackRelease('C5', '4n')
                              const setSceneToCalibrateTopCorner = (): void => {
                                const yesNo = createYesNo(1000, raisedHand, () => {
                                  cleanupDotPlacer(dotPlacer)
                                  setSceneToConfirmBottomCorner()
                                }, true, false)
                                const dotPlacer = createDotPlacer(stayStillRadius, raisedHand, stayStillTime, topCornerRelativePosition => {
                                  synth.triggerAttackRelease('E5', '4n')
                                  cleanupYesNo(yesNo)
                                  setSceneToConfirmTopCorner({
                                    setScene,
                                    bottomCornerRelativePosition,
                                    goBack: setSceneToCalibrateTopCorner,
                                    raisedHand,
                                    topCornerRelativePosition
                                  })
                                })
                                setScene(Scene.CALIBRATE_TOP_CORNER, {
                                  side: raisedHand,
                                  bottomCornerRelativePosition,
                                  yesNo: yesNo,
                                  dotPlacer: dotPlacer
                                })
                              }
                              setSceneToCalibrateTopCorner()
                            } else {
                              setStateToCalibrateBottomCorner()
                            }
                          }, true, true),
                          side: raisedHand,
                          pos: undefined
                        })
                      }
                      setSceneToConfirmBottomCorner()
                    })
                    setScene(Scene.CALIBRATE_BOTTOM_CORNER, {
                      side: raisedHand,
                      yesNo: createYesNo(1000, raisedHand, () => {
                        setStateToConfirmHand()
                      }, true, false),
                      dotPlacer: dotPlacer
                    })
                  }
                  setStateToCalibrateBottomCorner()
                } else {
                  setScene(Scene.RAISE_HAND, { count: 0 })
                  const dist = new Tone.Volume(10).toDestination()
                  const synth = new Tone.Synth().connect(dist)
                  synth.triggerAttackRelease('C2', '4n')
                }
              }, true, true)
              setScene(Scene.CONFIRM_HAND, data)
            }
            setStateToConfirmHand()
          }, raiseHandTime)
          return {
            ...clearRaiseHandTimeout(data),
            raiseHandTimeout: t,
            count: 1,
            data: {
              side: raisedHand,
              startTime: Date.now()
            }
          }
        } else return data
      } else {
        return {
          ...clearRaiseHandTimeout(data),
          count: 0
        }
      }
    }
  },
  render: data => (
    <Heading>
      <h1>
        {new Map<number, string>([
          [0, 'Raise Hand Above Face to Continue'],
          [1, 'Keep your hand raised'],
          [2, 'Only raise one hand']
        ]).get(data.count) ?? never()}
      </h1>
      {/* The progress bar when u raise ur hand */}
      {data.count === 1 && (
        <RaiseHandProgress
          side={data.data.side}
          startTime={data.data.startTime}
          totalTime={raiseHandTime}
        />)}
    </Heading>),
  cleanup: clearRaiseHandTimeout
}

export default raiseHandSceneFns