import { FC, useEffect } from 'react'
import * as Tone from 'tone'

const NoSound: FC = () => {
  useEffect(() => {
    const dist = new Tone.Distortion(1).toDestination()
    const synth = new Tone.Synth().connect(dist)
    synth.triggerAttack('D2')

    return () => {
      synth.dispose()
    }
  }, [])

  return null
}

export default NoSound
