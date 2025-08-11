import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import {
  Store,
  LogOut,
  Home,
  Package,
  ShoppingCart,
  Users,
  UserCheck,
  Truck,
  Tag,
  BarChart3,
  Menu,
  X,
  DollarSign,
  Settings,
  Bug,
  CreditCard,
  Bell
} from 'lucide-react';
import { usePermissions } from '../context/PermissionsContext';

// Componentes
import DebugPanel from './DebugPanel';
import RealtimeNotifications from './RealtimeNotifications';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = usePermissions();

  // Obtener usuario actual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Cerrar sidebar en cambio de ruta (móvil)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handlers optimizados
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada exitosamente');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelOpen(prev => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen(prev => !prev);
  }, []);

  // Navegación principal
  const navigation = useMemo(() => {
    const base = [
      { icon: Home, label: 'Dashboard', to: '/dashboard', badge: null },
      { icon: DollarSign, label: 'Caja', to: '/caja', badge: null },
      { icon: Package, label: 'Productos', to: '/productos', badge: null },
      { icon: ShoppingCart, label: 'Ventas', to: '/ventas', badge: null },
      { icon: Store, label: 'Inventario', to: '/inventario', badge: null },
      { icon: Users, label: 'Clientes', to: '/clientes', badge: null },
      { icon: UserCheck, label: 'Empleados', to: '/empleados', badge: null },
      { icon: Truck, label: 'Proveedores', to: '/proveedores', badge: null },
      { icon: Tag, label: 'Categorías', to: '/categorias', badge: null },
      { icon: BarChart3, label: 'Reportes', to: '/reportes', badge: null },
    ];

    // Agregar módulos condicionales por permisos
    const result = [...base];
    
    if (permissions?.includes('purchases') || permissions?.includes('admin')) {
      result.splice(5, 0, { 
        icon: Truck, 
        label: 'Compras', 
        to: '/compras', 
        badge: null 
      });
    }
    
    if (permissions?.includes('expenses') || permissions?.includes('admin')) {
      result.splice(6, 0, { 
        icon: CreditCard, 
        label: 'Gastos', 
        to: '/gastos', 
        badge: null 
      });
    }

    return result;
  }, [permissions]);

  // Componente de navegación optimizado
  const NavItem = ({ item, isActive }) => (
    <Link
      to={item.to}
      className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
    >
      <item.icon className="h-5 w-5 mr-3" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="badge badge-error text-xs px-2 py-1 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <Store className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  Carnicería
                </h1>
                <p className="text-sm text-gray-500">Sistema de Gestión</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                isActive={location.pathname === item.to}
              />
            ))}
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">
                  {permissions?.includes('admin') ? 'Administrador' : 'Usuario'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header principal */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 lg:px-6">
            {/* Botón de menú móvil */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Título de la página */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
                {navigation.find(item => item.to === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>

            {/* Acciones del header */}
            <div className="flex items-center space-x-2">
              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <RealtimeNotifications />
                  </div>
                )}
              </div>

              {/* Configuración */}
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>

              {/* Debug Panel */}
              <button
                onClick={toggleDebugPanel}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Bug className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 Sistema de Gestión para Carnicería. Desarrollado con ❤️
            </p>
          </div>
        </footer>
      </div>

      {/* Debug Panel */}
      <DebugPanel 
        isVisible={debugPanelOpen} 
        onClose={() => setDebugPanelOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;
