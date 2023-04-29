import { ObservablePromise } from 'mobx-observable-promise'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import Canvas from './Canvas'
import { setBackend } from '@tensorflow/tfjs-core'
import { SupportedModels, createDetector } from '@tensorflow-models/hand-pose-detection'
import '@tensorflow/tfjs-backend-webgl'

const Detector = observer(() => {
  // FIXME: Cleanup worker
  const [observablePromise] = useState(() => {
    const observablePromise = new ObservablePromise(async () => {
      await setBackend('webgl')
      const detector = await createDetector(SupportedModels.MediaPipeHands, {
        runtime: 'mediapipe',
        // solutionPath: require.resolve('@mediapipe/hands/'),
        solutionPath: './',
        modelType: 'lite'
      })
      return detector
    })
    observablePromise.execute()// .catch(e => console.log(e))
    return observablePromise
  })

  return (
    <>
      {observablePromise.wasSuccessful
        ? <Canvas detector={observablePromise.result} />
        : observablePromise.isExecuting
          ? 'Setting up detector'
          : 'Error setting up detector'}
    </>
  )
})

export default Detector
