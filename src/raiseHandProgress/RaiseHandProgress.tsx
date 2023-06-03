import { FC, useLayoutEffect, useRef } from 'react'
import Props from './Props'
import Side from './Side'
import * as Tone from 'tone'

const RaiseHandProgress: FC<Props> = ({ side, startTime, totalTime }) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease('C4', 1)

    ref.current?.animate([{
      width: '0%',
      marginLeft: '50%'
    }, {
      width: '50%',
      marginLeft: `${side === Side.LEFT ? 0 : 50}%`
    }], {
      duration: Math.max(startTime + totalTime - Date.now(), 0),
      fill: 'forwards',
      delay: startTime - Date.now(),
      easing: 'linear'
    })

    return () => {
      synth.dispose()
    }
  }, [startTime, totalTime, side])

  return (
    <div
      ref={ref}
      style={{
        marginLeft: '50%',
        width: '0%',
        height: '1em',
        backgroundColor: 'yellow'
      }}
    />
  )
}

export default RaiseHandProgress
