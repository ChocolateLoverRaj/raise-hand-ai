import { FC, useEffect } from 'react'
import * as Tone from 'tone'

const YesSound: FC = () => {
  useEffect(() => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttack('E4')

    return () => {
      synth.dispose()
    }
  }, [])

  return null
}

export default YesSound
