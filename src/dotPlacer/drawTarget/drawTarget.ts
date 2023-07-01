import target from './target.svg'
import Input from './Input'

const drawTarget = ({ ctx, position, size }: Input): void => {
  const img = new Image()
  img.src = target
  ctx.drawImage(img, position.x - size / 2, position.y - size / 2, size, size)
}

export default drawTarget
