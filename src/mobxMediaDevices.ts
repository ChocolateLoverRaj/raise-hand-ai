import { ObservablePromise } from 'mobx-observable-promise'

const mobxMediaDevices = new ObservablePromise(async () =>
  await navigator.mediaDevices.enumerateDevices())

export default mobxMediaDevices
