import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';
import { Store, Eye, EyeOff, Lock, Mail, User, Shield, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card principal */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl mb-6 shadow-lg">
              <Store className="h-10 w-10 text-orange-600" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Carnicería Monteros
            </h1>
            <p className="text-gray-600 text-sm">
              Sistema de Administración
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-500">Gestión Inteligente</span>
              <Sparkles className="h-4 w-4 text-orange-500" />
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-orange-500" />
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="tu@email.com"
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-orange-500" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Cambiar modo */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
            <div className="flex items-center mb-2">
              <Shield className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">Credenciales de Prueba</span>
            </div>
            <div className="space-y-1 text-xs text-orange-700">
              <p><span className="font-medium">Email:</span> admin@carniceria.com</p>
              <p><span className="font-medium">Contraseña:</span> admin123</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>Sistema Seguro</span>
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              <span>En Línea</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default FirebaseAuth; 