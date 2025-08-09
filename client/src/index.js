import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './utils/consoleTesting';

// Registrar Service Worker para optimización con control de actualizaciones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
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