export interface Hand {
  wrist: number
  elbow: number
}

/**
 * Mapping of hand (0 for left, 1 for right) to keypoint:
 * https://github.com/tensorflow/tfjs-models/tree/master/pose-detection#coco-keypoints-used-in-movenet-and-posenet
 */
const handMap: [Hand, Hand] = [{
  wrist: 9,
  elbow: 7
}, {
  wrist: 10,
  elbow: 8
}]

export default handMap
