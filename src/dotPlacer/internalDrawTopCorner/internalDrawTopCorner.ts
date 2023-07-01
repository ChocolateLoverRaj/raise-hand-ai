import Position from '../Position'
import Input from './Input'
import drawShoulderToBottomCorner from '../drawShoulderToBottomCorner/drawShoulderToBottomCorner'
import drawTarget from '../drawTarget/drawTarget'

const internalDrawTopCorner = ({ ctx, relativePositionBottomCorner, shoulderPosition, relativePositionTopCorner }: Input): void => {
  const size = 50
  const topCorner: Position = {
    x: shoulderPosition.x + relativePositionTopCorner.x,
    y: shoulderPosition.y + relativePositionTopCorner.y
  }
  const bottomCorner: Position = {
    x: shoulderPosition.x + relativePositionBottomCorner.x,
    y: shoulderPosition.y + relativePositionBottomCorner.y
  }
  drawShoulderToBottomCorner({
    ctx,
    shoulderPosition,
    relativePositionBottomCorner
  })

  ctx.setLineDash([10])
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.moveTo(bottomCorner.x, bottomCorner.y)
  ctx.lineTo(bottomCorner.x, topCorner.y)
  ctx.lineTo(topCorner.x, topCorner.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(bottomCorner.x, bottomCorner.y)
  ctx.lineTo(topCorner.x, bottomCorner.y)
  ctx.lineTo(topCorner.x, topCorner.y)
  ctx.stroke()

  drawTarget({
    ctx,
    size,
    position: topCorner
  })
}

export default internalDrawTopCorner
