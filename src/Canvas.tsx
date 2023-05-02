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
import { useFreshRef, useWindowSize } from 'rooks'
import { CircularProgressbarWithChildren } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import useDateNow from './useDateNow'
import getEnclosingCircle from 'smallest-enclosing-circle'
import Delaunator from 'delaunator'
import bc from 'barycentric-coordinates'
import { createPortal } from 'react-dom'
import { IoHandLeft, IoHandRight } from 'react-icons/io5'

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

interface Position {
  x: number
  y: number
}

enum Stage {
  RAISE_THUMB_TO_CALIBRATE,
  CALIBRATE,
  DONE_CALIBRATING
}

enum Corner {
  TOP_RIGHT,
  TOP_LEFT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT
}

interface ThumbsUpHand {
  hand: Hand['handedness']
  startTime: number
  pos: Position
}
interface PosInHistory {
  pos: Position
  time: number
}

interface CalibrationStates {
  [Stage.RAISE_THUMB_TO_CALIBRATE]: {
    thumbsUpHands: Hand[]
    thumbsUpHand: ThumbsUpHand | undefined
  }
  [Stage.CALIBRATE]: {
    hand: Hand['handedness']
    posHistory: PosInHistory[]
    calibratedPoints: Position[]
  }
  [Stage.DONE_CALIBRATING]: {
    hand: Hand['handedness']
    calibratedPoints: Position[]
    /**
     * This is normalized ([0, 1])
     */
    pos: Position | undefined
  }
}
const handStayStillWithinRadius = 15
const handStayStillTime = 2000

