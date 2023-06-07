import Scene from './Scene'
import SceneFns from './SceneFns'
import calibrateBottomCornerFns from './sceneFns/calibrateBottomCornerFns'
import confirmBottomCornerFns from './sceneFns/confirmBottomCornerFns'
import confirmHandSceneFns from './sceneFns/confirmHandSceneFns'
import raiseHandSceneFns from './sceneFns/raiseHandSceneFns'

const sceneMap = new Map<Scene, SceneFns<any>>([
  [Scene.RAISE_HAND, raiseHandSceneFns],
  [Scene.CONFIRM_HAND, confirmHandSceneFns],
  [Scene.CALIBRATE_BOTTOM_CORNER, calibrateBottomCornerFns],
  [Scene.CONFIRM_BOTTOM_CORNER, confirmBottomCornerFns]
])

export default sceneMap
