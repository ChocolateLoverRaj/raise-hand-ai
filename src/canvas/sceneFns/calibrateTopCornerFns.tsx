import never from 'never'
import { stayStillTime } from '../../config'
import DotPlacerData from '../../dotPlacer/Data'
import Position from '../../dotPlacer/Position'
import cleanupDotPlacer from '../../dotPlacer/cleanup'
import drawTopCornerWithPose from '../../dotPlacer/drawTopCornerWithPose/drawTopCornerWithPose'
import tickDotPlacer from '../../dotPlacer/tick/tick'
import handMap from '../../handMap'
import YesNoData from '../../handYesNo/Data'
import HandYesNo from '../../handYesNo/HandYesNo'
import cleanupYesNo from '../../handYesNo/cleanup'
import ProgressBar from '../../handYesNo/progressBar/ProgressBar'
import tickHandYesNo from '../../handYesNo/tick'
import YesSound from '../../handYesNo/yesSound/YesSound'
import sideNames from '../../sideNames'
import SceneFns from '../SceneFns'
import AfterCalibrateBottomCornerData from './afterCalibrateBottomCornerData'
import Side from '../../raiseHandProgress/Side'

interface CalibrateTopCornerData extends AfterCalibrateBottomCornerData {
  dotPlacer: DotPlacerData
  yesNo: YesNoData
}

const calibrateTopCornerFns: SceneFns<CalibrateTopCornerData> = {
  tick: ({ ctx, data, pose, unscaledSize }) => {
    if (pose !== undefined) {
      drawTopCornerWithPose({
        ctx,
        pose,
        side: data.side,
        bottomCornerRelativePos: data.bottomCornerRelativePosition
      })
      const newYesNoData = tickHandYesNo(data.yesNo, pose)
      const { shoulder } = handMap.get(data.side) ?? never()
      const shoulderPoint = pose.keypoints[shoulder]
      const bottomCornerPos: Position = {
        x: shoulderPoint.x + data.bottomCornerRelativePosition.x,
        y: shoulderPoint.y + data.bottomCornerRelativePosition.y
      }
      const boundaryX2: Position = {
        x: data.side === Side.LEFT ? 0 : unscaledSize.width,
        y: 0
      }
      const newDotPlacerData = newYesNoData.raised
        ? cleanupDotPlacer(data.dotPlacer)
        : tickDotPlacer({
          data: data.dotPlacer,
          pose,
          boundaryRect: {
            pos1: bottomCornerPos,
            pos2: boundaryX2
          }
        })

      return {
        ...data,
        yesNo: newYesNoData,
        dotPlacer: newDotPlacerData
      }
    }
    return data
  },
  render: ({ dotPlacer, side, yesNo }) => (
    <>
      <h1>
        {dotPlacer.earliestPositionEntry !== undefined && (Date.now() - dotPlacer.earliestPositionEntry.startTime) / stayStillTime > 0.25
          ? (
            <>
              Keep your hand in place
              <YesSound frequency='G4' />
            </>)
          : (
            <>Move ur {sideNames.get(side)} hand to the
              top {sideNames.get(side)} corner
            </>)}
      </h1>
      {dotPlacer.earliestPositionEntry !== undefined && (
        <>
          <ProgressBar
            startTime={dotPlacer.earliestPositionEntry.startTime}
            totalTime={stayStillTime}
            style={{
              backgroundColor: 'yellow'
            }}
          />
        </>)}
      <HandYesNo
        data={yesNo}
        yesNode={undefined}
        noNode={undefined}
        yesFrequency={NaN}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '50%',
          height: '50%',
          backgroundColor: 'red'
        }}
      />
    </>
  ),
  cleanup: ({ dotPlacer, yesNo }) => {
    cleanupYesNo(yesNo)
    cleanupDotPlacer(dotPlacer)
  }
}

export default calibrateTopCornerFns
