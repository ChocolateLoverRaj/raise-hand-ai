import target from './target.svg'
import Position from './Position'

const drawWithPosition = (ctx: CanvasRenderingContext2D, { x, y }: Position): void => {
  const img = new Image()
  img.src = target
  const size = 50
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size)
}

export default drawWithPosition
