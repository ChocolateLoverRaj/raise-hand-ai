import { ObservablePromise } from 'mobx-observable-promise'
import never from 'never'
import { useContext, useEffect, useState } from 'react'
import resizeCanvas from '../resizeCanvas/resizeCanvas'
import VideoContext from '../../VideoContext'
import Input from './Input'
import useResizeObserver from 'use-resize-observer'

const usePlayPromiseAndAutoResizeCanvas = (resizeCanvasInput: Input): ObservablePromise<() => Promise<void>> => {
  const { result } = useContext(VideoContext)
  const [playPromise] = useState(() => new ObservablePromise(async () => {
    const video = resizeCanvasInput.videoRef.current ?? never()
    video.srcObject = result
    await video.play()

    resizeCanvas(resizeCanvasInput)
  }))
  useEffect(() => {
    playPromise.execute()
  }, [])
  useResizeObserver({
    ref: resizeCanvasInput.containerRef,
    onResize: () => {
      resizeCanvas(resizeCanvasInput)
    }
  })
  return playPromise
}

export default usePlayPromiseAndAutoResizeCanvas
