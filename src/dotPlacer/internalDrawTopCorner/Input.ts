import Position from '../Position'

interface Input {
  ctx: CanvasRenderingContext2D
  relativePositionBottomCorner: Position
  relativePositionTopCorner: Position
  shoulderPosition: Position
}

export default Input
