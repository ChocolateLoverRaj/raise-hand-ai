import { FC, useLayoutEffect, useRef, useState } from 'react'
import Props from './Props'

const FixedHeightMessage: FC<Props> = ({ messages, messageToShow }) => {
  const allRef = useRef<Array<HTMLDivElement | null>>([])
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const elements = allRef.current.filter((element): element is HTMLDivElement => element !== null)
    const resizeObserver = new ResizeObserver(() => {
      const maxHeight = elements.reduce((maxHeight, element) => {
        return Math.max(maxHeight, element.offsetHeight)
      }, 0)
      setHeight(maxHeight)
    })
    elements.forEach(element => resizeObserver.observe(element))

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        height
      }}
    >
      {messages.map(({ key, node }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            visibility: key === messageToShow ? 'visible' : 'hidden'
          }}
          ref={ref => allRef.current.push(ref)}
        >
          {node}
        </div>
      ))}
    </div>
  )
}

export default FixedHeightMessage
