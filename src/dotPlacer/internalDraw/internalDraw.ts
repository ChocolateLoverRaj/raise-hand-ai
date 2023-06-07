import target from './target.svg'
import Position from '../Position'
import Input from './Input'

const internalDraw = ({ ctx, relativePosition, shoulderPosition }: Input): void => {
  const img = new Image()
  img.src = target
  const size = 50
  const wristPosition: Position = {
    x: shoulderPosition.x + relativePosition.x,
    y: shoulderPosition.y + relativePosition.y
  }
  ctx.drawImage(img, wristPosition.x - size / 2, wristPosition.y - size / 2, size, size)
  ctx.beginPath()
  ctx.moveTo(shoulderPosition.x, shoulderPosition.y)
  ctx.lineTo(wristPosition.x, wristPosition.y)
  ctx.setLineDash([10])
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.stroke()
}

export default internalDraw
