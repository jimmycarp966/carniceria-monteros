import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCVn2q5J4zl0U1RL8D6nmaWGdq5WPJ2t9Y",
  authDomain: "carniceria-monteros.firebaseapp.com",
  projectId: "carniceria-monteros",
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com",
  storageBucket: "carniceria-monteros.firebasestorage.app",
  messagingSenderId: "295246860976",
  appId: "1:295246860976:web:a529e27f8e382c59daa175",
  measurementId: "G-8LQFDMWNND"
};

console.log('🚀 Inicializando Firebase...');
console.log('📊 Configuración:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
// export const analytics = getAnalytics(app);

console.log('✅ Firebase inicializado correctamente');
console.log('🔐 Auth configurado:', !!auth);
console.log('📊 Firestore configurado:', !!db);
console.log('⚡ Realtime Database configurado:', !!realtimeDb);

export default app; 