import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Store, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3, Menu, X } from 'lucide-react';
import Products from './components/Products';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Employees from './components/Employees';
import Suppliers from './components/Suppliers';
import Inventory from './components/Inventory';
import Categories from './components/Categories';
import Reports from './components/Reports';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import FirebaseAuth from './components/FirebaseAuth';

// Componente de navegación mejorado para móviles
const NavItem = ({ icon: Icon, label, to, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
    >
      <Icon className="h-5 w-5 mr-3" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
};

// Layout mejorado con sidebar responsive
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navigation = [
    { icon: Home, label: 'Dashboard', to: '/' },
    { icon: Package, label: 'Productos', to: '/productos' },
    { icon: ShoppingCart, label: 'Ventas', to: '/ventas' },
    { icon: Building, label: 'Inventario', to: '/inventario' },
    { icon: Users, label: 'Clientes', to: '/clientes' },
    { icon: UserCheck, label: 'Empleados', to: '/empleados' },
    { icon: Truck, label: 'Proveedores', to: '/proveedores' },
    { icon: Tag, label: 'Categorías', to: '/categorias' },
    { icon: BarChart3, label: 'Reportes', to: '/reportes' },
  ];

  return (
    <div className="bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-white shadow-lg border border-gray-200"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">Carnicería Muñoz</h1>
                <p className="text-xs text-gray-500">Sistema de Administración</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* User info and logout */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {children}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Dashboard mejorado con cards responsive
const Dashboard = () => {
  const stats = [
    { name: 'Ventas Hoy', value: '$45,230', change: '+12%', changeType: 'positive', icon: ShoppingCart },
    { name: 'Productos', value: '156', change: '+3', changeType: 'positive', icon: Package },
    { name: 'Clientes', value: '89', change: '+5', changeType: 'positive', icon: Users },
    { name: 'Stock Bajo', value: '12', change: '-2', changeType: 'negative', icon: Building },
  ];

  const recentSales = [
    { id: 1, customer: 'María González', amount: 12500, items: 3, time: '2 min' },
    { id: 2, customer: 'Juan Pérez', amount: 8900, items: 2, time: '15 min' },
    { id: 3, customer: 'Ana López', amount: 15600, items: 4, time: '1 hora' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Bienvenido al sistema de administración de Carnicería Muñoz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                stat.changeType === 'positive' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {stat.change}
              </span>
              <span className="text-xs text-gray-500 ml-2">vs ayer</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Recientes</h3>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{sale.customer}</p>
                    <p className="text-xs text-gray-500">{sale.items} productos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${sale.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{sale.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/ventas"
              className="flex flex-col items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-primary-700">Nueva Venta</span>
            </Link>
            <Link
              to="/productos"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-700">Gestionar Productos</span>
            </Link>
            <Link
              to="/inventario"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Building className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-700">Ver Inventario</span>
            </Link>
            <Link
              to="/reportes"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-700">Ver Reportes</span>
            </Link>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando Carnicería Muñoz...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        {user ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <Store className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Carnicería Muñoz</h1>
                <p className="text-gray-600">Sistema de Administración</p>
              </div>
              <FirebaseAuth onLogin={() => {}} />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App; 