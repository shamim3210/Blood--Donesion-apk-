import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { initRuntimeSecurityShield } from './utils/securityShield';
import { initPWAInstallListener } from './hooks/usePWAInstall';

initRuntimeSecurityShield();
initPWAInstallListener();

if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
} else {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);
