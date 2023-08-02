import internalDrawTopCorner from '../../dotPlacer/internalDrawTopCorner/internalDrawTopCorner'
import YesNoData from '../../handYesNo/Data'
import HandYesNo from '../../handYesNo/HandYesNo'
import cleanupYesNo from '../../handYesNo/cleanup'
import tickHandYesNo from '../../handYesNo/tick'
import sideNames from '../../sideNames'
import Heading from '../Heading'
import SceneFns from '../SceneFns'
import AfterCalibrateTopCornerData from './AfterCalibrateTopCornerData'
import getShoulderPosition from './getShoulderPosition'

interface ConfirmBottomCornerData extends AfterCalibrateTopCornerData {
  yesNo: YesNoData
}
const confirmTopCornerFns: SceneFns<ConfirmBottomCornerData> = {
  tick: ({ data, pose, ctx }) => {
    if (pose !== undefined) {
      internalDrawTopCorner({
        ctx,
        shoulderPosition: getShoulderPosition(pose, data.side),
        relativePositionBottomCorner: data.bottomCornerRelativePosition,
        relativePositionTopCorner: data.topCornerRelativePosition
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
    <Heading>
      <h1>Confirm top {sideNames.get(1 - data.side)} corner position</h1>
      <HandYesNo
        data={data.yesNo}
        noNode='Back'
        yesNode='Continue'
        yesFrequency='F5'
      />
    </Heading>),
  cleanup: ({ yesNo }) => {
    cleanupYesNo(yesNo)
  }
}

export default confirmTopCornerFns
