import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from '@/app/store'
import './index.css'
import App from './App.tsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <App />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
