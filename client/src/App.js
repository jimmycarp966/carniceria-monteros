import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contextos
import { PermissionsProvider } from './context/PermissionsContext';

// Componentes base
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import OfflineIndicator from './components/OfflineIndicator';

// Componentes de autenticación
import FirebaseAuth from './components/FirebaseAuth';

// Lazy loading de componentes para mejor performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const CashRegister = lazy(() => import('./components/CashRegister'));
const Products = lazy(() => import('./components/Products'));
const Sales = lazy(() => import('./components/Sales'));
const Inventory = lazy(() => import('./components/Inventory'));
const Customers = lazy(() => import('./components/Customers'));
const Employees = lazy(() => import('./components/Employees'));
const Suppliers = lazy(() => import('./components/Suppliers'));
const Categories = lazy(() => import('./components/Categories'));
const Reports = lazy(() => import('./components/Reports'));
const Purchases = lazy(() => import('./components/Purchases'));
const Expenses = lazy(() => import('./components/Expenses'));

// Componente de navegación principal
const MainLayout = lazy(() => import('./components/MainLayout'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Manejo del estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        toast.success(`Bienvenido, ${user.email}`);
      } else {
        console.log('🔓 Usuario no autenticado');
      }
    }, (error) => {
      console.error('❌ Error en autenticación:', error);
      toast.error('Error al verificar autenticación');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Manejo del estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Componente de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner-lg mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Cargando Sistema
          </h2>
          <p className="text-gray-500">
            Inicializando aplicación...
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar pantalla de login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <OfflineIndicator isOnline={isOnline} />
        <FirebaseAuth />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    );
  }

  // Aplicación principal con usuario autenticado
  return (
    <ErrorBoundary>
      <PermissionsProvider user={user}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {/* Indicador de estado offline */}
            <OfflineIndicator isOnline={isOnline} />
            
            {/* Layout principal */}
            <Suspense fallback={<LoadingSpinner />}>
              <MainLayout>
                <Routes>
                  {/* Ruta principal */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Dashboard */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Dashboard />
                      </Suspense>
                    } 
                  />
                  
                  {/* Caja Registradora */}
                  <Route 
                    path="/caja" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <CashRegister />
                      </Suspense>
                    } 
                  />
                  
                  {/* Gestión de Productos */}
                  <Route 
                    path="/productos" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Products />
                      </Suspense>
                    } 
                  />
                  
                  {/* Ventas */}
                  <Route 
                    path="/ventas" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Sales />
                      </Suspense>
                    } 
                  />
                  
                  {/* Inventario */}
                  <Route 
                    path="/inventario" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Inventory />
                      </Suspense>
                    } 
                  />
                  
                  {/* Clientes */}
                  <Route 
                    path="/clientes" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Customers />
                      </Suspense>
                    } 
                  />
                  
                  {/* Empleados */}
                  <Route 
                    path="/empleados" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Employees />
                      </Suspense>
                    } 
                  />
                  
                  {/* Proveedores */}
                  <Route 
                    path="/proveedores" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Suppliers />
                      </Suspense>
                    } 
                  />
                  
                  {/* Categorías */}
                  <Route 
                    path="/categorias" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Categories />
                      </Suspense>
                    } 
                  />
                  
                  {/* Reportes */}
                  <Route 
                    path="/reportes" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Reports />
                      </Suspense>
                    } 
                  />
                  
                  {/* Compras */}
                  <Route 
                    path="/compras" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Purchases />
                      </Suspense>
                    } 
                  />
                  
                  {/* Gastos */}
                  <Route 
                    path="/gastos" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Expenses />
                      </Suspense>
                    } 
                  />
                  
                  {/* Ruta 404 */}
                  <Route 
                    path="*" 
                    element={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Página no encontrada
                          </h2>
                          <p className="text-gray-500 mb-8">
                            La página que buscas no existe o ha sido movida.
                          </p>
                          <button
                            onClick={() => window.history.back()}
                            className="btn btn-primary"
                          >
                            Volver atrás
                          </button>
                        </div>
                      </div>
                    } 
                  />
                </Routes>
              </MainLayout>
            </Suspense>
            
            {/* Notificaciones */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              toastClassName="rounded-lg shadow-lg"
              bodyClassName="font-medium"
            />
          </div>
        </Router>
      </PermissionsProvider>
    </ErrorBoundary>
  );
}

export default App; 