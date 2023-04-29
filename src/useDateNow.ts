import { useState } from 'react'
import { useRaf } from 'rooks'

const useDateNow = (): number => {
  const [now, setNow] = useState(Date.now())

  useRaf(() => setNow(Date.now()), true)

  return now
}

export default useDateNow