type CalibrationState = {
  [K in keyof CalibrationStates]: {
    stage: K
    data: CalibrationStates[K]
  }
}[keyof CalibrationStates]

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

  const [calibrationState, setCalibrationState] = useState<CalibrationState>({
    stage: Stage.RAISE_THUMB_TO_CALIBRATE,
    data: {
      thumbsUpHands: [],
      thumbsUpHand: undefined
    }
  })
  const calibrationStateRef = useFreshRef(calibrationState)
  const thumbsUpTime = 3000
  const now = useDateNow()
  const thumbsUpProgressSize = 100
  const { innerWidth, innerHeight } = useWindowSize()

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

    const drawBorder = (calibratedPoints: Position[]): void => {
      const drawLine = (pos1: Position, pos2: Position): void => {
        ctx.beginPath()
        ctx.moveTo(pos1.x, pos1.y)
        ctx.lineTo(pos2.x, pos2.y)
        ctx.strokeStyle = 'yellow'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      for (let i = 0; i < calibratedPoints.length - 1; i++) {
        drawLine(calibratedPoints[i], calibratedPoints[i + 1])
      }
      if (calibratedPoints.length === 4) {
        drawLine(calibratedPoints[3], calibratedPoints[0])
      }
      calibratedPoints.forEach(({ x, y }) => {
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.fillStyle = 'tomato'
        ctx.fill()
      })
    }

    return repeatedAnimationFrame(async () => {
      const calibrationState = calibrationStateRef.current

      // Calculate poses
      imageDataCtx.drawImage(video, 0, 0)
      const imageData = imageDataCtx.getImageData(0, 0, video.videoWidth, video.videoHeight)
      const hands = await detector.estimateHands(imageData, { flipHorizontal: true })
      const now = Date.now()
      const timeToRender = now - lastRender
      lastRender = now

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
          ctx.fillStyle = handedness === 'Right' ? 'orange' : 'blue'
          ctx.fill()
        })
      })

      if (calibrationState.stage === Stage.RAISE_THUMB_TO_CALIBRATE) {
        const thumbsUpHands = highestScoreBothHands.filter(({ keypoints3D }) => {
          const { gestures } = gestureEstimator.estimate(keypoints3D, 9.2)
          return (gestures as any[]).some(({ name }) => name === 'thumbs_up')
        })
        if (thumbsUpHands.length === 1) {
          if (thumbsUpHands[0].handedness === calibrationState.data.thumbsUpHand?.hand) {
            const newThumbsUpHand: ThumbsUpHand = {
              ...calibrationState.data.thumbsUpHand,
              pos: {
                x: thumbsUpHands[0].keypoints[0].x,
                y: thumbsUpHands[0].keypoints[0].y
              }
            }
            if (now >= calibrationState.data.thumbsUpHand.startTime + thumbsUpTime) {
              setCalibrationState({
                stage: Stage.CALIBRATE,
                data: {
                  hand: newThumbsUpHand.hand,
                  posHistory: [],
                  calibratedPoints: []
                }
              })
            } else {
              setCalibrationState({
                ...calibrationState,
                data: {
                  ...calibrationState.data,
                  thumbsUpHand: newThumbsUpHand,
                  thumbsUpHands
                }
              })
            }
          } else {
            setCalibrationState({
              ...calibrationState,
              data: {
                ...calibrationState.data,
                thumbsUpHand: {
                  hand: thumbsUpHands[0].handedness,
                  startTime: Date.now(),
                  pos: {
                    x: thumbsUpHands[0].keypoints[0].x,
                    y: thumbsUpHands[0].keypoints[0].y
                  }
                }
              }
            })
          }
        } else {
          setCalibrationState({
            ...calibrationState,
            data: {
              ...calibrationState.data,
              thumbsUpHand: undefined,
              thumbsUpHands
            }
          })
        }
      } else if (calibrationState.stage === Stage.CALIBRATE) {
        const hand = calibrationState.data.hand === 'Left' ? leftHand : rightHand

        const drawPosHistoryCircle = (posHistory: PosInHistory[], progress: number): void => {
          ctx.lineWidth = 8

          const enclosingCircle = getEnclosingCircle(posHistory.map(({ pos }) => pos))
          ctx.beginPath()
          ctx.arc(enclosingCircle.x, enclosingCircle.y, enclosingCircle.r, 0, Math.PI * 2)
          ctx.strokeStyle = 'green'
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(enclosingCircle.x, enclosingCircle.y, enclosingCircle.r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
          ctx.strokeStyle = 'pink'
          ctx.stroke()
        }

        drawBorder(calibrationState.data.calibratedPoints)

        if (hand !== undefined) {
          const posPoint = hand.keypoints[0]
          const pos: Position = {
            x: posPoint.x,
            y: posPoint.y
          }

          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2)
          ctx.fillStyle = 'red'
          ctx.closePath()
          ctx.fill()

          const newPosHistory: PosInHistory[] = [
            ...calibrationState.data.posHistory,
            {
              pos,
              time: now
            }
          ]

          while (getEnclosingCircle(newPosHistory.map(({ pos }) => pos)).r > handStayStillWithinRadius) {
            newPosHistory.shift()
          }

          const progress = (now - newPosHistory[0].time) / handStayStillTime
          drawPosHistoryCircle(newPosHistory, progress)

          const newCalibratedPoints = [...calibrationState.data.calibratedPoints]
          if (progress >= 1) {
            newPosHistory.length = 0
            newCalibratedPoints.push(pos)
          }

          if (newCalibratedPoints.length === 4) {
            setCalibrationState({
              stage: Stage.DONE_CALIBRATING,
              data: {
                hand: calibrationState.data.hand,
                calibratedPoints: newCalibratedPoints,
                pos: undefined
              }
            })
          } else {
            setCalibrationState({
              ...calibrationState,
              data: {
                ...calibrationState.data,
                posHistory: newPosHistory,
                calibratedPoints: newCalibratedPoints
              }
            })
          }
        } else {
          drawPosHistoryCircle(calibrationState.data.posHistory, 0)
        }
      } else if (calibrationState.stage === Stage.DONE_CALIBRATING) {
        const hand = calibrationState.data.hand === 'Left' ? leftHand : rightHand

        drawBorder(calibrationState.data.calibratedPoints)

        const delaunay = new Delaunator(calibrationState.data.calibratedPoints.flatMap(({ x, y }) => [x, y]))
        if (delaunay.triangles.length !== 6) {
          throw new Error('Points must form a convex quadrilateral')
        }
        const triangles: number[][] = []
        for (let i = 0; i < delaunay.triangles.length / 3; i++) {
          const trianglePoints: number[] = [delaunay.triangles[i * 3], delaunay.triangles[i * 3 + 1], delaunay.triangles[i * 3 + 2]]
          const includes0 = trianglePoints.includes(0)
          const includes1 = trianglePoints.includes(1)
          const includes2 = trianglePoints.includes(2)
          const includes3 = trianglePoints.includes(3)
          let newCoordOrder: number[]
          if (includes0 && includes1 && includes2) {
            newCoordOrder = [0, 1, 2]
          } else if (includes1 && includes2 && includes3) {
            newCoordOrder = [1, 2, 3]
          } else if (includes2 && includes3 && includes0) {
            newCoordOrder = [2, 3, 0]
          } else if (includes3 && includes0 && includes1) {
            newCoordOrder = [3, 0, 1]
          } else never()
          triangles.push(newCoordOrder)
        }

        triangles.forEach(coords => {
          const points = coords.map(i => calibrationState.data.calibratedPoints[i])
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          ctx.lineTo(points[1].x, points[1].y)
          ctx.lineTo(points[2].x, points[2].y)
          ctx.closePath()
          ctx.lineWidth = 4
          ctx.strokeStyle = 'purple'
          ctx.stroke()
        })

        if (hand !== undefined) {
          const handPos: Position = {
            x: hand.keypoints[0].x,
            y: hand.keypoints[0].y
          }
          const baryCoords = triangles.map(coords => {
            const [bary0, bary1] = bc.triangleBarycentricCoords(
              [handPos.x, handPos.y, 0],
              coords
                .map(i => calibrationState.data.calibratedPoints[i])
                .map(({ x, y }) => [x, y, 0])
            ) as number[]
            return [bary0, bary1]
          })
          const distances = baryCoords.map(([bary0, bary1]) => Math.abs(bary0) + Math.abs(bary1))
          const closestBaryIndex = distances.indexOf(Math.min(...distances))

          ctx.lineWidth = 8
          const trianglePoints = triangles[closestBaryIndex].map(i => calibrationState.data.calibratedPoints[i])
          const [bary0, bary1] = baryCoords[closestBaryIndex]

          ctx.beginPath()
          ctx.moveTo(trianglePoints[1].x, trianglePoints[1].y)
          ctx.lineTo(trianglePoints[1].x + (trianglePoints[0].x - trianglePoints[1].x) * bary0, trianglePoints[1].y + (trianglePoints[0].y - trianglePoints[1].y) * bary0)
          ctx.strokeStyle = 'pink'
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(trianglePoints[1].x, trianglePoints[1].y)
          ctx.lineTo(trianglePoints[1].x + (trianglePoints[2].x - trianglePoints[1].x) * bary1, trianglePoints[1].y + (trianglePoints[2].y - trianglePoints[1].y) * bary1)
          ctx.strokeStyle = 'gray'
          ctx.stroke()

          let normalizedX: number
          let normalizedY: number
          switch (triangles[closestBaryIndex][1]) {
            case Corner.TOP_RIGHT:
              normalizedX = 1 - bary1
              normalizedY = 0 + bary0
              break
            case Corner.TOP_LEFT:
              normalizedX = 0 + bary0
              normalizedY = 0 + bary1
              break
            case Corner.BOTTOM_LEFT:
              normalizedX = 0 + bary1
              normalizedY = 1 - bary0
              break
            case Corner.BOTTOM_RIGHT:
              normalizedX = 1 - bary0
              normalizedY = 1 - bary1
              break
            default:
              throw new Error('Invalid corner')
          }

          setCalibrationState({
            ...calibrationState,
            data: {
              ...calibrationState.data,
              pos: {
                x: normalizedX,
                y: normalizedY
              }
            }
          })
        }
      }
    })
  }, [playPromise.wasSuccessful])

  enum Messages {
    THUMBS_UP_TO_CALIBRATE,
    TOO_MANY_THUMBS_UPS,
    MOVE_UR_HAND_TO_THE_TOP_RIGHT_CORNER,
    MOVE_UR_HAND_TO_THE_TOP_LEFT_CORNER,
    MOVE_UR_HAND_TO_THE_BOTTOM_RIGHT_CORNER,
    MOVE_UR_HAND_TO_THE_BOTTOM_LEFT_CORNER,
    DONE_CALIBRATING
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
        }, {
          key: Messages.MOVE_UR_HAND_TO_THE_TOP_RIGHT_CORNER,
          node: 'Move ur hand to the top right corner'
        }, {
          key: Messages.MOVE_UR_HAND_TO_THE_TOP_LEFT_CORNER,
          node: 'Move ur hand to the top left corner'
        },
        {
          key: Messages.MOVE_UR_HAND_TO_THE_BOTTOM_RIGHT_CORNER,
          node: 'Move ur hand to the bottom right corner'
        }, {
          key: Messages.MOVE_UR_HAND_TO_THE_BOTTOM_LEFT_CORNER,
          node: 'Move ur hand to the bottom left corner'
        }, {
          key: Messages.DONE_CALIBRATING,
          node: 'Done calibrating!'
        }]}
        messageToShow={calibrationState.stage === Stage.RAISE_THUMB_TO_CALIBRATE
          ? calibrationState.data.thumbsUpHands.length === 0
            ? Messages.THUMBS_UP_TO_CALIBRATE
            : calibrationState.data.thumbsUpHands.length > 1
              ? Messages.TOO_MANY_THUMBS_UPS
              : undefined
          : calibrationState.stage === Stage.CALIBRATE
            ? {
                [Corner.TOP_RIGHT]: Messages.MOVE_UR_HAND_TO_THE_TOP_RIGHT_CORNER,
                [Corner.TOP_LEFT]: Messages.MOVE_UR_HAND_TO_THE_TOP_LEFT_CORNER,
                [Corner.BOTTOM_RIGHT]: Messages.MOVE_UR_HAND_TO_THE_BOTTOM_RIGHT_CORNER,
                [Corner.BOTTOM_LEFT]: Messages.MOVE_UR_HAND_TO_THE_BOTTOM_LEFT_CORNER
              }[calibrationState.data.calibratedPoints.length]
            : calibrationState.stage === Stage.DONE_CALIBRATING
              ? Messages.DONE_CALIBRATING
              : undefined}
      />
      <div
        style={{
          position: 'relative'
        }}
      >
        <canvas ref={canvasRef} />
        {calibrationState.stage === Stage.RAISE_THUMB_TO_CALIBRATE && calibrationState.data.thumbsUpHand !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: calibrationState.data.thumbsUpHand.pos.y - thumbsUpProgressSize / 2,
              left: calibrationState.data.thumbsUpHand.pos.x - thumbsUpProgressSize / 2,
              width: thumbsUpProgressSize,
              height: thumbsUpProgressSize,
              backgroundColor: 'gray',
              fontSize: 50
            }}
          >
            <CircularProgressbarWithChildren value={now - calibrationState.data.thumbsUpHand.startTime} maxValue={thumbsUpTime}>
              👍
            </CircularProgressbarWithChildren>
          </div>
        )}
      </div>
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
      {calibrationState.stage === Stage.DONE_CALIBRATING && calibrationState.data.pos !== undefined && createPortal(
        <div
          style={{
            position: 'fixed',
            top: calibrationState.data.pos.y * (innerHeight ?? 0) - 50,
            left: calibrationState.data.pos.x * (innerWidth ?? 0) - 50 / 2,
            color: 'red',
            fontSize: 50
          }}
        >
          {calibrationState.data.hand === 'Left'
            ? <IoHandLeft />
            : <IoHandRight />}
        </div>,
        document.body)}
    </>
  )
})

export default Canvas
