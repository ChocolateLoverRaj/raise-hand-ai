import { createDetector, Pose, PoseDetector, SupportedModels } from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'
import { setBackend } from '@tensorflow/tfjs-core'
import WorkerToPage from './WorkerToPage'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  let detector: PoseDetector
  try {
    await setBackend('webgl')
    detector = await createDetector(SupportedModels.MoveNet)
  } catch (e) {
    postMessage(WorkerToPage.ERROR)
    console.error(e)
    return
  }
  postMessage(WorkerToPage.SUCCESS)
  onmessage = async ({ data }) => {
    let poses: Pose[]
    try {
      poses = await detector.estimatePoses(data, { flipHorizontal: true })
    } catch (e) {
      postMessage(WorkerToPage.ERROR)
      console.error(e)
      return
    }
    postMessage(poses)
  }
})()
