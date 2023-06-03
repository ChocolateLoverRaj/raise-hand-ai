import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import never from 'never'

createRoot(document.getElementById('app') ?? never()).render(<App />)
