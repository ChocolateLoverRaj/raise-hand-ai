import { FC } from 'react'
import ChooseCamera from './ChooseCamera'
import Detector from './Detector'

const CameraSuccess: FC = () => {
  return (
    <>
      <ChooseCamera />
      <br />
      <Detector />
    </>
  )
}

export default CameraSuccess
