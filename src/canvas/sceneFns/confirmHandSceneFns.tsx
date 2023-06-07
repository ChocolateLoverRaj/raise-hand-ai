import { stayStillTime } from '../../config'
import YesNoData from '../../handYesNo/Data'
import HandYesNo from '../../handYesNo/HandYesNo'
import cleanup from '../../handYesNo/cleanup'
import tick from '../../handYesNo/tick'
import sideNames from '../../sideNames'
import SceneFns from '../SceneFns'

const confirmHandSceneFns: SceneFns<YesNoData> = {
  tick: ({ data, pose }) => {
    if (pose !== undefined) {
      return tick(data, pose)
    }
    return data
  },
  render: data => (
    <>
      <h1>Calibrate {sideNames.get(data.yesHand)} hand</h1>
      <h2>
        After this message, move ur hand to the
        bottom {sideNames.get(1 - data.yesHand)} corner and hold it there
        for {stayStillTime / 1000} seconds
      </h2>
      <HandYesNo
        data={data}
        noNode={<>Raise {sideNames.get(1 - data.yesHand)} hand to go back to change the calibration hand.</>}
        yesNode={<>Raise {sideNames.get(data.yesHand)} hand to continue</>}
        yesFrequency='E4'
      />
    </>
  ),
  cleanup: cleanup
}

export default confirmHandSceneFns
