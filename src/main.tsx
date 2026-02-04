import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { SnackbarProvider } from 'notistack'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SnackbarProvider maxSnack={10} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <App />
    </SnackbarProvider>
  </StrictMode>,
)
