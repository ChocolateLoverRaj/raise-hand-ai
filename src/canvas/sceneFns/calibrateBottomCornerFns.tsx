import DotPlacerData from '../../dotPlacer/Data'
import cleanupDotPlacer from '../../dotPlacer/cleanup'
import drawWithPose from '../../dotPlacer/drawWithPose'
import tickDotPlacer from '../../dotPlacer/tick/tick'
import YesNoData from '../../handYesNo/Data'
import HandYesNo from '../../handYesNo/HandYesNo'
import cleanupYesNo from '../../handYesNo/cleanup'
import ProgressBar from '../../handYesNo/progressBar/ProgressBar'
import tickHandYesNo from '../../handYesNo/tick'
import YesSound from '../../handYesNo/yesSound/YesSound'
import Side from '../../raiseHandProgress/Side'
import sideNames from '../../sideNames'
import SceneFns from '../SceneFns'

const stayStillTime = 2000
// FIXME: ignore hand when it's outside the view of the camera
const calibrateBottomCornerFns: SceneFns<{
  side: Side
  yesNo: YesNoData
  dotPlacer: DotPlacerData
}> = {
  tick: ({ data, pose, ctx, unscaledSize }) => {
    if (pose !== undefined) {
      drawWithPose(ctx, pose, data.side)
      const newYesNoData = tickHandYesNo(data.yesNo, pose)
      const newDotPlacerData = newYesNoData.raised
        ? cleanupDotPlacer(data.dotPlacer)
        : tickDotPlacer({
          data: data.dotPlacer,
          pose,
          unscaledSize
        })

      return {
        ...data,
        yesNo: newYesNoData,
        dotPlacer: newDotPlacerData
      }
    }
    return data
  },
  render: data => (
    <>
      <h1>
        {data.dotPlacer.earliestPositionEntry !== undefined && (Date.now() - data.dotPlacer.earliestPositionEntry.startTime) / stayStillTime > 0.25
          ? (
            <>
              Keep your hand in place
              <YesSound frequency='G4' />
            </>)
          : (
            <>Move ur {sideNames.get(data.side)} hand to the
              bottom {sideNames.get(1 - data.side)} corner
            </>)}
      </h1>
      {data.dotPlacer.earliestPositionEntry !== undefined && (
        <>
          <ProgressBar
            startTime={data.dotPlacer.earliestPositionEntry.startTime}
            totalTime={stayStillTime}
            style={{
              backgroundColor: 'yellow'
            }}
          />
        </>)}
      <HandYesNo
        data={data.yesNo}
        yesNode={undefined}
        noNode={undefined}
        yesFrequency={NaN}
      />
    </>
  ),
  cleanup: ({ dotPlacer, yesNo }) => {
    cleanupYesNo(yesNo)
    cleanupDotPlacer(dotPlacer)
  }
}

export default calibrateBottomCornerFns
