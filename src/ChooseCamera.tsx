import { observer } from 'mobx-react-lite'
import { useContext } from 'react'
import mobxMediaDevices from './mobxMediaDevices'
import switchCamera from './switchCamera'
import VideoContext from './VideoContext'

const ChooseCamera = observer(() => {
  const videoPromise = useContext(VideoContext)

  if (!(mobxMediaDevices.wasExecuted || mobxMediaDevices.isExecuting)) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    mobxMediaDevices.execute().catch()
  }

  return (
    <>
      {mobxMediaDevices.wasSuccessful
        ? (
          <select
            value={videoPromise.result.getVideoTracks()[0].getSettings().deviceId}
            onChange={async ({ target: { value: deviceId } }) =>
              await switchCamera(videoPromise, deviceId)}
          >
            {mobxMediaDevices.result
              .filter(({ kind }) => kind === 'videoinput')
              .map(({ deviceId, label }) =>
                <option key={deviceId} value={deviceId}>{label}</option>)}
          </select>)
        : (
          <select value='only' disabled>
            <option value='only'>
              {mobxMediaDevices.isExecuting
                ? 'Getting list of cameras'
                : 'Error getting list of cameras'}
            </option>
          </select>)}
    </>
  )
})

export default ChooseCamera
