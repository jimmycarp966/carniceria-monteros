import React from 'react';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  User, 
  Settings,
  ArrowLeft 
} from 'lucide-react';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import { Link } from 'react-router-dom';

const CashRegisterAccessGuard = ({ children }) => {
  const {
    currentUser,
    userRole,
    isLoading,
    error,
    canAccessCashRegister,
    getAccessDeniedMessage,
    getAvailableRoles
  } = useCashRegisterAccess();

  // Mostrar loading mientras se verifican permisos
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl mb-6 shadow-lg">
            <Shield className="h-10 w-10 text-orange-600 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white animate-ping"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Verificando Permisos...
          </h2>
          <p className="text-gray-600">Validando acceso a caja registradora</p>
        </div>
      </div>
    );
  }

  // Mostrar error si hubo problemas
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">Error de Verificación</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="flex space-x-3">
              <Link 
                to="/" 
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar acceso denegado si no tiene permisos
  if (!canAccessCashRegister) {
    const availableRoles = getAvailableRoles();
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acceso Restringido</h2>
            <p className="text-gray-600 mb-6">{getAccessDeniedMessage()}</p>
            
            {/* Información del usuario actual */}
            {currentUser && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center mb-3">
                  <User className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">Usuario Actual</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Nombre:</strong> {currentUser.name}</p>
                  <p><strong>Email:</strong> {currentUser.email}</p>
                  <p><strong>Posición:</strong> {currentUser.position}</p>
                  <p><strong>Rol:</strong> {userRole?.displayName || 'Sin definir'}</p>
                </div>
              </div>
            )}
            
            {/* Roles con acceso */}
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-center">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                Roles con Acceso a Caja
              </h3>
              <div className="space-y-2">
                {availableRoles.map(role => (
                  <div key={role.key} className="flex items-center justify-center">
                    <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      {role.displayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link 
                to="/" 
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </Link>
              <Link
                to="/empleados"
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ver Empleados
              </Link>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Si cree que esto es un error, contacte al administrador
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene permisos, mostrar el contenido
  return children;
};

export default CashRegisterAccessGuard;
