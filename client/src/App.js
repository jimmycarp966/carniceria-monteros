import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { Store, Eye, EyeOff, LogOut, Home, Package, ShoppingCart, Users, UserCheck, Truck, Tag, Building, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

// Configurar axios para incluir el token en todas las peticiones
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

// Componente de Login
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Intentando login con:', { email, password });
      console.log('URL base:', axios.defaults.baseURL);
      
      const response = await axios.post('/auth/login', { email, password });
      console.log('Respuesta del servidor:', response.data);
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('¡Inicio de sesión exitoso!');
      onLogin(user);
    } catch (error) {
      console.error('Error en login:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      const message = error.response?.data?.error || error.message || 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Carnicería Monteros
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Administración
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input rounded-t-lg rounded-b-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input rounded-t-none rounded-b-lg pr-10"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de Layout
const Layout = ({ user, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Productos', href: '/productos', icon: Package },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Empleados', href: '/empleados', icon: UserCheck },
    { name: 'Proveedores', href: '/proveedores', icon: Truck },
    { name: 'Categorías', href: '/categorias', icon: Tag },
    { name: 'Sucursales', href: '/sucursales', icon: Building },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Sesión cerrada exitosamente');
    onLogout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-0 z-50 flex-shrink-0 w-64 transition duration-300 ease-in-out`}>
        <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
          <Store className="h-8 w-8 text-white" />
          <span className="ml-2 text-white font-semibold">Carnicería Monteros</span>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="sidebar-link group"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </a>
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Bienvenido, {user?.nombre}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Componente de Dashboard
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/dashboard');
        setData(response.data);
      } catch (error) {
        toast.error('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen del negocio</p>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Productos</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.productos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ventas Hoy</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.ventas_hoy}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Clientes</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.clientes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sucursales</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.sucursales}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal App
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verificar token
      axios.get('/auth/verify')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
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
    <>
      <Toaster position="top-right" />
      <Router>
        {user ? (
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Productos</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/ventas" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Ventas</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/clientes" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Clientes</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/empleados" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Empleados</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/proveedores" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Proveedores</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/categorias" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Categorías</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/sucursales" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Sucursales</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="/reportes" element={<div className="space-y-6"><h1 className="text-2xl font-bold">Reportes</h1><p className="text-gray-600">Módulo en desarrollo...</p></div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </Router>
    </>
  );
};

export default App; 