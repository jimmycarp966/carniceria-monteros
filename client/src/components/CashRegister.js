import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  DollarSign, 
  LogIn, 
  LogOut, 
  Plus, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  BarChart3,
  AlertTriangle,
  X,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { shiftService, saleService } from '../services/firebaseService';
import CashCountModal from './CashCountModal';
import realtimeService, { dataSyncService } from '../services/realtimeService';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import CashRegisterAccessGuard from './CashRegisterAccessGuard';

const CashRegister = () => {
  const { currentUser, userRole, canOpenShift, canCloseShift } = useCashRegisterAccess();
  
  // Estados principales
  const [isLoading, setIsLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftStats, setShiftStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalAdditionalIncomes: 0,
    salesCount: 0,
    netAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showAmounts, setShowAmounts] = useState(true);

  // Estados para modales
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showCashCountModal] = useState(false);
  const [showCashCountModalForClose, setShowCashCountModalForClose] = useState(false);
  const [showFinalizarDiaModal, setShowFinalizarDiaModal] = useState(false);

  // Estados para cerrar turno (mantenidos para compatibilidad futura)
  // const [closingAmount, setClosingAmount] = useState(0);
  // const [closingNotes, setClosingNotes] = useState('');

  // Estados para arqueo
  const [, setCashCount] = useState({
    20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0,
    20: 0, 10: 0, 5: 0, 2: 0, 1: 0
  });

  // Estados para ventas por método de pago
  const [, setSalesByPaymentMethod] = useState({
    efectivo: { count: 0, total: 0 },
    tarjetaDebito: { count: 0, total: 0 },
    tarjetaCredito: { count: 0, total: 0 },
    transferencia: { count: 0, total: 0 },
    mercadopago: { count: 0, total: 0 }
  });

  // Estados para ingresos
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('venta_adicional');

  const loadShiftData = useCallback(async (shift) => {
    try {
      console.log(`📊 Cargando datos del turno: ${shift.id}`);
      
      // Cargar ventas del turno
      const allSales = await saleService.getAllSales();
      const shiftSales = allSales.filter(sale => sale.shiftId === shift.id);
      
      // Calcular estadísticas
      const totalRevenue = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalAdditionalIncomes = 0; // TODO: Implementar incomeService
      
      // Calcular ventas por método de pago
      const salesByMethod = {
        efectivo: { count: 0, total: 0 },
        tarjetaDebito: { count: 0, total: 0 },
        tarjetaCredito: { count: 0, total: 0 },
        transferencia: { count: 0, total: 0 },
        mercadopago: { count: 0, total: 0 }
      };

      shiftSales.forEach(sale => {
        const paymentMethod = sale.paymentMethod;
        if (paymentMethod === 'efectivo') {
          salesByMethod.efectivo.count++;
          salesByMethod.efectivo.total += sale.total || 0;
        } else if (paymentMethod === 'tarjeta') {
          if (sale.cardType === 'credito') {
            salesByMethod.tarjetaCredito.count++;
            salesByMethod.tarjetaCredito.total += sale.total || 0;
          } else {
            salesByMethod.tarjetaDebito.count++;
            salesByMethod.tarjetaDebito.total += sale.total || 0;
          }
        } else if (paymentMethod === 'transferencia') {
          salesByMethod.transferencia.count++;
          salesByMethod.transferencia.total += sale.total || 0;
        } else if (paymentMethod === 'mercadopago') {
          salesByMethod.mercadopago.count++;
          salesByMethod.mercadopago.total += sale.total || 0;
        }
      });

      const netAmount = totalRevenue + totalAdditionalIncomes;

      setShiftStats({
        totalSales: shiftSales.length,
        totalRevenue,
        totalAdditionalIncomes,
        salesCount: shiftSales.length,
        netAmount
      });

      setSalesByPaymentMethod(salesByMethod);
      setRecentActivity(shiftSales.slice(-5).reverse());

      console.log(`✅ Datos cargados: ${shiftSales.length} ventas, $${totalRevenue} ingresos`);
    } catch (error) {
      console.error('Error cargando datos del turno:', error);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const initCashRegister = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Inicializando caja registradora...');

        // Buscar turno activo
        const shifts = await shiftService.getAllShifts();
        console.log(`📊 Turnos encontrados: ${shifts.length}`);
        
        const activeShift = shifts.find(shift => shift.status === 'active' || !shift.endTime);
        
        if (activeShift) {
          console.log(`✅ Turno activo encontrado: ${activeShift.id}`);
          setCurrentShift(activeShift);
          await loadShiftData(activeShift);
        } else {
          console.log('❌ No hay turno activo');
          setCurrentShift(null);
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

    // Listener para reset forzado de turnos
    const handleForceResetShifts = () => {
      console.log('🔄 Recibido evento de reset forzado de turnos');
      setCurrentShift(null);
      setShiftStats({
        totalSales: 0,
        totalRevenue: 0,
        totalAdditionalIncomes: 0,
        salesCount: 0,
        netAmount: 0
      });
      setRecentActivity([]);
      setCashCount({
        20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0,
        20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      });
      toast.success('Turnos reseteados completamente');
    };

    initCashRegister();
    setupListeners();
    
    // Agregar listener para reset forzado
    window.addEventListener('forceResetShifts', handleForceResetShifts);

    return () => {
      realtimeService.off('sales_updated');
      realtimeService.off('sale_synced');
      realtimeService.off('shifts_updated');
      window.removeEventListener('forceResetShifts', handleForceResetShifts);
    };
  }, [currentShift, loadShiftData]);







  // Función para cerrar turno
  const closeShift = useCallback(async () => {
    if (!canCloseShift) {
      toast.error(`Su rol de ${userRole?.displayName} no puede cerrar turnos`);
      return;
    }

    if (!currentShift) {
      toast.error('No hay turno activo para cerrar');
      return;
    }

    // Verificar que el turno aún existe en la base de datos
    try {
      const shifts = await shiftService.getAllShifts();
      const shiftExists = shifts.find(shift => shift.id === currentShift.id);
      
      if (!shiftExists) {
        toast.error('El turno ya no existe o fue cerrado por otro usuario');
        setCurrentShift(null);
        setShiftStats({
          totalSales: 0,
          totalRevenue: 0,
          totalAdditionalIncomes: 0,
          netAmount: 0
        });
        setRecentActivity([]);
        return;
      }

      // OBLIGATORIO: Mostrar modal de arqueo antes de cerrar
      setShowCashCountModalForClose(true);
      setShowCloseShiftModal(false);
      
    } catch (error) {
      console.error('Error verificando turno:', error);
      toast.error('Error al verificar el turno');
    }
  }, [canCloseShift, userRole, currentShift]);

  // Función para completar el cierre después del arqueo
  const completeShiftClose = useCallback(async (cashCountData, differences) => {
    try {
      const shiftData = {
        ...currentShift,
        endTime: new Date(),
        closingAmount: differences.finalTotal,
        closingNotes: `Arqueo completado - ${differences.hasDifference ? 'Con diferencia' : 'Balanceado'}`,
        status: 'closed',
        closedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role || 'ayudante'
        },
        cashCountId: cashCountData.id,
        arqueo: {
          ...differences,
          cashCountData
        }
      };

      await shiftService.updateShift(currentShift.id, shiftData);
      
      // Sincronizar en tiempo real
      await dataSyncService.syncShift({ ...shiftData, id: currentShift.id });
      
      // Limpiar estados
      setCashCount({
        20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0,
        20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      });
      
      // Mostrar resumen del arqueo
      const summaryMessage = `
        ✅ Turno cerrado exitosamente
        
        📊 Resumen del Arqueo:
        • Total Esperado: $${differences.totalExpected?.toLocaleString() || 0}
        • Total Contado: $${differences.totalCounted?.toLocaleString() || 0}
        • Ingresos Adicionales: $${differences.totalAdditionalIncomes?.toLocaleString() || 0}
        • Egresos Adicionales: $${differences.totalAdditionalExpenses?.toLocaleString() || 0}
        • Total Final: $${differences.finalTotal?.toLocaleString() || 0}
        ${differences.hasDifference ? `• Diferencia: $${Math.abs(differences.finalDifference || 0).toLocaleString()}` : '• Arqueo balanceado ✅'}
      `;
      
      toast.success(summaryMessage, {
        duration: 8000,
        style: {
          whiteSpace: 'pre-line',
          fontSize: '14px'
        }
      });
      
      // Recargar datos
      const updatedShifts = await shiftService.getAllShifts();
      const activeShift = updatedShifts.find(shift => shift.status === 'active' || !shift.endTime);
      if (activeShift) {
        setCurrentShift(activeShift);
        loadShiftData(activeShift);
      } else {
        setCurrentShift(null);
        setShiftStats({
          totalSales: 0,
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
  }, [currentShift, currentUser, loadShiftData]);

  // Registrar ingreso adicional
  const registerIncome = useCallback(async () => {
    if (!currentShift) {
      toast.error('Debe haber un turno activo para registrar ingresos');
      return;
    }

    if (!incomeAmount || incomeAmount <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    if (!incomeDescription.trim()) {
      toast.error('Ingrese una descripción');
      return;
    }

    try {
      const incomeData = {
        amount: parseFloat(incomeAmount),
        description: incomeDescription.trim(),
        category: incomeCategory,
        shiftId: currentShift.id,
        employeeId: currentUser?.id,
        employeeName: currentUser?.name,
        timestamp: new Date()
      };

      // TODO: Implementar incomeService.addIncome(incomeData);
      console.log('💰 Ingreso registrado:', incomeData);

      setShowIncomeModal(false);
      setIncomeAmount(0);
      setIncomeDescription('');
      setIncomeCategory('venta_adicional');

      toast.success('Ingreso registrado exitosamente');
      
      // Recargar datos del turno
      await loadShiftData(currentShift);
    } catch (error) {
      console.error('Error registrando ingreso:', error);
      toast.error('Error al registrar el ingreso');
    }
  }, [currentShift, incomeAmount, incomeDescription, incomeCategory, currentUser, loadShiftData]);

  // Actualizar conteo de efectivo
  const updateCashCount = (denomination, count) => {
    setCashCount(prev => ({
      ...prev,
      [denomination]: parseInt(count) || 0
    }));
  };

  // Abrir turno
  const openShift = async (shiftData) => {
    try {
      // Verificar permisos
      if (!canOpenShift) {
        toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
        return;
      }

      const shiftToCreate = {
        type: shiftData.shiftType,
        date: new Date().toISOString().split('T')[0],
        openingAmount: parseFloat(shiftData.openingAmount),
        employeeName: currentUser?.name || 'Usuario',
        employeeEmail: currentUser?.email,
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeRole: currentUser?.role,
        employeePosition: currentUser?.position,
        notes: shiftData.notes.trim(),
        status: 'active',
        startTime: new Date(),
        total: 0,
        salesCount: 0,
        createdAt: new Date(),
        openedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role,
          position: currentUser?.position,
          timestamp: new Date()
        }
      };

      const shiftId = await shiftService.addShift(shiftToCreate);
      
      // Actualizar estado local
      const newShift = { id: shiftId, ...shiftToCreate };
      setCurrentShift(newShift);
      
      // Cargar datos del turno
      await loadShiftData(newShift);
      
      toast.success(`Turno ${shiftData.shiftType === 'morning' ? 'mañana' : 'tarde'} abierto exitosamente`);
      
    } catch (error) {
      console.error('Error abriendo turno:', error);
      toast.error('Error abriendo turno');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caja registradora...</p>
        </div>
      </div>
    );
  }

  return (
    <CashRegisterAccessGuard>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="h-8 w-8 mr-3 text-primary-600" />
                Caja Registradora
              </h1>
              <p className="text-gray-600 mt-2">Gestión de turnos e ingresos</p>
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
                    desde {currentShift.openTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}
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
          /* Con turno activo - Mostrar estadísticas y controles */
          <div className="space-y-6">
            {/* Estadísticas del turno */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ventas</p>
                    <p className="text-2xl font-bold text-gray-900">{shiftStats.salesCount}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {showAmounts ? `$${shiftStats.totalRevenue.toLocaleString()}` : '***'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Adicionales</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {showAmounts ? `$${shiftStats.totalAdditionalIncomes.toLocaleString()}` : '***'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Plus className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Neto</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {showAmounts ? `$${shiftStats.netAmount.toLocaleString()}` : '***'}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controles del turno */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Controles del Turno</h3>
                  <p className="text-sm text-gray-600">
                    Turno {currentShift.type === 'morning' ? 'Mañana' : 'Tarde'} - {currentShift.employeeName}
                  </p>
                </div>

                                 <div className="flex flex-wrap gap-3">
                   <button
                     onClick={() => setShowIncomeModal(true)}
                     className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     Registrar Ingreso
                   </button>

                   <button
                     onClick={() => setShowCashCountModalForClose(true)}
                     className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                   >
                     <DollarSign className="h-4 w-4 mr-2" />
                     Arqueo
                   </button>

                                       <button
                      onClick={() => setShowFinalizarDiaModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Finalizar Día
                    </button>
                 </div>
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Venta #{sale.id?.slice(-6) || index + 1}</p>
                        <p className="text-sm text-gray-600">
                          {sale.timestamp?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${sale.total?.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-500 capitalize">{sale.paymentMethod || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modales */}
        {showOpenShiftModal && <OpenShiftModal 
          onOpenShift={openShift}
          setShowOpenShiftModal={setShowOpenShiftModal}
        />}
        {showCloseShiftModal && <CloseShiftModal 
          closeShift={closeShift}
          setShowCloseShiftModal={setShowCloseShiftModal}
        />}
        {showIncomeModal && <IncomeModal 
          registerIncome={registerIncome}
          setShowIncomeModal={setShowIncomeModal}
        />}
        {showCashCountModal && <CashCountModal 
          updateCashCount={updateCashCount}
        />}
        {showCashCountModalForClose && (
          <CashCountModal
            currentShift={currentShift}
            currentUser={currentUser}
            onCashCountComplete={completeShiftClose}
            onClose={() => setShowCashCountModalForClose(false)}
          />
        )}
        {showFinalizarDiaModal && (
          <FinalizarDiaModal
            onFinalizarDia={async (daySummary) => {
              try {
                setIsLoading(true);
                await shiftService.finalizarDia(daySummary);
                toast.success('Día finalizado exitosamente');
                setShowFinalizarDiaModal(false);
                // Recargar datos de la caja
                const shifts = await shiftService.getAllShifts();
                const activeShift = shifts.find(shift => shift.status === 'active' || !shift.endTime);
                if (activeShift) {
                  setCurrentShift(activeShift);
                  loadShiftData(activeShift);
                } else {
                  setCurrentShift(null);
                  setShiftStats({
                    totalSales: 0,
                    totalRevenue: 0,
                    totalAdditionalIncomes: 0,
                    netAmount: 0
                  });
                  setRecentActivity([]);
                }
              } catch (error) {
                console.error('Error finalizando día:', error);
                toast.error('Error al finalizar el día');
              } finally {
                setIsLoading(false);
              }
            }}
            setShowFinalizarDiaModal={setShowFinalizarDiaModal}
          />
        )}
      </div>
    </CashRegisterAccessGuard>
  );
};

// Modal para abrir turno
const OpenShiftModal = memo(({ onOpenShift, setShowOpenShiftModal }) => {
  const [shiftType, setShiftType] = useState('morning');
  const [openingAmount, setOpeningAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenShift = async () => {
    if (!onOpenShift) {
      console.error('Función onOpenShift no proporcionada');
      return;
    }

    setIsLoading(true);
    try {
      await onOpenShift({ shiftType, openingAmount, notes });
      setShowOpenShiftModal(false);
    } catch (error) {
      console.error('Error abriendo turno:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <LogIn className="h-6 w-6 mr-2 text-green-600" />
          Abrir Turno
        </h3>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowOpenShiftModal(false)}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleOpenShift}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              'Abrir Turno'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// Modal para cerrar turno
const CloseShiftModal = memo(({ closeShift, setShowCloseShiftModal }) => {
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <LogOut className="h-6 w-6 mr-2 text-red-600" />
          Cerrar Turno
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto de Cierre:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas de Cierre:</label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Notas adicionales..."
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
});

// Modal para ingresos
const IncomeModal = memo(({ registerIncome, setShowIncomeModal }) => {
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('venta_adicional');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Plus className="h-6 w-6 mr-2 text-green-600" />
          Registrar Ingreso
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
              placeholder="Descripción del ingreso"
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
              <option value="servicio">Servicio</option>
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
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
});

// Modal para finalizar día
const FinalizarDiaModal = memo(({ onFinalizarDia, setShowFinalizarDiaModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [daySummary, setDaySummary] = useState(null);

  useEffect(() => {
    const loadDaySummary = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const shifts = await shiftService.getShiftsByDate(today);
        
        const summary = {
          date: today,
          totalShifts: shifts.length,
          totalSales: 0,
          totalRevenue: 0,
          shifts: shifts.map(shift => ({
            id: shift.id,
            type: shift.type,
            employeeName: shift.employeeName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            totalSales: shift.totalSales || 0,
            totalRevenue: shift.totalRevenue || 0,
            status: shift.status
          }))
        };

        // Calcular totales
        summary.totalSales = summary.shifts.reduce((sum, shift) => sum + shift.totalSales, 0);
        summary.totalRevenue = summary.shifts.reduce((sum, shift) => sum + shift.totalRevenue, 0);

        setDaySummary(summary);
      } catch (error) {
        console.error('Error cargando resumen del día:', error);
        toast.error('Error cargando datos del día');
      }
    };

    loadDaySummary();
  }, []);

  const handleFinalizarDia = async () => {
    if (!daySummary) return;
    
    setIsLoading(true);
    try {
      await onFinalizarDia(daySummary);
      setShowFinalizarDiaModal(false);
    } catch (error) {
      console.error('Error finalizando día:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!daySummary) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resumen del día...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Finalizar Día</h2>
              <p className="text-sm text-gray-600">
                {new Date(daySummary.date).toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFinalizarDiaModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Resumen del día */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Turnos</p>
                  <p className="text-2xl font-bold text-blue-900">{daySummary.totalShifts}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-green-900">{daySummary.totalSales}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-purple-900">${daySummary.totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Detalle de turnos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Turnos</h3>
            <div className="space-y-3">
              {daySummary.shifts.map((shift) => (
                <div key={shift.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Turno {shift.type === 'morning' ? 'Mañana' : 'Tarde'} - {shift.employeeName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {shift.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'} - {shift.endTime?.toDate?.()?.toLocaleTimeString() || 'En curso'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${shift.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{shift.totalSales} ventas</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        shift.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {shift.status === 'active' ? 'Activo' : 'Cerrado'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">Advertencia</p>
            </div>
            <p className="text-yellow-700 mt-2">
              Al finalizar el día, todos los turnos se cerrarán permanentemente y no se podrán modificar.
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setShowFinalizarDiaModal(false)}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalizarDia}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Finalizando...
              </>
            ) : (
              'Finalizar Día'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CashRegister;

