import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Store, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3, Menu, X, DollarSign } from 'lucide-react';
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

const NavItem = ({ icon: Icon, label, to, onClick, isActive }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        isActive 
          ? 'text-primary-700 bg-primary-50 border border-primary-200 shadow-sm' 
          : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
      }`}
    >
      <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState('/');

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
    { icon: Home, label: 'Menú Principal', to: '/' },
    { icon: DollarSign, label: 'Caja', to: '/caja' },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 rounded-xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Mejorado */}
      <div className={`
        fixed left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header Mejorado */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-xl">
                <Store className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Carnicería Muñoz</h1>
                <p className="text-xs text-gray-600">Sistema de Administración</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Mejorada */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                onClick={() => {
                  setSidebarOpen(false);
                  setActiveRoute(item.to);
                }}
                isActive={activeRoute === item.to}
              />
            ))}
          </nav>

          {/* User info and logout mejorado */}
          {user && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">
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
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content mejorado */}
      <div className="lg:pl-72 w-full">
        <div className="min-h-screen w-full">
          {children}
        </div>
      </div>

      {/* Mobile overlay mejorado */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
      {/* Header Mejorado */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <Home className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Menú Principal</h1>
            <p className="text-gray-600 mt-1">Bienvenido al sistema de administración de Carnicería Muñoz</p>
          </div>
        </div>
      </div>

      {/* Stats Grid Mejorado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-xl">
                <stat.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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

      {/* Content Grid Mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales Mejorado */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Ventas Recientes</h3>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900">{sale.customer}</p>
                    <p className="text-xs text-gray-500">{sale.items} productos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">${sale.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{sale.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Mejorado */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Acciones Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/caja"
              className="flex flex-col items-center p-6 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors border-2 border-primary-200 hover:border-primary-300"
            >
              <DollarSign className="h-10 w-10 text-primary-600 mb-3" />
              <span className="text-sm font-semibold text-primary-700 text-center">Abrir Caja</span>
            </Link>
            <Link
              to="/ventas"
              className="flex flex-col items-center p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border-2 border-green-200 hover:border-green-300"
            >
              <ShoppingCart className="h-10 w-10 text-green-600 mb-3" />
              <span className="text-sm font-semibold text-green-700 text-center">Nueva Venta</span>
            </Link>
            <Link
              to="/productos"
              className="flex flex-col items-center p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-300"
            >
              <Package className="h-10 w-10 text-blue-600 mb-3" />
              <span className="text-sm font-semibold text-blue-700 text-center">Gestionar Productos</span>
            </Link>
            <Link
              to="/inventario"
              className="flex flex-col items-center p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors border-2 border-purple-200 hover:border-purple-300"
            >
              <Building className="h-10 w-10 text-purple-600 mb-3" />
              <span className="text-sm font-semibold text-purple-700 text-center">Ver Inventario</span>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Cargando Carnicería Muñoz...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            },
          }}
        />
        {user ? (
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
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <div className="p-4 bg-primary-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Store className="h-12 w-12 text-primary-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Carnicería Muñoz</h1>
                <p className="text-gray-600 text-lg">Sistema de Administración</p>
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