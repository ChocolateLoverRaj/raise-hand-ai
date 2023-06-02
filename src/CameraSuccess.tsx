import { FC } from 'react'
import ChooseCamera from './ChooseCamera'
import Detector from './Detector'

const CameraSuccess: FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <ChooseCamera />
      <br />
      <div
        style={{
          flexGrow: 1
        }}
      >
        <Detector />
      </div>
    </div>
  )
}

export default CameraSuccess
