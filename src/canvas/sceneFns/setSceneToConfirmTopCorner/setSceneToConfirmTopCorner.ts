import createYesNo from '../../../handYesNo/create'
import Scene from '../../Scene'
import Input from './Input'
import * as Tone from 'tone'

const setSceneToConfirmTopCorner = ({
  setScene,
  bottomCornerRelativePosition,
  raisedHand,
  goBack,
  topCornerRelativePosition
}: Input): void => {
  setScene(Scene.CONFIRM_TOP_CORNER, {
    bottomCornerRelativePosition,
    yesNo: createYesNo(1000, raisedHand, yes => {
      if (yes) {
        const synth = new Tone.Synth().toDestination()
        synth.triggerAttackRelease('G5', '4n')
        console.log('yes')
      } else {
        goBack()
      }
    }, true, true),
    side: raisedHand,
    topCornerRelativePosition: topCornerRelativePosition
  })
}

export default setSceneToConfirmTopCorner
