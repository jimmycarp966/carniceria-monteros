import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './utils/consoleTesting';
import './utils/debugSales';
import './utils/testArqueo';

// Registrar Service Worker con rutina de recuperación para evitar pantallas blancas por caché obsoleto
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Recuperación una sola vez: desregistrar SW antiguos y limpiar caches
      if (!localStorage.getItem('sw_recovered_v2')) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
        if (window.caches && caches.keys) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n).catch(() => {})));
        }
        localStorage.setItem('sw_recovered_v2', '1');
        // Recargar con SW desregistrado y caches limpios
        window.location.reload();
        return;
      }
    } catch (e) {
      // ignore
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado:', registration.scope);

        // Forzar actualización periódica y limpieza de cache obsoleta
        const doUpdate = () => registration.update().catch(() => {});
        setTimeout(doUpdate, 3000);
        setInterval(doUpdate, 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nueva versión disponible');
            }
          });
        });

        // Escuchar cambios de controlador
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker actualizado y activado');
          // Evitar loops: recargar una sola vez
          if (!window.__reloaded_for_sw__) {
            window.__reloaded_for_sw__ = true;
            window.location.reload();
          }
        });
      })
      .catch((error) => {
        console.error('Error registrando Service Worker:', error);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 