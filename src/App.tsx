import { FC } from 'react'
import { Title, HeadProvider } from 'react-head'
import HandRaised from './HandRaised'

const App: FC = () => {
  return (
    <>
      <HeadProvider>
        <Title>Hand Raised AI</Title>
        <HandRaised />
      </HeadProvider>
    </>
  )
}

export default App
