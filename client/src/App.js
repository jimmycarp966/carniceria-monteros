import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Store, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3, Menu, X, DollarSign, Settings, Bug, CreditCard } from 'lucide-react';
import DebugPanel from './components/DebugPanel';
import { auth } from './firebase';
import { authzService } from './services/firebaseService';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import FirebaseAuth from './components/FirebaseAuth';
import ErrorBoundary from './components/ErrorBoundary';
import { PermissionsProvider, usePermissions } from './context/PermissionsContext';
import realtimeService from './services/realtimeService';

// Lazy loading con preloading para mejorar el rendimiento
const Products = lazy(() => import('./components/Products'));
const Sales = lazy(() => import('./components/SalesReports'));
const SalesModule = lazy(() => import('./components/SalesModule'));
const CashRegister = lazy(() => import('./components/CashRegister'));
const Customers = lazy(() => import('./components/Customers'));
const Employees = lazy(() => import('./components/Employees'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Inventory = lazy(() => import('./components/Inventory'));
const Categories = lazy(() => import('./components/Categories'));
const Reports = lazy(() => import('./components/Reports'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Purchases = lazy(() => import('./components/Purchases'));
const Expenses = lazy(() => import('./components/Expenses'));

// Componente de carga optimizado con memo
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl mb-6 shadow-lg">
        <Store className="h-10 w-10 text-orange-600 animate-pulse" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
      </div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
        Cargando...
      </h2>
      <p className="text-gray-600">Preparando módulo</p>
    </div>
  </div>
));

// NavItem optimizado con memo y useCallback
const NavItem = memo(({ icon: Icon, label, to, onClick, onHover, isActive, badge }) => {
  const handleClick = useCallback((e) => {
    if (onClick) onClick(e);
  }, [onClick]);

  const handleMouseEnter = useCallback((e) => {
    if (onHover) onHover(e);
  }, [onHover]);

  return (
    <Link
      to={to}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 relative group ${
        isActive 
          ? 'text-orange-700 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 shadow-lg transform scale-105' 
          : 'text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-red-50/60 hover:transform hover:scale-105'
      }`}
    >
      <Icon className={`h-5 w-5 mr-3 transition-colors duration-200 ${isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-500'}`} />
      <span className="inline">{label}</span>
      {badge && (
        <span className="absolute top-1/2 -translate-y-1/2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
          {badge}
        </span>
      )}
    </Link>
  );
});

// Layout optimizado con memo y useMemo
const Layout = memo(({ children, onPrefetchRoute }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState('/');
  
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const permissions = usePermissions();

  // Optimizar useEffect para auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Optimizar handlers con useCallback
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelOpen(prev => !prev);
  }, []);

  // Optimizar navigation con useMemo
  const navigation = useMemo(() => {
    const base = [
      { icon: Home, label: 'Menú Principal', to: '/' },
      { icon: DollarSign, label: 'Caja', to: '/caja' },
      { icon: Package, label: 'Productos', to: '/productos' },
      { icon: ShoppingCart, label: 'Punto de Venta', to: '/punto-venta' },
      { icon: BarChart3, label: 'Reportes de Ventas', to: '/ventas' },
      { icon: Building, label: 'Inventario', to: '/inventario' },
      { icon: Users, label: 'Clientes', to: '/clientes' },
      { icon: UserCheck, label: 'Empleados', to: '/empleados' },
      { icon: Truck, label: 'Proveedores', to: '/proveedores' },
      { icon: Tag, label: 'Categorías', to: '/categorias' },
      { icon: BarChart3, label: 'Reportes', to: '/reportes' },
    ];
    // Insertar entradas condicionales por permisos
    const result = [...base];
    if (permissions && (permissions.includes('purchases') || permissions.includes('admin'))) {
      result.splice(5, 0, { icon: Truck, label: 'Compras', to: '/compras' });
    }
    if (permissions && (permissions.includes('expenses') || permissions.includes('admin'))) {
      result.splice(6, 0, { icon: CreditCard, label: 'Gastos', to: '/gastos' });
    }
    return result;
  }, [permissions]);

  // Optimizar handlers de navegación
  const handleNavClick = useCallback((route) => {
    setActiveRoute(route);
    closeSidebar();
  }, [closeSidebar]);

  const handleNavHover = useCallback((route) => {
    if (onPrefetchRoute) onPrefetchRoute(route);
  }, [onPrefetchRoute]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 flex`}>
      {/* Mobile menu button optimizado */}
      <div className="lg:hidden fixed top-6 left-6 z-[9999]">
        <button
          onClick={toggleSidebar}
          className="p-3 rounded-2xl bg-white/90 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-white/95"
          aria-label="Toggle menu"
          style={{ minWidth: '48px', minHeight: '48px' }}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Acciones móviles */}
      <div className="lg:hidden fixed top-6 right-6 z-[9999] flex space-x-2">
        <button 
          onClick={toggleDebugPanel}
          className="p-3 rounded-2xl bg-white/90 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-white/95"
        >
          <Bug className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay para móvil optimizado */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar optimizado */}
      <div className={`
        fixed left-0 top-0 z-50 w-full sm:w-80 h-full bg-white/95 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-200/50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:w-72 lg:z-auto lg:bg-white/95
        md:translate-x-0 md:static md:w-64 md:z-auto md:bg-white/95
      `}>
        <div className="flex flex-col h-full">
          {/* Header optimizado */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 bg-gradient-to-r from-orange-50/80 to-red-50/80">
            <div className="flex items-center min-w-0 flex-1">
              <div className="relative p-2 sm:p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl shadow-lg">
                <Store className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Carnicería Monteros</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Sistema de Administración</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={closeSidebar}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navegación optimizada */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                onClick={() => handleNavClick(item.to)}
                onHover={() => handleNavHover(item.to)}
                isActive={activeRoute === item.to}
                badge={item.badge}
              />
            ))}
          </nav>

          {/* Footer optimizado */}
          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-orange-50/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center shadow-sm">
                  <UserCheck className="h-4 w-4 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleDebugPanel}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200"
                >
                  <Bug className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white/80 rounded-2xl border border-gray-200/50 hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-red-50/80 hover:border-orange-200/50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content optimizado */}
      <div className="flex-1 w-full min-w-0 flex flex-col">
        <div className="flex-1 w-full pt-20 lg:pt-0 px-4 lg:px-6">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </div>
        {/* Footer global */}
        <footer className="w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 px-4 lg:px-6 py-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Diseñado por <span className="font-semibold text-gray-900">DaniR</span>
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
});

// App principal optimizado
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Prefetch de rutas en idle/hover
  const prefetchMap = useMemo(() => ({
    '/': () => import('./components/Dashboard'),
    '/caja': () => import('./components/CashRegister'),
    '/productos': () => import('./components/Products'),
    '/ventas': () => import('./components/Sales'),
    '/inventario': () => import('./components/Inventory'),
    '/compras': () => import('./components/Purchases'),
    '/gastos': () => import('./components/Expenses'),
    '/clientes': () => import('./components/Customers'),
    '/empleados': () => import('./components/Employees'),
    '/proveedores': () => import('./components/Suppliers'),
    '/categorias': () => import('./components/Categories'),
    '/reportes': () => import('./components/Reports'),
  }), []);

  const prefetchRoute = useCallback((route) => {
    const prefetch = prefetchMap[route];
    if (typeof prefetch === 'function') {
      prefetch().catch(() => {});
    }
  }, [prefetchMap]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Cargar permisos del usuario autenticado
  useEffect(() => {
    (async () => {
      if (user?.email) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          const claims = tokenResult?.claims || {};
          setMustChangePassword(!!claims.mustChangePassword);
        } catch (e) {
          setMustChangePassword(false);
        }
        const perms = await authzService.getUserPermissionsByEmail(user.email);
        setPermissions(perms);

        // Inicializar listeners realtime una sola vez al autenticar
        if (!window.__rt_listeners_initialized__) {
          try {
            realtimeService.initializeRealtimeListeners();
            window.__rt_listeners_initialized__ = true;
          } catch {}
        }
      } else {
        setPermissions([]);
      }
    })();
  }, [user]);

  const handleForcePasswordChange = useCallback(async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (!auth.currentUser) {
        toast.error('Sesión no disponible');
        return;
      }
      await updatePassword(auth.currentUser, newPassword);
      // Limpiar flag en claims
      await fetch('/api/admin/set-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email, mustChangePassword: false })
      });
      await auth.currentUser.getIdToken(true);
      setMustChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar la contraseña');
    }
  }, [newPassword, confirmPassword]);

  // Prefetch en idle de las rutas más usadas luego de cargar
  useEffect(() => {
    if (!user) return;
    const idle = (cb) => {
      if ('requestIdleCallback' in window) {
        // @ts-ignore
        return window.requestIdleCallback(cb);
      }
      return setTimeout(cb, 1000);
    };
    const cancel = (id) => {
      if ('cancelIdleCallback' in window) {
        // @ts-ignore
        return window.cancelIdleCallback(id);
      }
      clearTimeout(id);
    };
    const id = idle(() => {
      ['/caja', '/productos', '/inventario', '/compras', '/gastos'].forEach((r) => prefetchRoute(r));
    });
    return () => cancel(id);
  }, [user, prefetchRoute]);

  // Optimizar loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl mb-6 shadow-lg">
            <Store className="h-10 w-10 text-orange-600 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Carnicería Muñoz
          </h2>
          <p className="text-gray-600 mb-4">Cargando sistema...</p>
          <div className="loading-spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <FirebaseAuth onLogin={setUser} />;
  }

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>
          <p className="text-sm text-gray-600 mb-6">Debés definir una nueva contraseña para continuar.</p>
          <div className="space-y-4">
            <input
              type="password"
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              onClick={handleForcePasswordChange}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-2xl"
            >
              Guardar nueva contraseña
            </button>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <ErrorBoundary>
          <PermissionsProvider permissions={permissions}>
            <Layout onPrefetchRoute={prefetchRoute}>
              <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/caja" element={<CashRegister />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/punto-venta" element={<SalesModule />} />
              <Route path="/ventas" element={<Sales />} />
              <Route path="/inventario" element={<Inventory />} />
              {permissions.includes('purchases') || permissions.includes('admin') ? (
                <Route path="/compras" element={<Purchases />} />
              ) : null}
              {permissions.includes('expenses') || permissions.includes('admin') ? (
                <Route path="/gastos" element={<Expenses />} />
              ) : null}
              <Route path="/clientes" element={<Customers />} />
              <Route path="/empleados" element={<Employees />} />
              <Route path="/proveedores" element={<Suppliers />} />
              <Route path="/categorias" element={<Categories />} />
              <Route path="/reportes" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PermissionsProvider>
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
        <DebugPanel />
      </div>
    </Router>
  );
}

export default App; 