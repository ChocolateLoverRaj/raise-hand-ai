import Position from '../Position'
import Input from './Input'

const drawShoulderToBottomCorner = ({ ctx, relativePositionBottomCorner, shoulderPosition }: Input): void => {
  const wristPosition: Position = {
    x: shoulderPosition.x + relativePositionBottomCorner.x,
    y: shoulderPosition.y + relativePositionBottomCorner.y
  }
  ctx.beginPath()
  ctx.moveTo(shoulderPosition.x, shoulderPosition.y)
  ctx.lineTo(wristPosition.x, wristPosition.y)
  ctx.setLineDash([10])
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.stroke()
}

export default drawShoulderToBottomCorner
