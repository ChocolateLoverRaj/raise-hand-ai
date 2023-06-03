import { observer } from 'mobx-react-lite'
import { MutableRefObject, useContext, useEffect, useRef, useState } from 'react'
import VideoContext from './VideoContext'
import never from 'never'
import repeatedAnimationFrame from './repeatedAnimationFrame'
import { ObservablePromise } from 'mobx-observable-promise'
import { PoseDetector, SupportedModels, util } from '@tensorflow-models/pose-detection'
import useResizeObserver from 'use-resize-observer'
import aspectFit from 'aspect-fit'
import handMap from './handMap'
import Side from './raiseHandProgress/Side'
import RaiseHandProgress from './raiseHandProgress/RaiseHandProgress'
import { useFreshRef } from 'rooks'
import drawPoses from './drawPoses'

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
  const [raisedHands, setRaisedHands] = useState<RaisedHands>({
    count: 0
  })
  const raisedHandsRef = useFreshRef(raisedHands)

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

      poses.forEach(pose => {
        if (pose.score !== undefined && pose.score < 0.5) return

        const faceY = pose.keypoints3D?.[0].y ?? never()
        const raisedHands = new Map([...handMap].map(([side, { wrist }]) => {
          const { y } = pose.keypoints3D?.[wrist] ?? never()
          return [side, y < faceY]
        }))
        if ((raisedHands.get(Side.LEFT) ?? never()) && (raisedHands.get(Side.RIGHT) ?? never())) {
          if (raisedHandsRef.current.count !== 2) {
            setRaisedHands({ count: 2 })
            clearRaiseHandTimeout()
          }
        } else {
          const raisedHand = [...raisedHands].find(([, raised]) => raised)?.[0]
          if (raisedHand !== undefined) {
            if (raisedHandsRef.current.count !== 1 || raisedHandsRef.current.data.side !== raisedHand) {
              setRaisedHands({
                count: 1,
                data: {
                  side: raisedHand,
                  startTime: Date.now()
                }
              })
              raiseHandTimeoutId = setTimeout(() => {
                console.log('show calibration tutorial')
              }, 1000)
            }
          } else {
            if (raisedHandsRef.current.count !== 0) {
              setRaisedHands({ count: 0 })
              clearRaiseHandTimeout()
            }
          }
        }
      })
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
            <h1>
              {new Map<number, string>([
                [0, 'Raise Hand Above Face to Continue'],
                [1, 'Keep your hand raised'],
                [2, 'Only raise one hand']
              ]).get(raisedHands.count) ?? never()}
            </h1>
            {/* The progress bar when u raise ur hand */}
            {raisedHands.count === 1 && (
              <RaiseHandProgress
                side={raisedHands.data.side}
                startTime={raisedHands.data.startTime}
                totalTime={raiseHandTime}
              />)}
          </div>
        </div>
      </div>
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
    </>
  )
})

export default Canvas
