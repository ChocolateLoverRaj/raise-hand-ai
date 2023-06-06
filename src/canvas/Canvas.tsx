import { observer } from 'mobx-react-lite'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import never from 'never'
import repeatedAnimationFrame from '../repeatedAnimationFrame'
import { PoseDetector } from '@tensorflow-models/pose-detection'
import aspectFit from 'aspect-fit'
import handMap from '../handMap'
import Side from '../raiseHandProgress/Side'
import RaiseHandProgress from '../raiseHandProgress/RaiseHandProgress'
import { useFreshRef } from 'rooks'
import drawPoses from '../drawPoses'
import * as Tone from 'tone'
import sideNames from '../sideNames'
import HandYesNo from '../handYesNo/HandYesNo'
import createYesNo from '../handYesNo/create'
import cleanupYesNo from '../handYesNo/cleanup'
import tickHandYesNo from '../handYesNo/tick'
import areHandsAboveHead from '../areHandsAboveHead'
import drawWithPose from '../dotPlacer/drawWithPose'
import tickDotPlacer from '../dotPlacer/tick'
import createDotPlacer from '../dotPlacer/create'
import ProgressBar from '../handYesNo/progressBar/ProgressBar'
import YesSound from '../handYesNo/yesSound/YesSound'
import cleanupDotPlacer from '../dotPlacer/cleanup'
import drawWithPosition from '../dotPlacer/drawWithPosition'
import drawCalibrationBox from '../drawCalibrationBox/drawCalibrationBox'
import StateData from './StateData'
import State from './State'
import usePlayPromiseAndAutoResizeCanvas from './usePlayPromiseAndAutoResizeCanvas/usePlayPromiseAndAutoResizeCanvas'

export interface CanvasProps {
  detector: PoseDetector
  containerRef: MutableRefObject<HTMLDivElement | null>
}

const raiseHandTime = 1000
const stayStillTime = 2000
const stayStillRadius = 20

