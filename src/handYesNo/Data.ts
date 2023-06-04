import Side from '../raiseHandProgress/Side'
import OnResult from './OnResult'

interface BaseData {
  raiseTime: number
  yesHand: Side
  timeoutId: any | undefined
  onResult: OnResult
  canYes: boolean
  canNo: boolean
}

type Data = BaseData & ({
  raised: true
  raisedData: {
    side: Side
    startTime: number
  }
} | {
  raised: false
})

export default Data
