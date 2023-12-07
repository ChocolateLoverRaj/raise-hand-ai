import { createDetector as _createDetector, SupportedModels } from '@tensorflow-models/pose-detection'

export async function createDetector() {
  return await _createDetector(SupportedModels.BlazePose, {
    enableSmoothing: true,
    modelType: 'lite',
    runtime: 'mediapipe',
    solutionPath: './_node_modules/@mediapipe/pose'
  })
}

export async function estimatePoses(detector, video) {
  return await detector.estimatePoses(video)
}
