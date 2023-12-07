// import * as poseDetection from '@tensorflow-models/pose-detection'

// export async function createDetector() {
// }

// export async function estimatePoses(detector, video) {
//   // Uncoment for magic
//   // console.log('waiting 5 seconds')
//   // await new Promise(resolve => setTimeout(resolve, 500))
//   // console.log('5 seconds done')
//   if (window.d) return window.d
//   window.d = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
//     enableSmoothing: true,
//     modelType: 'lite',
//     runtime: 'mediapipe',
//     solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
//   })
//   return await window.d.estimatePoses(document.getElementsByTagName('video')[0])
// }
// window.estimatePoses = estimatePoses