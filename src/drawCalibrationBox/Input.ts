import Position from '../dotPlacer/Position'
import Side from '../raiseHandProgress/Side'

interface Input {
  ctx: CanvasRenderingContext2D
  bottomPoint: Position
  bottomPointSide: Side
  topPoint: Position | undefined
}

export default Input
