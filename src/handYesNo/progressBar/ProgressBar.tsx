import { FC, useLayoutEffect, useRef } from 'react'
import Props from './Props'

const ProgressBar: FC<Props> = ({ style, startTime, totalTime }) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const animation = ref.current?.animate([{
      width: '0%'
    }, {
      width: '100%'
    }], {
      duration: Math.max(startTime + totalTime - Date.now(), 0),
      fill: 'forwards',
      delay: startTime - Date.now(),
      easing: 'linear'
    })

    return () => {
      animation?.cancel()
    }
  }, [startTime, totalTime])

  return (
    <div
      ref={ref}
      style={{
        ...style,
        width: '0%',
        height: '1em'
      }}
    />
  )
}

export default ProgressBar
