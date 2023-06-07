import Position from '../../dotPlacer/Position'
import drawWithPosition from '../../dotPlacer/drawWithPosition'
import drawCalibrationBox from '../../drawCalibrationBox/drawCalibrationBox'
import YesNoData from '../../handYesNo/Data'
import HandYesNo from '../../handYesNo/HandYesNo'
import cleanupYesNo from '../../handYesNo/cleanup'
import tickHandYesNo from '../../handYesNo/tick'
import Side from '../../raiseHandProgress/Side'
import sideNames from '../../sideNames'
import SceneFns from '../SceneFns'

const confirmBottomCornerFns: SceneFns<{
  side: Side
  bottomCornerPosition: Position
  yesNo: YesNoData
}> = {
  tick: ({ data, pose, ctx }) => {
    drawCalibrationBox({
      ctx,
      bottomPoint: data.bottomCornerPosition,
      topPoint: undefined,
      bottomPointSide: data.side
    })
    drawWithPosition(ctx, data.bottomCornerPosition)
    if (pose !== undefined) {
      return {
        ...data,
        yesNo: tickHandYesNo(data.yesNo, pose)
      }
    } else {
      return data
    }
  },
  render: data => (
    <>
      <h1>Confirm bottom {sideNames.get(1 - data.side)} corner position</h1>
      <HandYesNo
        data={data.yesNo}
        noNode='Back'
        yesNode='Continue'
        yesFrequency='B4'
      />
    </>),
  cleanup: ({ yesNo }) => {
    cleanupYesNo(yesNo)
  }
}

export default confirmBottomCornerFns
