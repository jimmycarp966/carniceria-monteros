import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Plus,
  LogIn,
  LogOut,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Calculator,
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';
import realtimeService, { dataSyncService } from '../services/realtimeService';
import { shiftService, saleService } from '../services/firebaseService';
import CashRegisterAccessGuard from './CashRegisterAccessGuard';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import toast from 'react-hot-toast';

// Componente modal memoizado para evitar re-renders
const OpenShiftModal = memo(({ 
  isOpen, 
  onClose, 
  onOpenShift, 
  currentUser, 
  userRole 
}) => {
  const [shiftType, setShiftType] = useState('morning');
  const [openingAmount, setOpeningAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const handleOpenShift = () => {
    onOpenShift({ shiftType, openingAmount, notes });
  };

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleOpenShift}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Abrir Turno
          </button>
        </div>
      </div>
    </div>
  );
});

OpenShiftModal.displayName = 'OpenShiftModal';

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

  // Estados para cerrar turno
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');

  // Estados para el nuevo sistema de arqueo
  const [cashCount, setCashCount] = useState({
    1000: 0,  // $1000
    500: 0,   // $500
    200: 0,   // $200
    100: 0,   // $100
    50: 0,    // $50
    20: 0,    // $20
    10: 0,    // $10
    5: 0,     // $5
    2: 0,     // $2
    1: 0      // $1
  });
  const [tarjetaDebitoAmount, setTarjetaDebitoAmount] = useState(0);
  const [tarjetaCreditoAmount, setTarjetaCreditoAmount] = useState(0);
  const [transferenciaAmount, setTransferenciaAmount] = useState(0);
  const [mercadopagoAmount, setMercadopagoAmount] = useState(0);
  const [showCashCountModal, setShowCashCountModal] = useState(false);

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

  // Calcular total del arqueo de efectivo
  const calculateCashTotal = useCallback(() => {
    return Object.entries(cashCount).reduce((total, [denomination, count]) => {
      return total + (parseInt(denomination) * count);
    }, 0);
  }, [cashCount]);

  // Calcular total general del arqueo
  const calculateArqueoTotal = useCallback(() => {
    return calculateCashTotal() + (tarjetaDebitoAmount + tarjetaCreditoAmount) + transferenciaAmount + mercadopagoAmount;
  }, [calculateCashTotal, tarjetaDebitoAmount, tarjetaCreditoAmount, transferenciaAmount, mercadopagoAmount]);

  // Calcular diferencia con el esperado
  const calculateDifference = useCallback(() => {
    const expected = shiftStats.netAmount;
    const actual = calculateArqueoTotal();
    return actual - expected;
  }, [shiftStats.netAmount, calculateArqueoTotal]);

  // Función para cerrar turno
  const closeShift = useCallback(async () => {
    if (!canCloseShift) {
      toast.error(`Su rol de ${userRole?.displayName} no puede cerrar turnos`);
      return;
    }

    try {
      const difference = calculateDifference();
      const arqueoData = {
        cashCount,
        efectivoAmount: calculateCashTotal(),
        tarjetaDebitoAmount,
        tarjetaCreditoAmount,
        tarjetaAmount: tarjetaDebitoAmount + tarjetaCreditoAmount,
        transferenciaAmount,
        mercadopagoAmount,
        totalArqueo: calculateArqueoTotal(),
        expectedAmount: shiftStats.netAmount,
        difference,
        hasDifference: Math.abs(difference) > 0
      };

      const shiftData = {
        ...currentShift,
        endTime: new Date(),
        closingAmount,
        closingNotes,
        status: 'closed',
        closedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role || 'ayudante'
        },
        arqueo: arqueoData
      };

      await shiftService.updateShift(currentShift.id, shiftData);
      
      // Sincronizar en tiempo real
      await dataSyncService.syncShift({ ...shiftData, id: currentShift.id });
      
      setShowCloseShiftModal(false);
      setClosingAmount(0);
      setClosingNotes('');
      setCashCount({
        1000: 0, 500: 0, 200: 0, 100: 0, 50: 0,
        20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      });
      setTarjetaDebitoAmount(0);
      setTarjetaCreditoAmount(0);
      setTransferenciaAmount(0);
      setMercadopagoAmount(0);
      
      toast.success('Turno cerrado exitosamente');
      
      // Recargar datos
      const shifts = await shiftService.getAllShifts();
      const activeShift = shifts.find(shift => shift.status === 'active' || !shift.endTime);
      if (activeShift) {
        setCurrentShift(activeShift);
        loadShiftData(activeShift);
      } else {
        setCurrentShift(null);
        setShiftStats({
          salesCount: 0,
          totalRevenue: 0,
          totalAdditionalIncomes: 0,
          netAmount: 0
        });
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error cerrando turno:', error);
      toast.error('Error al cerrar el turno');
    }
  }, [canCloseShift, userRole, currentUser, currentShift, closingAmount, closingNotes, shiftStats, cashCount, tarjetaDebitoAmount, tarjetaCreditoAmount, transferenciaAmount, mercadopagoAmount, calculateArqueoTotal, calculateCashTotal, calculateDifference]);

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

  // Función para actualizar conteo de billetes/monedas
  const updateCashCount = (denomination, count) => {
    setCashCount(prev => ({
      ...prev,
      [denomination]: parseInt(count) || 0
    }));
  };

  // Función para abrir turno
  const openShift = useCallback(async (modalData) => {
    const { shiftType, openingAmount, notes } = modalData;
    
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
      await dataSyncService.syncShift({ ...shiftData, id: shiftId });
      
      setShowOpenShiftModal(false);
      
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
  }, [canOpenShift, userRole, currentUser]);

  // Modal para cerrar turno
  const CloseShiftModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
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

        {/* Arqueo */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Arqueo de Caja</h4>
            <button
              onClick={() => setShowCashCountModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
            >
              Realizar Arqueo
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Efectivo:</span>
              <span className="font-medium text-green-600">${calculateCashTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarjeta Débito:</span>
              <span className="font-medium text-blue-600">${tarjetaDebitoAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarjeta Crédito:</span>
              <span className="font-medium text-indigo-600">${tarjetaCreditoAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Transferencias:</span>
              <span className="font-medium text-purple-600">${transferenciaAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>MercadoPago:</span>
              <span className="font-medium text-orange-600">${mercadopagoAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Total Arqueo:</span>
              <span className="font-bold text-primary-600">${calculateArqueoTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Diferencia:</span>
              <span className={`font-bold ${calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculateDifference() >= 0 ? '+' : ''}${calculateDifference().toLocaleString()}
              </span>
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

  // Modal para conteo de efectivo
  const CashCountModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-6 w-6 mr-2 text-green-600" />
          Arqueo de Efectivo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Denominaciones */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Conteo de Billetes y Monedas</h4>
            <div className="space-y-3">
              {Object.entries(cashCount).map(([denomination, count]) => (
                <div key={denomination} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    ${parseInt(denomination).toLocaleString()}
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCashCount(denomination, Math.max(0, count - 1))}
                      className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => updateCashCount(denomination, e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      min="0"
                    />
                    <button
                      onClick={() => updateCashCount(denomination, count + 1)}
                      className="w-8 h-8 bg-green-200 text-green-700 rounded-full hover:bg-green-300 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Resumen del Arqueo</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Efectivo:</span>
                <span className="font-semibold text-green-600">
                  ${calculateCashTotal().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tarjeta Débito:</span>
                <span className="font-semibold text-blue-600">
                  ${tarjetaDebitoAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tarjeta Crédito:</span>
                <span className="font-semibold text-indigo-600">
                  ${tarjetaCreditoAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transferencias:</span>
                <span className="font-semibold text-purple-600">
                  ${transferenciaAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">MercadoPago:</span>
                <span className="font-semibold text-orange-600">
                  ${mercadopagoAmount.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total Arqueo:</span>
                  <span className="font-bold text-primary-600">
                    ${calculateArqueoTotal().toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Esperado:</span>
                  <span className="font-medium text-gray-600">
                    ${shiftStats.netAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Diferencia:</span>
                  <span className={`font-bold ${calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateDifference() >= 0 ? '+' : ''}${calculateDifference().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs para métodos de pago */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta Débito:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={tarjetaDebitoAmount}
                    onChange={(e) => setTarjetaDebitoAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta Crédito:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={tarjetaCreditoAmount}
                    onChange={(e) => setTarjetaCreditoAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transferencias:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={transferenciaAmount}
                    onChange={(e) => setTransferenciaAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MercadoPago:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={mercadopagoAmount}
                    onChange={(e) => setMercadopagoAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowCashCountModal(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              setClosingAmount(calculateArqueoTotal());
              setShowCashCountModal(false);
            }}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Confirmar Arqueo
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

                {/* Eliminado: <button
                  onClick={generateDailyReport}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reporte Diario
                </button> */}
              </div>

                {/* Información del turno */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Turno</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Tipo:</strong> {currentShift.type === 'morning' ? 'Mañana' : 'Tarde'}</p>
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
        {showOpenShiftModal && <OpenShiftModal 
          isOpen={showOpenShiftModal} 
          onClose={() => setShowOpenShiftModal(false)} 
          onOpenShift={openShift} 
          currentUser={currentUser} 
          userRole={userRole} 
        />}
        {showCloseShiftModal && <CloseShiftModal />}
        {showIncomeModal && <IncomeModal />}
        {showCashCountModal && <CashCountModal />}
        {/* Eliminado: {showDailyReportModal && <DailyReportModal />} */}
      </div>
    </CashRegisterAccessGuard>
  );
};

export default CashRegister; 