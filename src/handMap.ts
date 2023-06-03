import Side from './raiseHandProgress/Side'

export interface Hand {
  wrist: number
}

/**
 * Mapping of hand (0 for left, 1 for right) to keypoint:
 * https://github.com/tensorflow/tfjs-models/tree/master/pose-detection#coco-keypoints-used-in-movenet-and-posenet
 */
const handMap: Map<Side, Hand> = new Map([
  [Side.LEFT, {
    wrist: 16
  }],
  [Side.RIGHT, {
    wrist: 15
  }]
])

export default handMap
