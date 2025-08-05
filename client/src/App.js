import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Store, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3, Menu, X, DollarSign, AlertTriangle, TrendingUp, Activity, Bell } from 'lucide-react';
import Products from './components/Products';
import Sales from './components/Sales';
import CashRegister from './components/CashRegister';
import Customers from './components/Customers';
import Employees from './components/Employees';
import Suppliers from './components/Suppliers';
import Inventory from './components/Inventory';
import Categories from './components/Categories';
import Reports from './components/Reports';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import FirebaseAuth from './components/FirebaseAuth';

const NavItem = ({ icon: Icon, label, to, onClick, isActive, badge }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 relative ${
        isActive 
          ? 'text-primary-700 bg-primary-50 border border-primary-200 shadow-md transform scale-105' 
          : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50 hover:transform hover:scale-105'
      }`}
    >
      <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
      <span className="inline">{label}</span>
      {badge && (
        <span className="absolute top-1/2 -translate-y-1/2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState('/');
  const [lowStockAlerts] = useState(3); // Simulación de alertas de inventario
  const [notifications] = useState(2); // Simulación de notificaciones

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Debug: Log cuando cambia el estado del sidebar
  useEffect(() => {
    console.log('Sidebar state:', sidebarOpen);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleSidebar = () => {
    console.log('Toggle sidebar clicked, current state:', sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    console.log('Closing sidebar');
    setSidebarOpen(false);
  };

  const navigation = [
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Mobile menu button mejorado - SIEMPRE VISIBLE */}
      <div className="lg:hidden fixed top-4 left-4 z-[9999]">
        <button
          onClick={toggleSidebar}
          className="p-4 rounded-2xl bg-red-600 text-white shadow-2xl border-2 border-red-700 hover:bg-red-700 hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
          aria-label="Toggle menu"
          style={{ minWidth: '60px', minHeight: '60px' }}
        >
          {sidebarOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* Notificaciones móviles */}
      <div className="lg:hidden fixed top-4 right-4 z-[9999]">
        <button className="p-4 rounded-2xl bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300 transform hover:scale-110 relative">
          <Bell className="h-7 w-7" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {notifications}
            </span>
          )}
        </button>
      </div>

      {/* Overlay para móvil - DEBE IR ANTES DEL SIDEBAR */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Mejorado */}
      <div className={`
        fixed left-0 top-0 z-50 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:w-72 lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header Mejorado */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-2xl">
                <Store className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Carnicería Muñoz</h1>
                <p className="text-xs text-gray-600">Sistema de Administración</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navegación Mejorada */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                onClick={() => {
                  setActiveRoute(item.to);
                  closeSidebar();
                }}
                isActive={activeRoute === item.to}
                badge={item.badge}
              />
            ))}
          </nav>

          {/* Footer Mejorado */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white rounded-2xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content mejorado */}
      <div className="lg:pl-72 w-full flex-1">
        <div className="min-h-screen w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats] = useState({
    ventasHoy: 125000,
    productosVendidos: 45,
    clientesNuevos: 8,
    inventarioBajo: 3
  });

  const [recentSales] = useState([
    { id: 1, cliente: 'Juan Pérez', monto: 25000, hora: '14:30' },
    { id: 2, cliente: 'María García', monto: 18000, hora: '14:15' },
    { id: 3, cliente: 'Carlos López', monto: 32000, hora: '13:45' }
  ]);

  const [lowStockItems] = useState([
    { id: 1, nombre: 'Carne Molida', stock: 2, minimo: 5 },
    { id: 2, nombre: 'Pollo Entero', stock: 1, minimo: 3 },
    { id: 3, nombre: 'Chorizo', stock: 0, minimo: 4 }
  ]);

  return (
    <div className="p-4 lg:p-6">
      {/* Header Mejorado */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Resumen de actividades del día</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button className="btn btn-primary">
              <Activity className="h-4 w-4 mr-2" />
              Nueva Venta
            </button>
            <button className="btn btn-secondary">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Reportes
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Mejoradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Ventas Hoy</p>
              <p className="stats-value">${stats.ventasHoy.toLocaleString()}</p>
            </div>
            <div className="stats-icon">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Productos Vendidos</p>
              <p className="stats-value">{stats.productosVendidos}</p>
            </div>
            <div className="stats-icon">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Clientes Nuevos</p>
              <p className="stats-value">{stats.clientesNuevos}</p>
            </div>
            <div className="stats-icon">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Stock Bajo</p>
              <p className="stats-value">{stats.inventarioBajo}</p>
            </div>
            <div className="stats-icon">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ventas Recientes</h2>
            <button className="text-primary-600 hover:text-primary-700 font-medium">Ver todas</button>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="history-item">
                <div className="history-header">
                  <div>
                    <p className="font-medium text-gray-900">{sale.cliente}</p>
                    <p className="text-sm text-gray-500">{sale.hora}</p>
                  </div>
                  <p className="history-amount">${sale.monto.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Inventario */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Stock Bajo</h2>
            <button className="text-primary-600 hover:text-primary-700 font-medium">Ver inventario</button>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-sm text-red-600">
                      Stock: {item.stock} (Mínimo: {item.minimo})
                    </p>
                  </div>
                  <div className="badge badge-danger">
                    {item.stock === 0 ? 'Agotado' : 'Bajo Stock'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="loading-text">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <FirebaseAuth />;
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