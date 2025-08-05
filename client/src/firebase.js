import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCVn2q5J4zl0U1RL8D6nmaWGdq5WPJ2t9Y",
  authDomain: "carniceria-monteros.firebaseapp.com",
  projectId: "carniceria-monteros",
  storageBucket: "carniceria-monteros.firebasestorage.app",
  messagingSenderId: "295246860976",
  appId: "1:295246860976:web:a529e27f8e382c59daa175",
  measurementId: "G-8LQFDMWNND"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app; 