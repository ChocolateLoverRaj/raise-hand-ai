import { Keypoint } from '@tensorflow-models/pose-detection'

// TODO: Make customizable
/**
 * Angle, in radians, within a vertical angle.
 * This will determine if it is classified as raised or not raised.
 */
const angleMargin = Math.PI * 0.25

const angleAtTop = Math.PI * 0.5

const isHandRaised = (wrist: Keypoint, elbow: Keypoint): boolean => {
  // For some reason y is from the top, not from the bottom
  // If their hand is above their wrist, wrist.y < elbow.y
  const angle = Math.atan2(elbow.y - wrist.y, elbow.x - wrist.x)
  const diff = Math.abs(angle - angleAtTop)
  return diff < angleMargin
}

export default isHandRaised
