import { observer } from 'mobx-react-lite'
import { MutableRefObject, useEffect, useRef } from 'react'
import never from 'never'
import repeatedAnimationFrame from '../repeatedAnimationFrame'
import { PoseDetector } from '@tensorflow-models/pose-detection'
import aspectFit from 'aspect-fit'
import drawPoses from '../drawPoses'
import areHandsAboveHead from '../areHandsAboveHead'
import Scene from './Scene'
import usePlayPromiseAndAutoResizeCanvas from './usePlayPromiseAndAutoResizeCanvas/usePlayPromiseAndAutoResizeCanvas'
import sceneMap from './sceneMap'
import useStateRef from 'react-usestateref'

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

  const [stateData, setStateData, stateDataRef] = useStateRef<{
    needsToLowerHand: boolean
    scene: Scene
    sceneData: any
  }>({
    scene: Scene.RAISE_HAND,
    sceneData: {
      raiseHandTimeout: undefined,
      count: 0
    },
    needsToLowerHand: false
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

      const currentState = stateDataRef.current

      if (currentState.needsToLowerHand) {
        if (!areHandsAboveHead(poses[0])) {
          setStateData({
            ...currentState,
            needsToLowerHand: false
          })
        }
      } else {
        const sceneFns = sceneMap.get(currentState.scene) ?? never()
        const newSceneData = sceneFns.tick({
          data: currentState.sceneData,
          setScene: (scene, sceneData) => {
            setStateData({
              needsToLowerHand: true,
              scene,
              sceneData
            })
          },
          pose: poses[0],
          ctx,
          unscaledSize: {
            width: video.videoWidth,
            height: video.videoHeight
          }
        })
        setStateData({
          ...currentState,
          sceneData: newSceneData
        })
      }
    })

    return () => {
      cancelRaf()
      sceneMap.get(stateDataRef.current.scene)?.cleanup(stateDataRef.current.sceneData)
    }
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
              : sceneMap.get(stateData.scene)?.render(stateData.sceneData)}
          </div>
        </div>
      </div>
      {playPromise.isExecuting && 'Playing video'}
      {playPromise.isError && 'Error playing video'}
    </>
  )
})

export default Canvas
