import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Receipt,
  User,
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Eye,
  EyeOff,

  LogOut,
  LogIn
} from 'lucide-react';
import { realtimeService } from '../services/realtimeService';
import { shiftService, saleService } from '../services/firebaseService';
import CashRegisterAccessGuard from './CashRegisterAccessGuard';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import toast from 'react-hot-toast';

const CashRegister = () => {
  // Hook de control de acceso
  const { 
    currentUser, 
    userRole, 
    canOpenShift, 
    canCloseShift 
  } = useCashRegisterAccess();

  // Estados principales
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftStats, setShiftStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalAdditionalIncomes: 0,
    salesCount: 0,
    netAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para operaciones
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);

  // Estados para abrir turno
  const [openingAmount, setOpeningAmount] = useState(0);
  const [shiftType, setShiftType] = useState('morning');
  const [notes, setNotes] = useState('');

  // Estados para cerrar turno
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');

  // Estados para ingresos
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('venta_adicional');

  // Cargar datos iniciales
  useEffect(() => {
    const initCashRegister = async () => {
      try {
        setIsLoading(true);

        // Buscar turno activo
        const shifts = await shiftService.getAllShifts();
        const activeShift = shifts.find(shift => shift.status === 'active' || !shift.endTime);
        
        if (activeShift) {
          setCurrentShift(activeShift);
          await loadShiftData(activeShift);
        }

      } catch (error) {
        console.error('Error cargando datos de caja:', error);
        toast.error('Error cargando datos de la caja');
      } finally {
        setIsLoading(false);
      }
    };

    const setupListeners = () => {
      // Escuchar cambios en ventas
      realtimeService.on('sales_updated', (data) => {
        if (currentShift && data.sales) {
          loadShiftData(currentShift);
        }
      });

      // Escuchar nuevas ventas
      realtimeService.on('sale_synced', (data) => {
        if (currentShift) {
          loadShiftData(currentShift);
          toast.success('Nueva venta registrada en la caja');
        }
      });

      // Escuchar cambios en turnos
      realtimeService.on('shifts_updated', (data) => {
        if (data.shifts) {
          const activeShift = data.shifts.find(shift => shift.status === 'active' || !shift.endTime);
      if (activeShift) {
            setCurrentShift(activeShift);
            loadShiftData(activeShift);
          } else {
            setCurrentShift(null);
            setShiftStats({
              totalSales: 0,
              totalRevenue: 0,
              totalAdditionalIncomes: 0,
              salesCount: 0,
              netAmount: 0
            });
            setRecentActivity([]);
          }
        }
      });
    };

    initCashRegister();
    setupListeners();

    return () => {
      realtimeService.off('sales_updated');
      realtimeService.off('sale_synced');
      realtimeService.off('shifts_updated');
    };
  }, [currentShift]);

  

  const loadShiftData = async (shift) => {
    try {
      // Cargar ventas del turno
      const allSales = await saleService.getAllSales();
      const shiftSales = allSales.filter(sale => sale.shiftId === shift.id);
      
      // Cargar ingresos adicionales del turno (diferentes a las ventas)
      // Por ahora simulamos ingresos hasta que tengamos el servicio implementado
      const shiftIncomes = []; // TODO: Implementar incomeService
      
      // Calcular estadísticas
      const totalRevenue = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalAdditionalIncomes = shiftIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
      
      setShiftStats({
        totalSales: shiftSales.length,
        totalRevenue,
        totalAdditionalIncomes,
        salesCount: shiftSales.length,
        netAmount: totalRevenue + totalAdditionalIncomes
      });

      // Cargar actividad reciente
      const activity = [
        ...shiftSales.map(sale => ({
          id: sale.id,
          type: 'sale',
          amount: sale.total,
          description: `Venta - ${sale.products?.length || 0} productos`,
          timestamp: sale.createdAt || sale.timestamp,
          employeeName: sale.employeeName || sale.processedBy?.name
        })),
        ...shiftIncomes.map(income => ({
          id: income.id,
          type: 'income',
          amount: income.amount,
          description: income.description || income.concept,
          timestamp: income.createdAt || income.date,
          employeeName: income.employeeName || income.createdBy?.name
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

      setRecentActivity(activity);

    } catch (error) {
      console.error('Error cargando datos del turno:', error);
    }
  };





  // Cerrar turno
  const closeShift = async () => {
    if (!canCloseShift) {
      toast.error(`Su rol de ${userRole?.displayName} no puede cerrar turnos`);
      return;
    }

    if (!currentShift) {
      toast.error('No hay turno activo para cerrar');
      return;
    }

    try {
      const updatedShift = {
        ...currentShift,
          endTime: new Date(),
        closingAmount: parseFloat(closingAmount) || 0,
        closingNotes: closingNotes.trim(),
        status: 'closed',
        finalTotal: shiftStats.netAmount,
        closedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role,
          timestamp: new Date()
        }
      };

      await shiftService.updateShift(currentShift.id, updatedShift);
      
      setCurrentShift(null);
      setShowCloseShiftModal(false);
      setClosingAmount(0);
      setClosingNotes('');
      
      toast.success('Turno cerrado exitosamente');
      
    } catch (error) {
      console.error('Error cerrando turno:', error);
      toast.error('Error al cerrar el turno');
    }
  };

  // Registrar ingreso adicional
  const registerIncome = async () => {
    if (!currentShift) {
      toast.error('Debe haber un turno activo para registrar ingresos');
      return;
    }

    if (!incomeAmount || incomeAmount <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    if (!incomeDescription.trim()) {
      toast.error('Ingrese una descripción del ingreso');
      return;
    }

    try {
      // Por ahora simulamos el registro hasta implementar incomeService
      const incomeData = {
        amount: parseFloat(incomeAmount),
        description: incomeDescription.trim(),
        category: incomeCategory,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date(),
        shiftId: currentShift.id,
        employeeName: currentUser?.name,
        employeeId: currentUser?.employeeId || currentUser?.id,
        createdBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role
        }
      };

      // TODO: Implementar incomeService.addIncome(incomeData);
      console.log('Ingreso registrado:', incomeData);
      
      setShowIncomeModal(false);
      setIncomeAmount(0);
      setIncomeDescription('');
      setIncomeCategory('venta_adicional');
      
      // Recargar datos del turno
      loadShiftData(currentShift);
      
      toast.success('Ingreso registrado exitosamente');
      
        } catch (error) {
      console.error('Error registrando ingreso:', error);
      toast.error('Error al registrar el ingreso');
    }
  };

  // Función para abrir turno
  const openShift = useCallback(async () => {
    if (!canOpenShift) {
      toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
      return;
    }

    if (!openingAmount || openingAmount < 0) {
      toast.error('Ingrese un monto de apertura válido');
      return;
    }

    try {
      const shiftData = {
        employeeName: currentUser?.name,
        employeeEmail: currentUser?.email,
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeRole: currentUser?.role || 'ayudante',
        employeePosition: userRole?.displayName,
        openedBy: `${currentUser?.name} (${userRole?.displayName})`,
        type: shiftType,
        openingAmount: parseFloat(openingAmount),
        notes,
        openTime: new Date(),
        date: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      const shiftId = await shiftService.addShift(shiftData);
      
      // Sincronizar en tiempo real
      await realtimeService.syncShift({ ...shiftData, id: shiftId });
      
      setShowOpenShiftModal(false);
      setOpeningAmount(0);
      setNotes('');
      setShiftType('morning');
      
      toast.success('Turno abierto exitosamente');
      
      // Recargar datos
      const shifts = await shiftService.getAllShifts();
      const activeShift = shifts.find(shift => shift.status === 'active' || !shift.endTime);
      if (activeShift) {
        setCurrentShift(activeShift);
        loadShiftData(activeShift);
      }
    } catch (error) {
      console.error('Error abriendo turno:', error);
      toast.error('Error al abrir el turno');
    }
  }, [canOpenShift, userRole, currentUser, openingAmount, shiftType, notes]);

  // Modal para abrir turno - usar useCallback para evitar re-renders
  const OpenShiftModal = useCallback(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <LogIn className="h-6 w-6 mr-2 text-green-600" />
          Abrir Turno
        </h3>
        
        {/* Usuario actual */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">{currentUser?.name}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-600">{userRole?.displayName}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Turno:</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
              <option value="night">Noche</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto de Apertura:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
        </div>
      </div>

                    <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Observaciones del turno..."
            />
                    </div>
                    </div>

        <div className="flex space-x-3 mt-6">
                <button
            onClick={() => setShowOpenShiftModal(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Cancelar
                </button>
                <button
            onClick={openShift}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Abrir Turno
                </button>
            </div>
          </div>
        </div>
  ), [shiftType, openingAmount, notes, currentUser, userRole, openShift]);

  // Modal para cerrar turno
  const CloseShiftModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <LogOut className="h-6 w-6 mr-2 text-red-600" />
          Cerrar Turno
        </h3>

        {/* Resumen del turno */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Resumen del Turno</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Ventas:</span>
              <span className="font-medium">{shiftStats.salesCount}</span>
                </div>
            <div className="flex justify-between">
              <span>Ingresos:</span>
              <span className="font-medium text-green-600">${shiftStats.totalRevenue.toLocaleString()}</span>
                </div>
            <div className="flex justify-between">
              <span>Ingresos Adicionales:</span>
              <span className="font-medium text-green-600">${shiftStats.totalAdditionalIncomes.toLocaleString()}</span>
              </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Total Neto:</span>
              <span className="font-bold text-primary-600">${shiftStats.netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

              <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto en Caja:</label>
                  <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Contar dinero en caja"
              />
            </div>
                  </div>
                  
                            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones:</label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Notas del cierre..."
            />
                            </div>
                </div>

        <div className="flex space-x-3 mt-6">
                    <button
            onClick={() => setShowCloseShiftModal(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
            Cancelar
                    </button>
                    <button
            onClick={closeShift}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                    >
            Cerrar Turno
                    </button>
                  </div>
                </div>
              </div>
  );

  // Modal para registrar ingreso adicional
  const IncomeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Plus className="h-6 w-6 mr-2 text-green-600" />
          Registrar Ingreso Adicional
        </h3>

        <div className="space-y-4">
                      <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción:</label>
            <input
              type="text"
              value={incomeDescription}
              onChange={(e) => setIncomeDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="¿De dónde proviene este ingreso?"
            />
              </div>

                        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría:</label>
            <select
              value={incomeCategory}
              onChange={(e) => setIncomeCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="venta_adicional">Venta Adicional</option>
              <option value="servicio_extra">Servicio Extra</option>
              <option value="propina">Propina</option>
              <option value="reintegro">Reintegro</option>
              <option value="otro">Otro</option>
            </select>
                      </div>
            </div>

        <div className="flex space-x-3 mt-6">
                  <button
            onClick={() => setShowIncomeModal(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
            Cancelar
                  </button>
                  <button
            onClick={registerIncome}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Registrar Ingreso
                  </button>
                </div>
                  </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caja registradora...</p>
                  </div>
              </div>
    );
  }

  return (
    <CashRegisterAccessGuard>
      <div className="p-4 lg:p-6 w-full max-w-7xl mx-auto">
        {/* Header con información del usuario y estado */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Caja Registradora</h1>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">{currentUser?.name}</span>
                <span className="mx-2">•</span>
                <Shield className="h-3 w-3 mr-1" />
                <span>{userRole?.displayName}</span>
                <span className="mx-2">•</span>
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date().toLocaleDateString('es-ES')}</span>
              </div>
                  </div>

            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              {/* Toggle para mostrar/ocultar montos */}
              <button
                onClick={() => setShowAmounts(!showAmounts)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="text-sm">{showAmounts ? 'Ocultar' : 'Mostrar'} Montos</span>
              </button>

              {/* Estado del turno */}
              {currentShift ? (
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Turno Activo
                  </div>
                  <span className="text-sm text-gray-500">
                    desde {currentShift.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                  </span>
                </div>
              ) : (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  Sin Turno Activo
                      </div>
              )}
            </div>
          </div>
        </div>

        {!currentShift ? (
          /* Sin turno activo - Mostrar opciones para abrir */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No hay turno activo</h2>
            <p className="text-gray-600 mb-6">Para comenzar a operar la caja debe abrir un turno</p>
            
              <button
              onClick={() => {
                if (!canOpenShift) {
                  toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
                  return;
                }
                setShowOpenShiftModal(true);
              }}
              disabled={!canOpenShift}
              className={`px-6 py-3 rounded-lg font-medium flex items-center mx-auto ${
                canOpenShift 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <LogIn className="h-5 w-5 mr-2" />
              {canOpenShift ? 'Abrir Turno' : 'Sin Permisos para Abrir Turno'}
              </button>
            </div>
        ) : (
          /* Con turno activo - Dashboard de caja */
          <>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ventas del Turno</p>
                    <p className="text-2xl font-bold text-gray-900">{shiftStats.salesCount}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-primary-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {showAmounts ? `$${shiftStats.totalRevenue.toLocaleString()}` : '••••••'}
                    </p>
                      </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Adicionales</p>
                    <p className="text-2xl font-bold text-green-600">
                      {showAmounts ? `$${shiftStats.totalAdditionalIncomes.toLocaleString()}` : '••••••'}
                    </p>
                      </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Neto</p>
                    <p className={`text-2xl font-bold ${shiftStats.netAmount >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                      {showAmounts ? `$${shiftStats.netAmount.toLocaleString()}` : '••••••'}
                    </p>
                      </div>
                  <DollarSign className="h-8 w-8 text-primary-600" />
                    </div>
                </div>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel de acciones */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Acciones de Caja
                </h3>

                <div className="space-y-3">
                <button
                    onClick={() => setShowIncomeModal(true)}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Ingreso
                </button>

                <button
                  onClick={() => {
                      if (!canCloseShift) {
                        toast.error(`Su rol de ${userRole?.displayName} no puede cerrar turnos`);
                        return;
                      }
                      setShowCloseShiftModal(true);
                    }}
                    disabled={!canCloseShift}
                    className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      canCloseShift
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {canCloseShift ? 'Cerrar Turno' : 'Sin Permisos'}
                </button>
              </div>

                {/* Información del turno */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Turno</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Tipo:</strong> {currentShift.type === 'morning' ? 'Mañana' : currentShift.type === 'afternoon' ? 'Tarde' : 'Noche'}</p>
                    <p><strong>Inicio:</strong> {currentShift.startTime?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                    <p><strong>Apertura:</strong> {showAmounts ? `$${(currentShift.openingAmount || 0).toLocaleString()}` : '••••••'}</p>
                    {currentShift.notes && <p><strong>Notas:</strong> {currentShift.notes}</p>}
            </div>
          </div>
        </div>

              {/* Actividad reciente */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Actividad Reciente del Turno
                </h3>

                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay actividad registrada en este turno</p>
            </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {activity.type === 'sale' ? (
                            <TrendingUp className="h-4 w-4 text-green-600 mr-3" />
                          ) : activity.type === 'income' ? (
                            <Plus className="h-4 w-4 text-green-600 mr-3" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 mr-3" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {activity.employeeName} • {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
            </div>
          </div>
                        <span className={`font-bold ${activity.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                          {activity.type === 'sale' ? '+' : '-'}
                          {showAmounts ? `$${activity.amount?.toLocaleString()}` : '••••'}
                        </span>
                      </div>
                    ))}
        </div>
      )}
    </div>
            </div>
          </>
        )}

        {/* Modales */}
        {showOpenShiftModal && <OpenShiftModal />}
        {showCloseShiftModal && <CloseShiftModal />}
        {showIncomeModal && <IncomeModal />}
      </div>
    </CashRegisterAccessGuard>
  );
};

export default CashRegister; 