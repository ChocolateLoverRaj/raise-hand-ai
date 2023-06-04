import Data from './Data'

const resetTimeout = (data: Data): void => {
  clearTimeout(data.timeoutId)
  data.timeoutId = undefined
}

export default resetTimeout
