import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Store, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3, Menu, X, DollarSign, Settings, Sun, Moon } from 'lucide-react';
import RealtimeNotifications from './components/RealtimeNotifications';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import FirebaseAuth from './components/FirebaseAuth';

// Lazy loading con preloading para mejorar el rendimiento
const Products = lazy(() => import('./components/Products'));
const Sales = lazy(() => import('./components/Sales'));
const CashRegister = lazy(() => import('./components/EnhancedCashRegister'));
const Customers = lazy(() => import('./components/Customers'));
const Employees = lazy(() => import('./components/Employees'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Inventory = lazy(() => import('./components/Inventory'));
const Categories = lazy(() => import('./components/Categories'));
const Reports = lazy(() => import('./components/Reports'));
const Dashboard = lazy(() => import('./components/Dashboard'));

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
const NavItem = memo(({ icon: Icon, label, to, onClick, isActive, badge }) => {
  const handleClick = useCallback((e) => {
    if (onClick) onClick(e);
  }, [onClick]);

  return (
    <Link
      to={to}
      onClick={handleClick}
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
const Layout = memo(({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState('/');
  const [lowStockAlerts] = useState(3);
  const [darkMode, setDarkMode] = useState(false);

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

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // Optimizar navigation con useMemo
  const navigation = useMemo(() => [
    { icon: Home, label: 'Menú Principal', to: '/' },
    { icon: DollarSign, label: 'Caja', to: '/caja' },
    { icon: Package, label: 'Productos', to: '/productos' },
    { icon: ShoppingCart, label: 'Ventas', to: '/ventas' },
    { icon: Building, label: 'Inventario', to: '/inventario', badge: lowStockAlerts > 0 ? lowStockAlerts : null },
    { icon: Users, label: 'Clientes', to: '/clientes' },
    { icon: UserCheck, label: 'Empleados', to: '/empleados' },
    { icon: Truck, label: 'Proveedores', to: '/proveedores' },
    { icon: Tag, label: 'Categorías', to: '/categorias' },
    { icon: BarChart3, label: 'Reportes', to: '/reportes' },
  ], [lowStockAlerts]);

  // Optimizar handlers de navegación
  const handleNavClick = useCallback((route) => {
    setActiveRoute(route);
    closeSidebar();
  }, [closeSidebar]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 flex ${darkMode ? 'dark' : ''}`}>
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

      {/* Notificaciones móviles optimizadas */}
      <div className="lg:hidden fixed top-6 right-6 z-[9999] flex space-x-2">
        <RealtimeNotifications />
        <button 
          onClick={toggleDarkMode}
          className="p-3 rounded-2xl bg-white/90 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-white/95"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent truncate">Carnicería Muñoz</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Sistema de Administración</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <RealtimeNotifications />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
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
              <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
                <Settings className="h-4 w-4" />
              </button>
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
      <div className="lg:pl-72 w-full flex-1">
        <div className="min-h-screen w-full pt-20 lg:pt-0">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
});

// App principal optimizado
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
            Carnicería Monteros
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

  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/caja" element={<CashRegister />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/ventas" element={<Sales />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/clientes" element={<Customers />} />
            <Route path="/empleados" element={<Employees />} />
            <Route path="/proveedores" element={<Suppliers />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
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
      </div>
    </Router>
  );
}

export default App; 