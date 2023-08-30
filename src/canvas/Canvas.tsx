import { observer } from 'mobx-react-lite'
import { MutableRefObject, useContext, useEffect, useRef } from 'react'
import never from 'never'
import repeatedAnimationFrame from '../repeatedAnimationFrame'
import { PoseDetector } from '@tensorflow-models/pose-detection'
import aspectFit from 'aspect-fit'
import drawPoses from '../drawPoses'
import usePlayPromiseAndAutoResizeCanvas from './usePlayPromiseAndAutoResizeCanvas/usePlayPromiseAndAutoResizeCanvas'
import VideoContext from '../VideoContext'
import Size from '../dotPlacer/tick/Size'
import Position from '../dotPlacer/Position'
import handMap from '../handMap'
import Side from '../raiseHandProgress/Side'

export interface CanvasProps {
  detector: PoseDetector
  containerRef: MutableRefObject<HTMLDivElement | null>
}

interface Config {
  showThresholdLine: boolean
  showKeyPoints: boolean
  showReachCircle: boolean
  showReachBox: boolean
  showWristPoint: boolean
  showPointerOnScreen: boolean
}
const config: Config = {
  showThresholdLine: false,
  showKeyPoints: true,
  showReachBox: false,
  showReachCircle: false,
  showWristPoint: false,
  showPointerOnScreen: true
}

const Canvas = observer<CanvasProps>(({ detector }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerCanvasRef = useRef<HTMLCanvasElement>(null)

  const playPromise = usePlayPromiseAndAutoResizeCanvas({
    canvasRef,
    containerRef,
    videoRef
  })

  useEffect(() => {
    if (!playPromise.wasSuccessful) return
    const video = videoRef.current ?? never()
    const canvas = canvasRef.current ?? never()
    const container = containerRef.current ?? never()
    const pointerCanvas = pointerCanvasRef.current ?? never()

    const ctx = canvas.getContext('2d') ?? never()
    const pointerCtx = (pointerCanvas).getContext('2d') ?? never()

    const cancelRaf = repeatedAnimationFrame(async () => {
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

      if (config.showKeyPoints) {
        drawPoses(ctx, 0.5, poses)
      }

      if (poses.length >= 1) {
        const leftWristY = poses[0].keypoints[(handMap.get(Side.LEFT) ?? never()).wrist].y
        const rightWristY = poses[0].keypoints[(handMap.get(Side.RIGHT) ?? never()).wrist].y
        let pointerHand: Side | undefined = leftWristY < rightWristY ? Side.LEFT : Side.RIGHT
        const pointerWristY = poses[0].keypoints[(handMap.get(pointerHand) ?? never()).wrist].y
        const thresholdConfig = 3 / 4
        const thresholdY = Math.min(...[...handMap.values()].map(({ waist, shoulder }) => {
          const shoulderY = poses[0].keypoints[shoulder].y
          const waistY = poses[0].keypoints[waist].y
          return shoulderY + (waistY - shoulderY) * thresholdConfig
        }))
        if (config.showThresholdLine) {
          ctx.beginPath()
          ctx.moveTo(0, thresholdY)
          ctx.lineTo(video.videoWidth, thresholdY)
          ctx.lineWidth = 3
          ctx.strokeStyle = 'mediumseagreen'
          ctx.stroke()
        }

        if (pointerWristY >= thresholdY) {
          pointerHand = undefined
        }

        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight

        pointerCanvas.width = screenWidth
        pointerCanvas.height = screenHeight
        pointerCtx.clearRect(0, 0, pointerCanvas.width, pointerCanvas.height)
        if (pointerHand !== undefined) {
          const pointIndexes = handMap.get(pointerHand) ?? never()
          const shoulder = poses[0].keypoints[pointIndexes.shoulder]
          const elbow = poses[0].keypoints[pointIndexes.elbow]
          const wrist = poses[0].keypoints[pointIndexes.wrist]
          const aspectRatio: Size = {
            width: screenWidth,
            height: screenHeight
          }

          const radius =
          ((elbow.x - shoulder.x) ** 2 + (elbow.y - shoulder.y) ** 2) ** 0.5 +
          ((wrist.x - elbow.x) ** 2 + (wrist.y - elbow.y) ** 2) ** 0.5

          const diagonal = (aspectRatio.width ** 2 + aspectRatio.height ** 2) ** 0.5
          const diagonalScale = radius / diagonal

          if (config.showReachCircle) {
            ctx.beginPath()
            ctx.arc(shoulder.x, shoulder.y, radius, 0, Math.PI * 2)
            ctx.strokeStyle = 'purple'
            ctx.stroke()
          }

          if (config.showReachBox) {
            ctx.beginPath()
            ctx.arc(wrist.x, wrist.y, 10, 0, Math.PI * 2)
            ctx.fillStyle = 'red'
            ctx.fill()
          }

          const leftX = shoulder.x - aspectRatio.width * diagonalScale
          const rightX = shoulder.x + aspectRatio.width * diagonalScale
          const topY = shoulder.y - aspectRatio.height * diagonalScale
          const bottomY = shoulder.y + aspectRatio.height * diagonalScale

          const getNormalizedWristPos = (): Position => {
            let x = wrist.x
            let y = wrist.y
            x = Math.max(x, leftX)
            y = Math.max(y, topY)
            x = Math.min(x, rightX)
            y = Math.min(y, bottomY)
            return { x, y }
          }
          const { x: normalizedX, y: normalizedY } = getNormalizedWristPos()

          const boxWidth = aspectRatio.width * diagonalScale * 2
          const boxHeight = aspectRatio.height * diagonalScale * 2

          // FIXME: Pose detection glitches when left hand goes past right shoulder
          if (config.showReachBox) {
            ctx.beginPath()
            ctx.arc(normalizedX, normalizedY, 10, 0, Math.PI * 2)
            ctx.fillStyle = 'pink'
            ctx.fill()

            ctx.strokeStyle = 'blue'
            ctx.strokeRect(
              shoulder.x - aspectRatio.width * diagonalScale,
              shoulder.y - aspectRatio.height * diagonalScale,
              boxWidth,
              boxHeight
            )
          }

          if (config.showPointerOnScreen) {
            const xOnScreen = (normalizedX - leftX) / boxWidth
            const yOnScreen = (normalizedY - topY) / boxHeight

            pointerCtx.beginPath()
            const screenDiagonal = (screenWidth * screenHeight) ** 0.5
            pointerCtx.arc(xOnScreen * pointerCanvas.width, yOnScreen * pointerCanvas.height, screenDiagonal * 0.05, 0, Math.PI * 2)
            pointerCtx.fillStyle = 'dodgerblue'
            pointerCtx.fill()
          }
        }
      }
    })

    return () => {
      cancelRaf()
    }
  }, [playPromise.wasSuccessful])

  const { result } = useContext(VideoContext)

  return (
    <>
      <video ref={videoRef} hidden />
      Video FPS: <code>{result.getVideoTracks()[0].getSettings().frameRate}</code>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: '100%'
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
      <canvas
        ref={pointerCanvasRef}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          left: 0,
          top: 0
        }}
      />
    </>
  )
})

export default Canvas
