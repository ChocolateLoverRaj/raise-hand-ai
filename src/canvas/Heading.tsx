import { FC, PropsWithChildren } from 'react'

const Heading: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 255, 0, 0.5)'
      }}
    >
      <div
        style={{
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default Heading
