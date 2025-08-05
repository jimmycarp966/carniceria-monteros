import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Store, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import FirebaseAuth from './components/FirebaseAuth';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Componente de Login con Firebase
const Login = ({ onLogin }) => {
  return <FirebaseAuth onLogin={onLogin} />;
};

// Componente de Layout
const Layout = ({ user, onLogout, children }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Carnicería Monteros
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.nombre || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <NavItem icon={Home} label="Dashboard" to="/" />
            <NavItem icon={Package} label="Productos" to="/productos" />
            <NavItem icon={ShoppingCart} label="Ventas" to="/ventas" />
            <NavItem icon={Building} label="Inventario" to="/inventario" />
            <NavItem icon={Users} label="Clientes" to="/clientes" />
            <NavItem icon={UserCheck} label="Empleados" to="/empleados" />
            <NavItem icon={Truck} label="Proveedores" to="/proveedores" />
            <NavItem icon={Tag} label="Categorías" to="/categorias" />
            <NavItem icon={BarChart3} label="Reportes" to="/reportes" />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Componente de navegación
const NavItem = ({ icon: Icon, label, to }) => {
  return (
    <a
      href={to}
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:border-b-2 hover:border-primary-600"
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </a>
  );
};

// Componente Dashboard
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalProductos: 0,
    totalClientes: 0,
    ventasHoy: 0
  });

  useEffect(() => {
    // Aquí cargarías los datos desde Firestore
    // Por ahora usamos datos de ejemplo
    setStats({
      totalVentas: 1250,
      totalProductos: 45,
      totalClientes: 89,
      ventasHoy: 12
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del negocio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ventas Totales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.totalVentas.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Productos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalProductos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Clientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalClientes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ventas Hoy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.ventasHoy}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          ¡Bienvenido al Sistema de Administración!
        </h2>
        <p className="text-gray-600">
          Este es el sistema de administración para Carnicería Monteros. 
          Aquí puedes gestionar productos, ventas, clientes y más.
        </p>
      </div>
    </div>
  );
};

// Componente principal App
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          id: user.uid,
          email: user.email,
          nombre: user.displayName || 'Usuario',
          rol: 'admin'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<div className="p-6">Productos - En desarrollo</div>} />
              <Route path="/ventas" element={<div className="p-6">Ventas - En desarrollo</div>} />
              <Route path="/inventario" element={<div className="p-6">Inventario - En desarrollo</div>} />
              <Route path="/clientes" element={<div className="p-6">Clientes - En desarrollo</div>} />
              <Route path="/empleados" element={<div className="p-6">Empleados - En desarrollo</div>} />
              <Route path="/proveedores" element={<div className="p-6">Proveedores - En desarrollo</div>} />
              <Route path="/categorias" element={<div className="p-6">Categorías - En desarrollo</div>} />
              <Route path="/reportes" element={<div className="p-6">Reportes - En desarrollo</div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        )}
      </div>
    </Router>
  );
};

export default App; 