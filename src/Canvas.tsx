import { observer } from 'mobx-react-lite'
import { useContext, useEffect, useRef, useState } from 'react'
import VideoContext from './VideoContext'
import never from 'never'
import repeatedAnimationFrame from './repeatedAnimationFrame'
import { ObservablePromise } from 'mobx-observable-promise'
import { Hand, HandDetector } from '@tensorflow-models/hand-pose-detection'
import { HAND_CONNECTIONS } from '@mediapipe/hands'
import fp from 'fingerpose'
import FixedHeightMessage from './fixedHeightMessage/FixedHeightMessage'
import { useFreshRef } from 'rooks'
import { CircularProgressbarWithChildren } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { isUndefined } from 'util'
import useDateNow from './useDateNow'

// From https://stackoverflow.com/a/35626468/11145447
// Match on digit at least once, optional decimal, and optional digits
// Named group `value`
const match = /(?<value>\d+\.?\d*)/

const setFontSize = (ctx: CanvasRenderingContext2D, size: number): void => {
  ctx.font = ctx.font.replace(match, size.toString())
}

export interface CanvasProps {
  detector: HandDetector
}

const Canvas = observer<CanvasProps>(({ detector }) => {
  const { result } = useContext(VideoContext)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [playPromise] = useState(() => new ObservablePromise(async () => {
    const video = videoRef.current ?? never()
    const canvas = canvasRef.current ?? never()

    video.srcObject = result
    await video.play()

    video.width = video.videoWidth
    video.height = video.videoHeight

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }))

  const [thumbsUpHands, setThumbsUpHands] = useState<Hand[]>([])
  interface ThumbsUpHand {
    hand: Hand['handedness']
    startTime: number
    x: number
    y: number
  }

  const [thumbsUpHand, setThumbsUpHand] = useState<ThumbsUpHand>()
  const thumbsUpHandRef = useFreshRef(thumbsUpHand)
  const thumbsUpTime = 3000
  const now = useDateNow()
  const thumbsUpProgressSize = 100

  useEffect(() => {
    if (!(playPromise.wasExecuted || playPromise.isExecuting)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      playPromise.execute().catch()
    }
    if (!playPromise.wasSuccessful) return
    const video = videoRef.current ?? never()
    const canvas = canvasRef.current ?? never()

    const ctx = canvas.getContext('2d') ?? never()

    const imageDataCanvas = document.createElement('canvas')
    imageDataCanvas.width = video.videoWidth
    imageDataCanvas.height = video.videoHeight
    const imageDataCtx = imageDataCanvas.getContext('2d') ?? never()

    let lastRender = Date.now()
    let lastFpsUpdate = { time: -Infinity, fps: 0 }
    const fpsUpdateMs = 500
    const gestureEstimator = new fp.GestureEstimator([
      fp.Gestures.VictoryGesture,
      fp.Gestures.ThumbsUpGesture
    ])

    return repeatedAnimationFrame(async () => {
      // Calculate poses
      imageDataCtx.drawImage(video, 0, 0)
      const imageData = imageDataCtx.getImageData(0, 0, video.videoWidth, video.videoHeight)
      console.time('Estimate hands')
      const hands = await detector.estimateHands(imageData, { flipHorizontal: true })
      const now = Date.now()
      const timeToRender = now - lastRender
      lastRender = now
      console.timeEnd('Estimate hands')

      const getHighestScoreHand = (hands: Hand[]): Hand | undefined => hands.slice(1).reduce((highestScoreHand, currentHand) => {
        if (currentHand.score > highestScoreHand.score) return currentHand
        return highestScoreHand
      }, hands[0])

      const leftHand = getHighestScoreHand(hands.filter(({ handedness }) => handedness === 'Left'))
      const rightHand = getHighestScoreHand(hands.filter(({ handedness }) => handedness === 'Right'))
      const highestScoreBothHands: Hand[] = [
        ...leftHand !== undefined ? [leftHand] : [],
        ...rightHand !== undefined ? [rightHand] : []
      ]

      // Draw the image
      // Because the image from camera is mirrored, need to flip horizontally.
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0)
      ctx.resetTransform()

      ctx.fillStyle = 'purple'
      if (now - lastFpsUpdate.time >= fpsUpdateMs) {
        const fps = Math.round(1000 / timeToRender)
        lastFpsUpdate = { fps, time: now }
      }
      ctx.textBaseline = 'top'

      setFontSize(ctx, 50)
      ctx.fillText(`FPS: ${lastFpsUpdate.fps}`, 0, 0)

      console.log('highest score both hands', highestScoreBothHands)

      highestScoreBothHands.forEach(({ keypoints, handedness }) => {
        HAND_CONNECTIONS.forEach(([p1, p2]) => {
          ctx.beginPath()
          ctx.moveTo(keypoints[p1].x, keypoints[p1].y)
          ctx.lineTo(keypoints[p2].x, keypoints[p2].y)
          ctx.closePath()
          ctx.lineWidth = 3
          ctx.strokeStyle = 'white'
          ctx.stroke()
        })
        keypoints.forEach(({ x, y }) => {
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.closePath()
          ctx.fillStyle = handedness === 'Right' ? 'red' : 'blue'
          ctx.fill()
        })
      })

      const thumbsUpHands = highestScoreBothHands.filter(({ keypoints3D }) => {
        const { gestures } = gestureEstimator.estimate(keypoints3D, 9.2)
        return (gestures as any[]).some(({ name }) => name === 'thumbs_up')
      })
      setThumbsUpHands(thumbsUpHands)
      const thumbsUpHand = thumbsUpHandRef.current
      if (thumbsUpHands.length === 1) {
        if (thumbsUpHands[0].handedness === thumbsUpHand?.hand) {
          const newThumbsUpHand: ThumbsUpHand = {
            ...thumbsUpHand,
            x: thumbsUpHands[0].keypoints[0].x,
            y: thumbsUpHands[0].keypoints[0].y
          }
          if (now >= thumbsUpHand.startTime + thumbsUpTime) {
            console.log('start calibration')
          }
          setThumbsUpHand(newThumbsUpHand)
        } else {
          setThumbsUpHand({
            hand: thumbsUpHands[0].handedness,
            startTime: Date.now(),
            x: thumbsUpHands[0].keypoints[0].x,
            y: thumbsUpHands[0].keypoints[0].y
          })
        }
      } else {
        setThumbsUpHand(undefined)
      }
    })
  }, [playPromise.wasSuccessful])

  enum Messages {
    THUMBS_UP_TO_CALIBRATE,
    TOO_MANY_THUMBS_UPS
  }

  return (
    <>
      <video ref={videoRef} hidden />
      <FixedHeightMessage
        messages={[{
          key: Messages.THUMBS_UP_TO_CALIBRATE,
          node: 'Thumbs up with the hand you want to calibrate it with'
        }, {
          key: Messages.TOO_MANY_THUMBS_UPS,
          node: 'Too many thumbs ups, only do thumbs up with 1 hand'
        }]}
        messageToShow={thumbsUpHands.length === 0
          ? Messages.THUMBS_UP_TO_CALIBRATE
          : thumbsUpHands.length > 1
            ? Messages.TOO_MANY_THUMBS_UPS
            : undefined}
      />
      <div
        style={{
          position: 'relative'
        }}
      >
        <canvas ref={canvasRef} />
        {thumbsUpHand !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: thumbsUpHand.y - thumbsUpProgressSize / 2,
              left: thumbsUpHand.x - thumbsUpProgressSize / 2,
              width: thumbsUpProgressSize,
              height: thumbsUpProgressSize,
              backgroundColor: 'gray',
              fontSize: 50
            }}
          >
            <CircularProgressbarWithChildren value={now - thumbsUpHand.startTime} maxValue={thumbsUpTime}>
              👍
            </CircularProgressbarWithChildren>
          </div>
        )}
      </div>
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
    </>
  )
})

export default Canvas
