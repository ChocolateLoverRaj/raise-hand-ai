import { ObservablePromise } from 'mobx-observable-promise'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import Canvas from './Canvas'
import { createDetector, SupportedModels } from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'
import { setBackend } from '@tensorflow/tfjs-core'

const Detector = observer(() => {
  const [observablePromise] = useState(() => {
    const observablePromise = new ObservablePromise(async () => {
      await setBackend('webgl')
      return await createDetector(SupportedModels.MoveNet)
    })
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    observablePromise.execute().catch()
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
