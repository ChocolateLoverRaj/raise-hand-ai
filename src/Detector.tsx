import { ObservablePromise } from 'mobx-observable-promise'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import Canvas from './Canvas'
import WorkerToPage from './WorkerToPage'

const Detector = observer(() => {
  // FIXME: Cleanup worker
  const [observablePromise] = useState(() => {
    const observablePromise = new ObservablePromise(async () => {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      await new Promise<void>((resolve, reject) => {
        worker.onerror = reject
        worker.onmessageerror = reject
        worker.onmessage = ({ data }) => {
          if (data === WorkerToPage.SUCCESS) {
            resolve()
          } else {
            reject(new Error('Error setting up detector'))
          }
        }
      })
      return worker
    })
    observablePromise.execute().catch(e => console.log(e))
    return observablePromise
  })

  return (
    <>
      {observablePromise.wasSuccessful
        ? <Canvas worker={observablePromise.result} />
        : observablePromise.isExecuting
          ? 'Setting up detector'
          : 'Error setting up detector'}
    </>
  )
})

export default Detector
