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
import AfterCalibrateBottomCornerData from './AfterCalibrateBottomCornerData'
import Side from '../../raiseHandProgress/Side'
import Heading from '../Heading'
import aspectFit from 'aspect-fit'
import WarningFlash from '../../warningFlash/WarningFlash'
import Size from '../../dotPlacer/tick/Size'
import pointInPolygon from 'point-in-polygon'

interface CalibrateTopCornerData extends AfterCalibrateBottomCornerData {
  dotPlacer: DotPlacerData
  yesNo: YesNoData
  invalidPosition: {
    scale: number
    bottomCornerPos: Position
    unscaledSize: Size
  } | undefined
}

const warningFlash = {
  color: 'red',
  startOpacity: 0,
  endOpacity: 0.7
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
      const { shoulder, wrist } = handMap.get(data.side) ?? never()
      const shoulderPoint = pose.keypoints[shoulder]
      const bottomCornerPos: Position = {
        x: shoulderPoint.x + data.bottomCornerRelativePosition.x,
        y: shoulderPoint.y + data.bottomCornerRelativePosition.y
      }
      const boundaryPos2: Position = {
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
            pos2: boundaryPos2
          }
        })

      const wristPos = pose.keypoints[wrist]
      const isOnScreen = pointInPolygon([wristPos.x, wristPos.y], [
        [unscaledSize.width, 0],
        [unscaledSize.width, unscaledSize.height],
        [0, unscaledSize.height],
        [0, 0]
      ])
      const isInvalid = isOnScreen && !pointInPolygon([wristPos.x, wristPos.y], [
        [bottomCornerPos.x, bottomCornerPos.y],
        [bottomCornerPos.x, boundaryPos2.y],
        [boundaryPos2.x, boundaryPos2.y],
        [boundaryPos2.x, bottomCornerPos.y]
      ])
      const { scale } = aspectFit(unscaledSize.width, unscaledSize.height, ctx.canvas.offsetWidth, ctx.canvas.offsetHeight)

      return {
        ...data,
        yesNo: newYesNoData,
        dotPlacer: newDotPlacerData,
        invalidPosition: isInvalid
          ? {
              bottomCornerPos,
              scale,
              unscaledSize
            }
          : undefined
      }
    }
    return {
      ...data,
      invalidPosition: undefined
    }
  },
  render: ({ dotPlacer, side, yesNo, invalidPosition: invalidPos }) => (
    <>
      <Heading>
        <h1>
          {dotPlacer.earliestPositionEntry !== undefined && (Date.now() - dotPlacer.earliestPositionEntry.startTime) / stayStillTime > 0.25
            ? (
              <>
                Keep your hand in place
                <YesSound frequency='D5' />
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
      </Heading>
      {invalidPos !== undefined && (
        <>
          <WarningFlash
            divProps={{
              style: {
                position: 'absolute',
                left: 0,
                top: invalidPos.bottomCornerPos.y * invalidPos.scale,
                width: invalidPos.unscaledSize.width * invalidPos.scale,
                height: (invalidPos.unscaledSize.height - invalidPos.bottomCornerPos.y) * invalidPos.scale,
                backgroundColor: warningFlash.color
              }
            }}
            startOpacity={warningFlash.startOpacity}
            endOpacity={warningFlash.endOpacity}
          />
          <WarningFlash
            divProps={{
              style: {
                position: 'absolute',
                ...dotPlacer.side === Side.LEFT
                  ? {
                      left: invalidPos.bottomCornerPos.x * invalidPos.scale,
                      width: (invalidPos.unscaledSize.width - invalidPos.bottomCornerPos.x) * invalidPos.scale
                    }
                  : {
                      left: 0,
                      width: invalidPos.bottomCornerPos.x * invalidPos.scale
                    },
                top: 0,
                height: invalidPos.bottomCornerPos.y * invalidPos.scale,
                backgroundColor: warningFlash.color
              }
            }}
            startOpacity={warningFlash.startOpacity}
            endOpacity={warningFlash.endOpacity}
          />
        </>)}
    </>
  ),
  cleanup: ({ dotPlacer, yesNo }) => {
    cleanupYesNo(yesNo)
    cleanupDotPlacer(dotPlacer)
  }
}

export default calibrateTopCornerFns
