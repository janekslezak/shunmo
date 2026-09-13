import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { PinyinProvider } from '@/hooks/usePinyin'
import { getSettings, applyTheme } from '@/components/settings/settings'

// apply saved theme before first paint
applyTheme(getSettings().theme)

// autoUpdate: new service worker activates as soon as it's available
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <PinyinProvider>
      <App />
    </PinyinProvider>
  </BrowserRouter>,
)
