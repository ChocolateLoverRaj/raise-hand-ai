import { ObservablePromise } from 'mobx-observable-promise'
import never from 'never'
import { useContext, useEffect, useState } from 'react'
import resizeCanvas from '../resizeCanvas/resizeCanvas'
import VideoContext from '../../VideoContext'
import Input from './Input'

const usePlayPromise = (resizeCanvasInput: Input): ObservablePromise<() => Promise<void>> => {
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
  return playPromise
}

export default usePlayPromise
