import { FC } from 'react'
import CanCamera from './CanCamera'

const HandRaised: FC = () => {
  return (
    <>
      {navigator?.mediaDevices?.getUserMedia !== undefined
        ? <CanCamera />
        : 'Your browser cannot give this page camera access'}
    </>
  )
}

export default HandRaised