const Canvas = observer<CanvasProps>(({ detector }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const playPromise = usePlayPromiseAndAutoResizeCanvas({
    canvasRef,
    containerRef,
    videoRef
  })

  const [stateData, setStateData] = useState<StateData>({
    state: State.RAISE_HAND,
    data: {
      count: 0
    },
    needsToLowerHand: false
  })
  const stateDataRef = useFreshRef(stateData)

  useEffect(() => {
    // if (!(playPromise.wasExecuted || playPromise.isExecuting)) {
    //   // eslint-disable-next-line @typescript-eslint/no-floating-promises
    //   playPromise.execute().catch()
    // }
    if (!playPromise.wasSuccessful) return
    const video = videoRef.current ?? never()
    const canvas = canvasRef.current ?? never()
    const container = containerRef.current ?? never()

    const ctx = canvas.getContext('2d') ?? never()

    const cleanupFns: Array<() => void> = []

    let raiseHandTimeoutId: any | undefined
    const clearRaiseHandTimeout = (): void => {
      clearTimeout(raiseHandTimeoutId)
      raiseHandTimeoutId = undefined
    }
    cleanupFns.push(clearRaiseHandTimeout)

    cleanupFns.push(repeatedAnimationFrame(async () => {
      const { scale } = aspectFit(video.videoWidth, video.videoHeight, container.offsetWidth, container.offsetHeight)
      ctx.resetTransform()
      ctx.scale(scale, scale)

      // Calculate poses
      const poses = await detector.estimatePoses(video, { flipHorizontal: true })

      // Draw the image
      // Because the image from camera is mirrored, need to flip horizontally.
      const transformBefore = ctx.getTransform()
      // ctx.setTransform(transformBefore.flipX())
      ctx.translate(canvas.width / scale, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0)
      ctx.setTransform(transformBefore)

      drawPoses(ctx, 0.5, poses)

      const currentState = stateDataRef.current

      if (currentState.needsToLowerHand) {
        if (!areHandsAboveHead(poses[0])) {
          setStateData({
            ...stateDataRef.current as any,
            needsToLowerHand: false
          })
        }
      } else {
        if (currentState.state === State.RAISE_HAND) {
          poses.forEach(pose => {
            if (pose.score !== undefined && pose.score < 0.5) return

            const faceY = pose.keypoints3D?.[0].y ?? never()
            const raisedHands = new Map([...handMap].map(([side, { wrist }]) => {
              const { y } = pose.keypoints3D?.[wrist] ?? never()
              return [side, y < faceY]
            }))
            if ((raisedHands.get(Side.LEFT) ?? never()) && (raisedHands.get(Side.RIGHT) ?? never())) {
              if (currentState.data.count !== 2) {
                setStateData({
                  state: State.RAISE_HAND,
                  data: {
                    count: 2
                  },
                  needsToLowerHand: false
                })
                clearRaiseHandTimeout()
              }
            } else {
              const raisedHand = [...raisedHands].find(([, raised]) => raised)?.[0]
              if (raisedHand !== undefined) {
                if (currentState.data.count !== 1 || currentState.data.data.side !== raisedHand) {
                  clearRaiseHandTimeout()
                  setStateData({
                    needsToLowerHand: false,
                    state: State.RAISE_HAND,
                    data: {
                      count: 1,
                      data: {
                        side: raisedHand,
                        startTime: Date.now()
                      }
                    }
                  })
                  raiseHandTimeoutId = setTimeout(() => {
                    const synth = new Tone.Synth().toDestination()
                    synth.triggerAttackRelease('D4', '4n')
                    const setStateToConfirmHand = (): void => {
                      const data = createYesNo(1000, raisedHand, yes => {
                        if (yes) {
                          synth.triggerAttackRelease('F4', '4n')
                          const setStateToCalibrateBottomCorner = (): void => {
                            const dotPlacer = createDotPlacer(stayStillRadius, raisedHand, stayStillTime, position => {
                              synth.triggerAttackRelease('A4', '4n')
                              setStateData({
                                needsToLowerHand: true,
                                state: State.CONFIRM_BOTTOM_CORNER,
                                data: {
                                  bottomCornerPosition: position,
                                  yesNo: createYesNo(1000, raisedHand, yes => {
                                    if (yes) {
                                      synth.triggerAttackRelease('C5', '4n')
                                      console.log('calibrate top corner')
                                    } else {
                                      setStateToCalibrateBottomCorner()
                                    }
                                  }, true, true),
                                  side: raisedHand
                                }
                              })
                            })
                            setStateData({
                              needsToLowerHand: true,
                              state: State.CALIBRATE_BOTTOM_CORNER,
                              data: {
                                side: raisedHand,
                                yesNo: createYesNo(1000, raisedHand, () => {
                                  setStateToConfirmHand()
                                }, true, false),
                                dotPlacer: dotPlacer
                              }
                            })
                            cleanupFns.push(() => cleanupDotPlacer(dotPlacer))
                          }
                          setStateToCalibrateBottomCorner()
                        } else {
                          setStateData({
                            state: State.RAISE_HAND,
                            data: { count: 0 },
                            needsToLowerHand: true
                          })
                          const dist = new Tone.Volume(10).toDestination()
                          const synth = new Tone.Synth().connect(dist)
                          synth.triggerAttackRelease('C2', '4n')
                        }
                      }, true, true)
                      setStateData({
                        state: State.CONFIRM_HAND,
                        data: data,
                        needsToLowerHand: true
                      })
                      cleanupFns.push(() => cleanupYesNo(data))
                    }
                    setStateToConfirmHand()
                  }, 1000)
                }
              } else {
                if (currentState.data.count !== 0) {
                  setStateData({
                    state: State.RAISE_HAND,
                    data: {
                      count: 0
                    },
                    needsToLowerHand: false
                  })
                  clearRaiseHandTimeout()
                }
              }
            }
          })
        } else if (stateDataRef.current.state === State.CONFIRM_HAND) {
          if (poses.length >= 1) {
            const newData = tickHandYesNo(stateDataRef.current.data, poses[0])
            setStateData({
              state: State.CONFIRM_HAND,
              data: newData,
              needsToLowerHand: false
            })
          }
        } else if (currentState.state === State.CALIBRATE_BOTTOM_CORNER) {
          if (poses.length >= 1) {
            drawWithPose(ctx, poses[0], currentState.data.side)
            const newYesNoData = tickHandYesNo(currentState.data.yesNo, poses[0])
            const newDotPlacerData = newYesNoData.raised
              ? cleanupDotPlacer(currentState.data.dotPlacer)
              : tickDotPlacer(currentState.data.dotPlacer, poses[0])

            setStateData({
              ...stateDataRef.current,
              state: State.CALIBRATE_BOTTOM_CORNER,
              data: {
                ...currentState.data,
                yesNo: newYesNoData,
                dotPlacer: newDotPlacerData
              }
            })
          }
        } else if (currentState.state === State.CONFIRM_BOTTOM_CORNER) {
          drawCalibrationBox({
            ctx,
            bottomPoint: currentState.data.bottomCornerPosition,
            topPoint: undefined,
            bottomPointSide: currentState.data.side
          })
          drawWithPosition(ctx, currentState.data.bottomCornerPosition)
          if (poses.length >= 1) {
            setStateData({
              ...currentState,
              data: {
                ...currentState.data,
                yesNo: tickHandYesNo(currentState.data.yesNo, poses[0])
              }
            })
          }
        }
      }
    }))

    return () => cleanupFns.forEach(fn => fn())
  }, [playPromise.wasSuccessful])

  return (
    <>
      <video ref={videoRef} hidden />
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100%'
        }}
      >
        <canvas ref={canvasRef} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 255, 0, 0.5)'
          }}
        >
          <div
            style={{
              position: 'relative'
            }}
          >
            {stateData.needsToLowerHand
              ? (
                <h1>Lower ur hand</h1>
                )
              : (

                <>
                  {stateData.state === State.RAISE_HAND && (
                    <>
                      <h1>
                        {new Map<number, string>([
                          [0, 'Raise Hand Above Face to Continue'],
                          [1, 'Keep your hand raised'],
                          [2, 'Only raise one hand']
                        ]).get(stateData.data.count) ?? never()}
                      </h1>
                      {/* The progress bar when u raise ur hand */}
                      {stateData.data.count === 1 && (
                        <RaiseHandProgress
                          side={stateData.data.data.side}
                          startTime={stateData.data.data.startTime}
                          totalTime={raiseHandTime}
                        />)}
                    </>)}
                  {stateData.state === State.CONFIRM_HAND && (
                    <>
                      <h1>Calibrate {sideNames.get(stateData.data.yesHand)} hand</h1>
                      <h2>
                        After this message, move ur hand to the
                        bottom {sideNames.get(1 - stateData.data.yesHand)} corner and hold it there
                        for {stayStillTime / 1000} seconds
                      </h2>
                      <HandYesNo
                        data={stateData.data}
                        noNode={<>Raise {sideNames.get(1 - stateData.data.yesHand)} hand to go back to change the calibration hand.</>}
                        yesNode={<>Raise {sideNames.get(stateData.data.yesHand)} hand to continue</>}
                        yesFrequency='E4'
                      />
                    </>
                  )}
                  {stateData.state === State.CALIBRATE_BOTTOM_CORNER && (
                    <>
                      <h1>
                        {stateData.data.dotPlacer.earliestPositionEntry !== undefined && (Date.now() - stateData.data.dotPlacer.earliestPositionEntry.startTime) / stayStillTime > 0.25
                          ? (
                            <>
                              Keep your hand in place
                              <YesSound frequency='G4' />
                            </>)
                          : (
                            <>Move ur {sideNames.get(stateData.data.side)} hand to the
                              bottom {sideNames.get(1 - stateData.data.side)} corner
                            </>)}
                      </h1>
                      {stateData.data.dotPlacer.earliestPositionEntry !== undefined && (
                        <>
                          <ProgressBar
                            startTime={stateData.data.dotPlacer.earliestPositionEntry.startTime}
                            totalTime={stayStillTime}
                            style={{
                              backgroundColor: 'yellow'
                            }}
                          />
                        </>)}
                      <HandYesNo
                        data={stateData.data.yesNo}
                        yesNode={undefined}
                        noNode={undefined}
                        yesFrequency={NaN}
                      />
                    </>
                  )}
                  {stateData.state === State.CONFIRM_BOTTOM_CORNER && (
                    <>
                      <h1>Confirm bottom {sideNames.get(1 - stateData.data.side)} corner position</h1>
                      <HandYesNo
                        data={stateData.data.yesNo}
                        noNode='Back'
                        yesNode='Continue'
                        yesFrequency='B4'
                      />
                    </>)}
                </>)}
          </div>
        </div>
      </div>
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
    </>
  )
})

export default Canvas
