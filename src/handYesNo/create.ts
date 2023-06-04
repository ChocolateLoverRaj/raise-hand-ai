import Side from '../raiseHandProgress/Side'
import Data from './Data'
import OnResult from './OnResult'

const create = (raiseTime: number, yesHand: Side, onResult: OnResult, canNo: boolean, canYes: boolean): Data => ({
  raiseTime,
  raised: false,
  yesHand,
  timeoutId: undefined,
  onResult,
  canNo,
  canYes
})

export default create
