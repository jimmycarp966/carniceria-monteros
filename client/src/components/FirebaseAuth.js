import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';
import { Store, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const FirebaseAuth = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Usuario autenticado:', user);
        onLogin({
          id: user.uid,
          email: user.email,
          nombre: user.displayName || 'Usuario',
          rol: 'admin' // Por defecto admin para pruebas
        });
      }
    });

    return () => unsubscribe();
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔐 Intentando autenticación con Firebase...');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña:', password ? '***' : 'vacía');
    console.log('📝 Modo:', isSignUp ? 'Registro' : 'Login');

    try {
      if (isSignUp) {
        // Crear nuevo usuario
        console.log('🆕 Creando nuevo usuario...');
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('¡Usuario creado exitosamente!');
      } else {
        // Iniciar sesión
        console.log('🔑 Iniciando sesión...');
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('¡Inicio de sesión exitoso!');
      }
    } catch (error) {
      console.error('❌ Error de autenticación:', error);
      console.error('🔍 Código de error:', error.code);
      console.error('📝 Mensaje de error:', error.message);
      
      let message = 'Error al autenticarse';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          message = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        case 'auth/weak-password':
          message = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'auth/email-already-in-use':
          message = 'El email ya está en uso';
          break;
        case 'auth/invalid-credential':
          message = 'Credenciales inválidas. Verifica tu email y contraseña';
          break;
        case 'auth/operation-not-allowed':
          message = 'La autenticación por email/contraseña no está habilitada';
          break;
        default:
          message = error.message;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Carnicería Monteros
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Administración
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input rounded-t-lg rounded-b-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input rounded-t-none rounded-b-lg pr-10"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isSignUp ? 'Crear cuenta' : 'Iniciar sesión'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-600 hover:text-primary-500 text-sm"
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-gray-500">
          <p>Credenciales de prueba:</p>
          <p>Email: admin@carniceria.com</p>
          <p>Contraseña: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuth; 