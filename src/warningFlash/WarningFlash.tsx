import { css, keyframes, cx } from '@emotion/css'
import Props from './Props'
import { FC } from 'react'

const WarningFlash: FC<Props> = ({ divProps, startOpacity, endOpacity }) => (
  <div
    {...divProps}
    className={cx(css({
      animation: `${
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        keyframes`
          from {
            opacity: ${startOpacity}
          }
          to {
            opacity: ${endOpacity}
          }
        `} 0.4s ease infinite alternate`
    }), divProps.className)}
  />
)

export default WarningFlash
