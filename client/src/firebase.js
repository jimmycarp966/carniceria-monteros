import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
// TODO: Reemplazar con tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "carniceria-monteros.firebaseapp.com",
  projectId: "carniceria-monteros",
  storageBucket: "carniceria-monteros.appspot.com",
  messagingSenderId: "tu-messaging-sender-id",
  appId: "tu-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 