import { FC, useRef } from 'react'
import ChooseCamera from './ChooseCamera'
import Detector from './detector/Detector'

const CameraSuccess: FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <ChooseCamera />
      <div
        ref={containerRef}
        style={{
          flexGrow: 1,
          height: '100%'
        }}
      >
        <Detector containerRef={containerRef} />
      </div>
    </div>
  )
}

export default CameraSuccess
