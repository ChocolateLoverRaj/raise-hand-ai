import { ObservablePromise } from 'mobx-observable-promise'

type VideoPromise = ObservablePromise<(deviceId?: string) => Promise<MediaStream>>

export default VideoPromise
