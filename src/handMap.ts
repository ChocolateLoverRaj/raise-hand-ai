import Side from './raiseHandProgress/Side'

export interface SideKeypoints {
  wrist: number
  elbow: number
  shoulder: number
  waist: number
}

/**
 * Mapping of hand (0 for left, 1 for right) to keypoint:
 * https://github.com/tensorflow/tfjs-models/tree/master/pose-detection#coco-keypoints-used-in-movenet-and-posenet
 */
const handMap: Map<Side, SideKeypoints> = new Map([
  [Side.LEFT, {
    wrist: 16,
    elbow: 14,
    shoulder: 12,
    waist: 24
  }],
  [Side.RIGHT, {
    wrist: 15,
    elbow: 13,
    shoulder: 11,
    waist: 23
  }]
])

export default handMap
