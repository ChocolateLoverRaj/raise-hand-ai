import { FC, useEffect } from 'react'
import * as Tone from 'tone'
import Props from './Props'

const YesSound: FC<Props> = ({ frequency }) => {
  useEffect(() => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttack(frequency)

    return () => {
      synth.dispose()
    }
  }, [])

  return null
}

export default YesSound
