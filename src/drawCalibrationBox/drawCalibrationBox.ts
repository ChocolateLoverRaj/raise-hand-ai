import never from 'never'
import Position from '../dotPlacer/Position'
import drawArrow from '../dotPlacer/drawArrow/drawArrow'
import handMap from '../handMap'
import Side from '../raiseHandProgress/Side'
import Input from './Input'

const drawCalibrationBox = ({
  ctx,
  bottomPointRelativePos,
  topPointRelativePos,
  bottomPointSide,
  pose
}: Input): void => {
  const shoulderPoint = pose.keypoints[(handMap.get(bottomPointSide) ?? never()).shoulder]
  const bottomPoint: Position = {
    x: shoulderPoint.x + bottomPointRelativePos.x,
    y: shoulderPoint.y + bottomPointRelativePos.y
  }

  const pointRadius = 7.5
  ctx.beginPath()
  ctx.moveTo(bottomPoint.x, bottomPoint.y)
  ctx.arc(bottomPoint.x, bottomPoint.y, pointRadius, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()

  // TODO: lines and top point
  if (topPointRelativePos === undefined) {
    const rayLength = 50
    ctx.lineWidth = 3
    ctx.strokeStyle = 'white'
    const arrowLienLength = 10
    const arrowLinesAngle = Math.PI / 4
    {
      ctx.beginPath()
      ctx.moveTo(bottomPoint.x, bottomPoint.y)
      const endPoint: Position = {
        x: bottomPoint.x + rayLength * (bottomPointSide === Side.LEFT ? -1 : 1),
        y: bottomPoint.y
      }
      ctx.lineTo(endPoint.x, endPoint.y)
      ctx.stroke()
      drawArrow({
        ctx,
        angle: bottomPointSide === Side.LEFT ? Math.PI : 0,
        point: endPoint,
        arrowLinesAngle: arrowLinesAngle,
        arrowLineLength: arrowLienLength
      })
    }
    {
      ctx.beginPath()
      ctx.moveTo(bottomPoint.x, bottomPoint.y)
      const endPoint: Position = {
        x: bottomPoint.x,
        y: bottomPoint.y - rayLength
      }
      ctx.lineTo(endPoint.x, endPoint.y)
      ctx.stroke()
      drawArrow({
        ctx,
        angle: 3 / 2 * Math.PI,
        point: endPoint,
        arrowLinesAngle: arrowLinesAngle,
        arrowLineLength: arrowLienLength
      })
    }
  }
}

export default drawCalibrationBox
