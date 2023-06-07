import { Pose, SupportedModels, util } from '@tensorflow-models/pose-detection'
import colorBetween from 'color-between'

const drawPoses = (ctx: CanvasRenderingContext2D, minScore: number, poses: Pose[]): void => {
  poses.forEach(pose => {
    if (pose.score !== undefined && pose.score < minScore) return

    pose.keypoints.forEach(({ score, x, y }) => {
      ctx.fillStyle = colorBetween('#ff0000', '#00ff00', score ?? 1, 'hex')
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
      ctx.fill()
    })

    util.getAdjacentPairs(SupportedModels.BlazePose).forEach(([a, b]) => {
      const pointA = pose.keypoints[a]
      const pointB = pose.keypoints[b]

      ctx.setLineDash([])
      ctx.lineWidth = 2
      ctx.strokeStyle = colorBetween('#ff0000', '#00ff00', ((pointA.score ?? 1) + (pointB.score ?? 1)) / 2, 'hex')
      ctx.beginPath()
      ctx.moveTo(pointA.x, pointA.y)
      ctx.lineTo(pointB.x, pointB.y)
      ctx.stroke()
    })
  })
}

export default drawPoses
