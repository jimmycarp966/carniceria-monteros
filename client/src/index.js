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

        // Forzar check de update tras 5s en segundo plano
        setTimeout(() => registration.update().catch(() => {}), 5000);

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
          window.location.reload();
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