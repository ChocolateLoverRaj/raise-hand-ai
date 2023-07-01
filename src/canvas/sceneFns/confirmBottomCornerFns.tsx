import drawAfterPlace from '../../dotPlacer/drawAfterPlace/drawAfterPlace'
import drawCalibrationBox from '../../drawCalibrationBox/drawCalibrationBox'
import YesNoData from '../../handYesNo/Data'
import HandYesNo from '../../handYesNo/HandYesNo'
import cleanupYesNo from '../../handYesNo/cleanup'
import tickHandYesNo from '../../handYesNo/tick'
import sideNames from '../../sideNames'
import SceneFns from '../SceneFns'
import AfterCalibrateBottomCornerData from './afterCalibrateBottomCornerData'

interface ConfirmBottomCornerData extends AfterCalibrateBottomCornerData {
  yesNo: YesNoData
}
const confirmBottomCornerFns: SceneFns<ConfirmBottomCornerData> = {
  tick: ({ data, pose, ctx }) => {
    if (pose !== undefined) {
      drawCalibrationBox({
        ctx,
        bottomPointRelativePos: data.bottomCornerRelativePosition,
        topPointRelativePos: undefined,
        bottomPointSide: data.side,
        pose
      })
      drawAfterPlace({
        ctx,
        relativePosition: data.bottomCornerRelativePosition,
        pose,
        side: data.side
      })
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
