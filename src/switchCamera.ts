import VideoPromise from './VideoPromise'

const switchCamera = async (videoPromise: VideoPromise, newDeviceId: string): Promise<void> => {
  videoPromise.reset()
  await videoPromise.execute(newDeviceId).catch()
}

export default switchCamera
