// Buffer polyfill for react-pdf
import { Buffer } from 'buffer';

// Polyfill Buffer for react-pdf
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Initialize i18n
import { LanguageProvider } from './contexts/LanguageContext'

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
); 