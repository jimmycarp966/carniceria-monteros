import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { employeeService } from '../services/firebaseService';

// Definición de roles y sus permisos para caja
const CASH_REGISTER_ROLES = {
  admin: {
    canAccessCashRegister: true,
    canOpenShift: true,
    canCloseShift: true,
    canViewAllShifts: true,
    canOverride: true,
    priority: 4,
    displayName: 'Administrador'
  },
  encargado: {
    canAccessCashRegister: true,
    canOpenShift: true,
    canCloseShift: true,
    canViewAllShifts: true,
    canOverride: true,
    priority: 3,
    displayName: 'Encargado'
  },
  cajero: {
    canAccessCashRegister: true,
    canOpenShift: true,
    canCloseShift: true,
    canViewAllShifts: false,
    canOverride: false,
    priority: 2,
    displayName: 'Cajero'
  },
  carnicero: {
    canAccessCashRegister: false,
    canOpenShift: false,
    canCloseShift: false,
    canViewAllShifts: false,
    canOverride: false,
    priority: 1,
    displayName: 'Carnicero'
  },
  ayudante: {
    canAccessCashRegister: false,
    canOpenShift: false,
    canCloseShift: false,
    canViewAllShifts: false,
    canOverride: false,
    priority: 0,
    displayName: 'Ayudante'
  }
};

export const useCashRegisterAccess = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener información del usuario actual
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          setCurrentUser(null);
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Buscar información del empleado en la base de datos
        const employees = await employeeService.getAllEmployees();
        const employeeInfo = employees.find(emp => emp.email === user.email);

        if (employeeInfo) {
          setCurrentUser({
            id: user.uid,
            email: user.email,
            name: employeeInfo.name,
            position: employeeInfo.position,
            role: employeeInfo.role || getRoleFromPosition(employeeInfo.position),
            employeeId: employeeInfo.id
          });
        } else {
          // Si no está en empleados pero está autenticado, asumir admin
          setCurrentUser({
            id: user.uid,
            email: user.email,
            name: user.displayName || 'Usuario',
            position: 'Administrador',
            role: 'admin',
            employeeId: null
          });
        }

      } catch (err) {
        console.error('Error obteniendo información del usuario:', err);
        setError('Error al verificar permisos de usuario');
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUserInfo();
  }, []);

  // Actualizar rol cuando cambia el usuario
  useEffect(() => {
    if (currentUser?.role) {
      setUserRole(CASH_REGISTER_ROLES[currentUser.role] || CASH_REGISTER_ROLES.ayudante);
    } else {
      setUserRole(null);
    }
  }, [currentUser]);

  // Función auxiliar para obtener rol desde posición
  const getRoleFromPosition = (position) => {
    if (!position) return 'ayudante';
    
    const pos = position.toLowerCase();
    if (pos.includes('admin') || pos.includes('dueño')) return 'admin';
    if (pos.includes('encargado') || pos.includes('supervisor')) return 'encargado';
    if (pos.includes('cajero') || pos.includes('caja')) return 'cajero';
    if (pos.includes('carnicero')) return 'carnicero';
    return 'ayudante';
  };

  // Verificar si el usuario puede acceder a la caja registradora
  const canAccessCashRegister = () => {
    if (!userRole) return false;
    return userRole.canAccessCashRegister;
  };

  // Verificar si el usuario puede abrir un turno
  const canOpenShift = () => {
    if (!userRole) return false;
    return userRole.canOpenShift;
  };

  // Verificar si el usuario puede cerrar un turno
  const canCloseShift = () => {
    if (!userRole) return false;
    return userRole.canCloseShift;
  };

  // Verificar si el usuario puede ver todos los turnos
  const canViewAllShifts = () => {
    if (!userRole) return false;
    return userRole.canViewAllShifts;
  };

  // Verificar si el usuario puede hacer override de restricciones
  const canOverride = () => {
    if (!userRole) return false;
    return userRole.canOverride;
  };

  // Obtener el mensaje de acceso denegado apropiado
  const getAccessDeniedMessage = () => {
    if (!currentUser) {
      return 'Debe iniciar sesión para acceder a la caja registradora';
    }
    
    if (!canAccessCashRegister()) {
      return `Su rol de ${userRole?.displayName || 'Usuario'} no tiene permisos para acceder a la caja registradora. Contacte al administrador.`;
    }

    return 'Acceso denegado a la caja registradora';
  };

  // Obtener información de roles disponibles para mostrar en UI
  const getAvailableRoles = () => {
    return Object.entries(CASH_REGISTER_ROLES)
      .filter(([_, roleInfo]) => roleInfo.canAccessCashRegister)
      .map(([roleKey, roleInfo]) => ({
        key: roleKey,
        ...roleInfo
      }))
      .sort((a, b) => b.priority - a.priority);
  };

  // Verificar si un usuario específico puede realizar una acción
  const checkUserPermission = (userEmail, action) => {
    // TODO: Implementar verificación para otros usuarios
    // Útil para mostrar en listas de empleados quién puede hacer qué
    return false;
  };

  return {
    // Estados
    currentUser,
    userRole,
    isLoading,
    error,
    
    // Permisos
    canAccessCashRegister: canAccessCashRegister(),
    canOpenShift: canOpenShift(),
    canCloseShift: canCloseShift(),
    canViewAllShifts: canViewAllShifts(),
    canOverride: canOverride(),
    
    // Utilidades
    getAccessDeniedMessage,
    getAvailableRoles,
    checkUserPermission,
    
    // Información adicional
    allRoles: CASH_REGISTER_ROLES
  };
};

export default useCashRegisterAccess;
