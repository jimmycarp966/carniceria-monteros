import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Receipt,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Eye,
  EyeOff,

  Minus,
  LogOut,
  LogIn
} from 'lucide-react';
import { realtimeService } from '../services/realtimeService';
import { shiftService, saleService, expensesService } from '../services/firebaseService';
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
    totalExpenses: 0,
    salesCount: 0,
    netAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para operaciones
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);

  // Estados para abrir turno
  const [openingAmount, setOpeningAmount] = useState(0);
  const [shiftType, setShiftType] = useState('morning');
  const [notes, setNotes] = useState('');

  // Estados para cerrar turno
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');

  // Estados para gastos
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('operativo');

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
              totalExpenses: 0,
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
      
      // Cargar gastos del turno
      const allExpenses = await expensesService.getAllExpenses();
      const shiftExpenses = allExpenses.filter(expense => 
        expense.shiftId === shift.id || 
        (expense.date === shift.date && !expense.shiftId)
      );

      // Calcular estadísticas
      const totalRevenue = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalExpenses = shiftExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      
      setShiftStats({
        totalSales: shiftSales.length,
        totalRevenue,
        totalExpenses,
        salesCount: shiftSales.length,
        netAmount: totalRevenue - totalExpenses
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
        ...shiftExpenses.map(expense => ({
          id: expense.id,
          type: 'expense',
          amount: expense.amount,
          description: expense.description || expense.concept,
          timestamp: expense.createdAt || expense.date,
          employeeName: expense.employeeName || expense.createdBy?.name
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

      setRecentActivity(activity);

    } catch (error) {
      console.error('Error cargando datos del turno:', error);
    }
  };



  // Abrir turno
  const openShift = async () => {
    if (!canOpenShift) {
      toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
        return;
      }

    try {
      const shiftData = {
        type: shiftType,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(),
        openingAmount: parseFloat(openingAmount) || 0,
        employeeName: currentUser?.name,
        employeeEmail: currentUser?.email,
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeRole: currentUser?.role,
        notes: notes.trim(),
        status: 'active',
        totalSales: 0,
        salesCount: 0,
        openedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role,
          timestamp: new Date()
        }
      };

      const shiftId = await shiftService.addShift(shiftData);
      const newShift = { id: shiftId, ...shiftData };
      
      setCurrentShift(newShift);
      setShowOpenShiftModal(false);
      setOpeningAmount(0);
      setNotes('');
      
      toast.success(`Turno ${shiftType === 'morning' ? 'mañana' : 'tarde'} abierto exitosamente`);
      
    } catch (error) {
      console.error('Error abriendo turno:', error);
      toast.error('Error al abrir el turno');
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

  // Registrar gasto
  const registerExpense = async () => {
    if (!currentShift) {
      toast.error('Debe haber un turno activo para registrar gastos');
      return;
    }
    
    if (!expenseAmount || expenseAmount <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    if (!expenseDescription.trim()) {
      toast.error('Ingrese una descripción del gasto');
      return;
    }

    try {
      const expenseData = {
        amount: parseFloat(expenseAmount),
        description: expenseDescription.trim(),
        category: expenseCategory,
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

      await expensesService.addExpense(expenseData);
      
      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseDescription('');
      setExpenseCategory('operativo');
      
      // Recargar datos del turno
      loadShiftData(currentShift);
      
      toast.success('Gasto registrado exitosamente');
      
        } catch (error) {
      console.error('Error registrando gasto:', error);
      toast.error('Error al registrar el gasto');
    }
  };

  // Modal para abrir turno
  const OpenShiftModal = () => (
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
  );

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
              <span>Gastos:</span>
              <span className="font-medium text-red-600">${shiftStats.totalExpenses.toLocaleString()}</span>
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

  // Modal para registrar gasto
  const ExpenseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Minus className="h-6 w-6 mr-2 text-red-600" />
          Registrar Gasto
        </h3>

        <div className="space-y-4">
                      <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción:</label>
            <input
              type="text"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="¿En qué se gastó?"
            />
              </div>

                        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría:</label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="operativo">Operativo</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="suministros">Suministros</option>
              <option value="servicios">Servicios</option>
              <option value="otro">Otro</option>
            </select>
                      </div>
            </div>

        <div className="flex space-x-3 mt-6">
                  <button
            onClick={() => setShowExpenseModal(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
            Cancelar
                  </button>
                  <button
            onClick={registerExpense}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          >
            Registrar Gasto
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
                    <p className="text-sm font-medium text-gray-600">Gastos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {showAmounts ? `$${shiftStats.totalExpenses.toLocaleString()}` : '••••••'}
                    </p>
                      </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
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
                    onClick={() => setShowExpenseModal(true)}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                    <Minus className="h-4 w-4 mr-2" />
                    Registrar Gasto
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
        {showExpenseModal && <ExpenseModal />}
      </div>
    </CashRegisterAccessGuard>
  );
};

export default CashRegister; 