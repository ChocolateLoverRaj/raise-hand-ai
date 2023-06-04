import { observer } from 'mobx-react-lite'
import { MutableRefObject, useContext, useEffect, useRef, useState } from 'react'
import VideoContext from './VideoContext'
import never from 'never'
import repeatedAnimationFrame from './repeatedAnimationFrame'
import { ObservablePromise } from 'mobx-observable-promise'
import { PoseDetector } from '@tensorflow-models/pose-detection'
import useResizeObserver from 'use-resize-observer'
import aspectFit from 'aspect-fit'
import handMap from './handMap'
import Side from './raiseHandProgress/Side'
import RaiseHandProgress from './raiseHandProgress/RaiseHandProgress'
import { useFreshRef } from 'rooks'
import drawPoses from './drawPoses'
import * as Tone from 'tone'
import sideNames from './sideNames'
import Data from './handYesNo/Data'
import HandYesNo from './handYesNo/HandYesNo'
import create from './handYesNo/create'
import cleanup from './handYesNo/cleanup'
import tick from './handYesNo/tick'
import areHandsAboveHead from './areHandsAboveHead'

export interface CanvasProps {
  detector: PoseDetector
  containerRef: MutableRefObject<HTMLDivElement | null>
}

const raiseHandTime = 1000

const Canvas = observer<CanvasProps>(({ detector }) => {
  const { result } = useContext(VideoContext)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [playPromise] = useState(() => new ObservablePromise(async () => {
    const video = videoRef.current ?? never()

    video.srcObject = result

    const canvas = canvasRef.current ?? never()
    const container = containerRef.current ?? never()

    await video.play()

    const fit = aspectFit(video.videoWidth, video.videoHeight, container.offsetWidth, container.offsetHeight)
    ;(canvas.width as any) = fit.width
    ;(canvas.height as any) = fit.height
  }))

  useResizeObserver({
    ref: containerRef,
    onResize: ({ width, height }) => {
      const video = videoRef.current ?? never()
      const canvas = canvasRef.current ?? never()

      const fit = aspectFit(video.videoWidth, video.videoHeight, width, height)
      ;(canvas.width as any) = fit.width
      ;(canvas.height as any) = fit.height
    }
  })

  interface RaisedHand {
    startTime: number
    side: Side
  }
  type RaisedHands = {
    count: 2
  } | {
    count: 1
    data: RaisedHand
  } | {
    count: 0
  }
  enum State {
    RAISE_HAND,
    CALIBRATE_TUTORIAL
  }
  type StateData = {
    state: State.RAISE_HAND
    data: RaisedHands
    needsToLowerHand: boolean
  } | {
    state: State.CALIBRATE_TUTORIAL
    data: Data
    needsToLowerHand: boolean
  }

  const [stateData, setStateData] = useState<StateData>({
    state: State.RAISE_HAND,
    data: {
      count: 0
    },
    needsToLowerHand: false
  })
  const stateDataRef = useFreshRef(stateData)

  useEffect(() => {
    if (!(playPromise.wasExecuted || playPromise.isExecuting)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      playPromise.execute().catch()
    }
    if (!playPromise.wasSuccessful) return
    const video = videoRef.current ?? never()
    const canvas = canvasRef.current ?? never()
    const container = containerRef.current ?? never()

    const ctx = canvas.getContext('2d') ?? never()

    const imageDataCanvas = document.createElement('canvas')
    imageDataCanvas.width = video.videoWidth
    imageDataCanvas.height = video.videoHeight
    const imageDataCtx = imageDataCanvas.getContext('2d') ?? never()

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
      imageDataCtx.drawImage(video, 0, 0)
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
            ...stateDataRef.current,
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
                  ...stateDataRef.current,
                  state: State.RAISE_HAND,
                  data: {
                    count: 2
                  }
                })
                clearRaiseHandTimeout()
              }
            } else {
              const raisedHand = [...raisedHands].find(([, raised]) => raised)?.[0]
              if (raisedHand !== undefined) {
                if (currentState.data.count !== 1 || currentState.data.data.side !== raisedHand) {
                  clearRaiseHandTimeout()
                  setStateData({
                    ...stateDataRef.current,
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
                    const data = create(1000, raisedHand, yes => {
                      if (yes) {
                        console.log('yes')
                        synth.triggerAttackRelease('F4', '4n')
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
                    })
                    setStateData({
                      state: State.CALIBRATE_TUTORIAL,
                      data: data,
                      needsToLowerHand: true
                    })
                    cleanupFns.push(() => cleanup(data))
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
        } else if (stateDataRef.current.state === State.CALIBRATE_TUTORIAL) {
          tick(stateDataRef.current.data, newData => setStateData({
            ...stateDataRef.current,
            state: State.CALIBRATE_TUTORIAL,
            data: newData
          }), poses[0])
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
                  {stateData.state === State.CALIBRATE_TUTORIAL && (
                    <>
                      <h1>Calibrate {sideNames.get(stateData.data.yesHand)} hand</h1>
                      <h2>After this message, move ur hand to the bottom left corner</h2>
                      <HandYesNo
                        data={stateData.data}
                        noNode={<>Raise {sideNames.get(1 - stateData.data.yesHand)} hand to go back to change the calibration hand.</>}
                        yesNode={<>Raise {sideNames.get(stateData.data.yesHand)} hand to continue</>}
                      />
                    </>
                  )}
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
