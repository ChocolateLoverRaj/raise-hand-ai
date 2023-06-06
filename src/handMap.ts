import Side from './raiseHandProgress/Side'

export interface Hand {
  wrist: number
  shoulder: number
}

/**
 * Mapping of hand (0 for left, 1 for right) to keypoint:
 * https://github.com/tensorflow/tfjs-models/tree/master/pose-detection#coco-keypoints-used-in-movenet-and-posenet
 */
const handMap: Map<Side, Hand> = new Map([
  [Side.LEFT, {
    wrist: 16,
    shoulder: 12
  }],
  [Side.RIGHT, {
    wrist: 15,
    shoulder: 11
  }]
])

export default handMap
