import { FC } from 'react'
import Props from './Props'
import { IoArrowBack, IoArrowForward, IoHandLeft, IoHandRight } from 'react-icons/io5'
import Side from '../raiseHandProgress/Side'
import ProgressBar from './progressBar/ProgressBar'
import NoSound from './NoSound'
import YesSound from './YesSound'

const HandYesNo: FC<Props> = ({ data, noNode, yesNode, showNo, showYes }) => {
  const { yesHand, raiseTime } = data
  const noHand = 1 - yesHand

  return (
    <div
      style={{
        display: 'grid',
        width: '100%',
        gridTemplateColumns: '1fr 1fr',
        verticalAlign: 'middle'
      }}
    >
      <div>
        {showNo && (
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IoArrowBack />
            {noHand === Side.LEFT ? <IoHandLeft /> : <IoHandRight />}
            {noNode}
          </h2>)}
      </div>
      <div>
        {showYes && (
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {yesNode}
            {yesHand === Side.LEFT ? <IoHandLeft /> : <IoHandRight />}
            <IoArrowForward />
          </h2>)}
      </div>
      <div>
        {showNo && data.raised && data.raisedData.side === noHand && (
          <>
            <ProgressBar
              startTime={data.raisedData.startTime}
              totalTime={raiseTime}
              style={{
                backgroundColor: 'red'
              }}
            />
            <NoSound />
          </>
        )}
      </div>
      <div>
        {showYes && data.raised && data.raisedData.side === yesHand && (
          <>
            <ProgressBar
              startTime={data.raisedData.startTime}
              totalTime={raiseTime}
              style={{
                backgroundColor: 'yellow'
              }}
            />
            <YesSound />
          </>
        )}
      </div>
    </div>
  )
}

export default HandYesNo
