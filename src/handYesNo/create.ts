import Side from '../raiseHandProgress/Side'
import Data from './Data'
import OnResult from './OnResult'

const create = (raiseTime: number, yesHand: Side, onResult: OnResult): Data => ({
  raiseTime,
  raised: false,
  yesHand,
  timeoutId: undefined,
  onResult
})

export default create
