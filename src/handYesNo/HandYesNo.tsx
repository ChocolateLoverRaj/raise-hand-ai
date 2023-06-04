import { FC } from 'react'
import Props from './Props'
import { IoArrowBack, IoArrowForward, IoHandLeft, IoHandRight } from 'react-icons/io5'
import Side from '../raiseHandProgress/Side'
import ProgressBar from './progressBar/ProgressBar'
import NoSound from './NoSound'
import YesSound from './yesSound/YesSound'

const HandYesNo: FC<Props> = ({ data, noNode, yesNode, yesFrequency }) => {
  const { yesHand, raiseTime, canNo, canYes } = data
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
        {canNo && (
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IoArrowBack />
            {noHand === Side.LEFT ? <IoHandLeft /> : <IoHandRight />}
            {noNode}
          </h2>)}
      </div>
      <div>
        {canYes && (
          <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {yesNode}
            {yesHand === Side.LEFT ? <IoHandLeft /> : <IoHandRight />}
            <IoArrowForward />
          </h2>)}
      </div>
      <div>
        {canNo && data.raised && data.raisedData.side === noHand && (
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
        {canYes && data.raised && data.raisedData.side === yesHand && (
          <>
            <ProgressBar
              startTime={data.raisedData.startTime}
              totalTime={raiseTime}
              style={{
                backgroundColor: 'yellow'
              }}
            />
            <YesSound frequency={yesFrequency} />
          </>
        )}
      </div>
    </div>
  )
}

export default HandYesNo
