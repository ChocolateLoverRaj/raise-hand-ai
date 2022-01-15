import { observer } from 'mobx-react-lite'
import { useContext, useEffect, useRef, useState } from 'react'
import VideoContext from './VideoContext'
import never from 'never'
import { PoseDetector } from '@tensorflow-models/pose-detection'
import repeatedAnimationFrame from './repeatedAnimationFrame'
import { ObservablePromise } from 'mobx-observable-promise'
import handMap from './handMap'
import isHandRaised from './isHandRaised'

export interface CanvasProps {
  detector: PoseDetector
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

  useEffect(() => {
    if (!(playPromise.wasExecuted || playPromise.isExecuting)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      playPromise.execute().catch()
    }
    if (!playPromise.wasSuccessful) return
    const video = videoRef.current ?? never()
    const canvas = canvasRef.current ?? never()

    const ctx = canvas.getContext('2d') ?? never()

    return repeatedAnimationFrame(async () => {
      // Draw the image
      // Because the image from camera is mirrored, need to flip horizontally.
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0)
      ctx.resetTransform()

      // Calculate poses
      const poses = await detector.estimatePoses(video, { flipHorizontal: true })
      // Figure out if left and right hands are raised
      const handsRaised = handMap.map(({ wrist, elbow }) => {
        if (poses[0] === undefined) return false
        const { keypoints } = poses[0]
        const wristPoint = keypoints[wrist]
        const elbowPoint = keypoints[elbow]
        // If score is below this, it is probably incorrect
        // TODO: Make this customizable
        const minScore = 0.3
        if (wristPoint.score as number < minScore) return false
        if (elbowPoint.score as number < minScore) return false
        // Use some trigonometry to make sure they are *raising* their hand
        return isHandRaised(wristPoint, elbowPoint)
      })
      handMap.forEach(({ wrist, elbow }, index) => {
        if (poses[0] === undefined) return
        const { keypoints } = poses[0]
        const wristPoint = keypoints[wrist]
        const elbowPoint = keypoints[elbow]
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.beginPath()
        ctx.moveTo(wristPoint.x, wristPoint.y)
        ctx.lineTo(elbowPoint.x, elbowPoint.y)
        ctx.lineWidth = 10
        const isRightHand = Boolean(index)
        // This tells each hand apart
        // TODO: Show legend of blue is right hand
        ctx.strokeStyle = isRightHand ? 'blue' : 'red'
        ctx.stroke()
        ctx.resetTransform()
      })
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'blue'
      ctx.font = '60px solid'
      // Draw hand emojis if left / right hands are raised
      if (handsRaised[0]) ctx.fillText('\u{270B}', 0, 10)
      ctx.translate(canvas.width, 0)
      // Draw the right one flipped so it looks like a right hand
      ctx.scale(-1, 1)
      if (handsRaised[1]) ctx.fillText('\u{270B}', 0, 10)
      ctx.resetTransform()
    })
  }, [playPromise.wasSuccessful])

  return (
    <>
      <video ref={videoRef} hidden />
      <canvas ref={canvasRef} />
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
    </>
  )
})

export default Canvas
