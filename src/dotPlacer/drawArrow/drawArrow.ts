import Input from './Input'

const drawArrow = ({ angle, ctx, arrowLinesAngle, point, arrowLineLength }: Input): void => {
  ctx.lineCap = 'round'
  {
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    const lineAngle = angle + Math.PI - arrowLinesAngle
    ctx.lineTo(point.x + Math.cos(lineAngle) * arrowLineLength, point.y + Math.sin(lineAngle) * arrowLineLength)
    ctx.stroke()
  }
  {
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    const lineAngle = angle + Math.PI + arrowLinesAngle
    ctx.lineTo(point.x + Math.cos(lineAngle) * arrowLineLength, point.y + Math.sin(lineAngle) * arrowLineLength)
    ctx.stroke()
  }
}

export default drawArrow
