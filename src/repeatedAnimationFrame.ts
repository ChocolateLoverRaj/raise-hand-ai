const repeatedAnimationFrame = (callback: () => void | PromiseLike<void>): (() => void) => {
  let handle: number
  let canceled = false
  const setHandle = (): void => {
    handle = requestAnimationFrame(_frameRequestCallback)
  }
  const _frameRequestCallback: FrameRequestCallback = time => {
    const result = callback()
    if (result !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      result.then(() => {
        if (!canceled) setHandle()
      })
    }
  }
  setHandle()
  return () => {
    cancelAnimationFrame(handle)
    canceled = true
  }
}

export default repeatedAnimationFrame
