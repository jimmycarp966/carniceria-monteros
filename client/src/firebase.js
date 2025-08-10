import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase desde variables de entorno (CRA usa prefijo REACT_APP_)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCVn2q5J4zl0U1RL8D6nmaWGdq5WPJ2t9Y",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "carniceria-monteros.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "carniceria-monteros",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://carniceria-monteros-default-rtdb.firebaseio.com",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "carniceria-monteros.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "295246860976",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:295246860976:web:a529e27f8e382c59daa175",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-8LQFDMWNND",
};

if (process.env.NODE_ENV !== 'production') {
  // Log limitado para evitar exponer secretos en consola
  // Se muestran solo campos no sensibles
  // eslint-disable-next-line no-console
  console.log('🚀 Inicializando Firebase (modo desarrollo)...', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
// export const analytics = getAnalytics(app);

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('✅ Firebase inicializado (cliente)');
}

export default app; 