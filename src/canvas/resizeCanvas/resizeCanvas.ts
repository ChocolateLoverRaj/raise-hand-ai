import never from 'never'
import Input from './Input'
import aspectFit from 'aspect-fit'

const resizeCanvas = ({ canvasRef, containerRef, videoRef }: Input): void => {
  const video = videoRef.current ?? never()
  const canvas = canvasRef.current ?? never()
  const container = containerRef.current ?? never()

  const fit = aspectFit(video.videoWidth, video.videoHeight, container.offsetWidth, container.offsetHeight)
      ;(canvas.width) = fit.width
  ;(canvas.height) = fit.height
}

export default resizeCanvas
