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
    wrist: 10,
    elbow: 8,
    shoulder: 6,
    waist: 12
  }],
  [Side.RIGHT, {
    wrist: 9,
    elbow: 7,
    shoulder: 5,
    waist: 11
  }]
])

export default handMap
