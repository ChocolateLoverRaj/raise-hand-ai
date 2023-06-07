import Data from './Data'

const cleanup = (data: Data): Data => {
  clearTimeout(data.earliestPositionEntry?.timeoutId)
  return {
    ...data,
    earliestPositionEntry: undefined,
    positionEntries: []
  }
}

export default cleanup
