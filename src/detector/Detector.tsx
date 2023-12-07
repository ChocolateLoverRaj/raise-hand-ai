import { ObservablePromise } from 'mobx-observable-promise'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import Canvas from '../canvas/Canvas'
import Props from './Props'
import { createDetector, SupportedModels } from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'
import { setBackend } from '@tensorflow/tfjs-core'

const Detector = observer<Props>(({ containerRef }) => {
  const [observablePromise] = useState(() => {
    const observablePromise = new ObservablePromise(async () => {
      await setBackend('webgl')
      const detector = await createDetector(SupportedModels.BlazePose, {
        enableSmoothing: true,
        modelType: 'lite',
        runtime: 'mediapipe',
        solutionPath: './_node_modules/@mediapipe/pose'
      })
      return detector
    })
    observablePromise.execute().catch(e => console.log(e))
    return observablePromise
  })

  return (
    <>
      {observablePromise.wasSuccessful
        ? <Canvas detector={observablePromise.result} containerRef={containerRef} />
        : observablePromise.isExecuting
          ? 'Setting up detector'
          : 'Error setting up detector'}
    </>
  )
})

export default Detector
