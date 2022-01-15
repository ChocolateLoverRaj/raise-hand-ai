const cleanupAnimationFrame = (callback: FrameRequestCallback): (() => void) => {
  const handle = requestAnimationFrame(callback)
  return () => cancelAnimationFrame(handle)
}

export default cleanupAnimationFrame
