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

export interface CanvasProps {
  detector: PoseDetector
  containerRef: MutableRefObject<HTMLDivElement | null>
}

const Canvas = observer<CanvasProps>(({ detector }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

    const ctx = canvas.getContext('2d') ?? never()

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

      drawPoses(ctx, 0.5, poses)

      const shoulder = poses[0].keypoints[11]
      const elbow = poses[0].keypoints[13]
      const wrist = poses[0].keypoints[15]
      const aspectRatio: Size = {
        width: 3,
        height: 2
      }

      const radius =
        ((elbow.x - shoulder.x) ** 2 + (elbow.y - shoulder.y) ** 2) ** 0.5 +
        ((wrist.x - elbow.x) ** 2 + (wrist.y - elbow.y) ** 2) ** 0.5

      const diagonal = (aspectRatio.width ** 2 + aspectRatio.height ** 2) ** 0.5
      const diagonalScale = radius / diagonal

      ctx.beginPath()
      ctx.arc(shoulder.x, shoulder.y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'purple'
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(wrist.x, wrist.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = 'red'
      ctx.fill()

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

      ctx.beginPath()
      ctx.arc(normalizedX, normalizedY, 10, 0, Math.PI * 2)
      ctx.fillStyle = 'pink'
      ctx.fill()

      ctx.strokeStyle = 'blue'
      ctx.strokeRect(
        shoulder.x - aspectRatio.width * diagonalScale,
        shoulder.y - aspectRatio.height * diagonalScale,
        aspectRatio.width * diagonalScale * 2,
        aspectRatio.height * diagonalScale * 2
      )
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
    </>
  )
})

export default Canvas
