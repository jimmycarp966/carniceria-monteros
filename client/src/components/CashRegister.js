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
  TrendingUp,
  Clock,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { shiftService, saleService, expensesService } from '../services/firebaseService';
import CashCountModal from './CashCountModal';
import realtimeService, { dataSyncService } from '../services/realtimeService';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import CashRegisterAccessGuard from './CashRegisterAccessGuard';
import { verifyDaySummary } from '../utils/verifyDaySummary';
import { testExpenses, addTestExpense } from '../utils/testExpenses';

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
  const [canFinalizarDia, setCanFinalizarDia] = useState(false);
  const [daySummary, setDaySummary] = useState(null);
  const [dayFinalizado, setDayFinalizado] = useState(false);

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
      
      // Calcular ventas por método de pago usando normalización
      const salesByMethod = {
        efectivo: { count: 0, total: 0 },
        tarjetaDebito: { count: 0, total: 0 },
        tarjetaCredito: { count: 0, total: 0 },
        transferencia: { count: 0, total: 0 },
        mercadopago: { count: 0, total: 0 }
      };

      shiftSales.forEach(sale => {
        const normalizedMethod = normalizePaymentMethod(sale.paymentMethod);
        if (salesByMethod[normalizedMethod]) {
          salesByMethod[normalizedMethod].count++;
          salesByMethod[normalizedMethod].total += sale.total || 0;
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

  // Estados para el estado de turnos
  const [todayShifts, setTodayShifts] = useState({
    morning: null,
    afternoon: null
  });

  // Función para normalizar métodos de pago (igual que en verifyDaySummary)
  const normalizePaymentMethod = (method) => {
    if (!method) return 'efectivo';
    
    const methodLower = method.toLowerCase();
    
    // Mapeo de diferentes nombres usados en los componentes
    const methodMap = {
      // Efectivo
      'cash': 'efectivo',
      'efectivo': 'efectivo',
      
      // Tarjetas
      'card': 'tarjetaDebito', // Por defecto débito
      'tarjeta': 'tarjetaDebito', // Por defecto débito
      'tarjetadebito': 'tarjetaDebito',
      'tarjetacredito': 'tarjetaCredito',
      'debit': 'tarjetaDebito',
      'credito': 'tarjetaCredito',
      
      // Transferencia
      'transfer': 'transferencia',
      'transferencia': 'transferencia',
      
      // MercadoPago
      'mercadopago': 'mercadopago',
      'mp': 'mercadopago'
    };
    
    return methodMap[methodLower] || 'efectivo';
  };

  // Función para cargar el resumen del día
  const loadDaySummary = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const shifts = await shiftService.getShiftsByDate(today);
      
      // Obtener todas las ventas del día para calcular totales reales
      const allSales = await saleService.getAllSales();
      const todaySales = allSales.filter(sale => {
        const saleDate = sale.timestamp?.toDate?.()?.toISOString()?.split('T')[0] || 
                        sale.createdAt?.toDate?.()?.toISOString()?.split('T')[0];
        return saleDate === today;
      });

      // Obtener gastos del día - BUSCAR POR FECHA, NO POR SHIFTID
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      
      console.log('🔍 Buscando gastos del día:', today);
      console.log('📅 Rango de fechas:', startDate.toISOString(), 'a', endDate.toISOString());
      
      // PRIMERO: Intentar obtener todos los gastos y filtrar por fecha
      console.log('🔍 Estrategia 1: Obtener todos los gastos y filtrar por fecha...');
      const allExpenses = await expensesService.getAllExpenses();
      console.log(`📊 Total gastos en el sistema: ${allExpenses.length}`);
      
      const todayExpenses = allExpenses.filter(expense => {
        const expenseDate = expense.createdAt?.toDate?.();
        if (!expenseDate) {
          console.log(`⚠️ Gasto ${expense.id} sin fecha válida:`, expense.createdAt);
          return false;
        }
        
        const expenseDateStr = expenseDate.toISOString().split('T')[0];
        const isToday = expenseDateStr === today;
        console.log(`  - ${expense.id}: ${expenseDateStr} | Es hoy: ${isToday}`);
        return isToday;
      });
      
      console.log('💰 Gastos encontrados para hoy:', todayExpenses.length);
      todayExpenses.forEach(expense => {
        console.log(`  ✅ ${expense.id}: $${expense.amount} | ${expense.reason} | ${expense.createdAt?.toDate?.()?.toISOString()}`);
      });
      
      const totalExpenses = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      console.log('💰 Total gastos del día: $', totalExpenses.toLocaleString());

      // Calcular totales por turno
      const shiftsWithTotals = shifts.map(shift => {
        const shiftSales = todaySales.filter(sale => sale.shiftId === shift.id);
        const totalSales = shiftSales.length;
        const totalRevenue = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        return {
          id: shift.id,
          type: shift.type,
          employeeName: shift.employeeName,
          startTime: shift.startTime,
          endTime: shift.endTime,
          totalSales,
          totalRevenue,
          status: shift.status
        };
      });

      // Calcular ventas por método de pago usando normalización
      const salesByPaymentMethod = {
        efectivo: 0,
        tarjetaDebito: 0,
        tarjetaCredito: 0,
        transferencia: 0,
        mercadopago: 0
      };

      todaySales.forEach(sale => {
        const normalizedMethod = normalizePaymentMethod(sale.paymentMethod);
        if (salesByPaymentMethod[normalizedMethod] !== undefined) {
          salesByPaymentMethod[normalizedMethod] += sale.total || 0;
        }
      });

      const summary = {
        date: today,
        totalShifts: shifts.length,
        totalSales: todaySales.length,
        totalRevenue: todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        totalExpenses: totalExpenses,
        expenses: todayExpenses,
        shifts: shiftsWithTotals,
        salesByPaymentMethod
      };

      setDaySummary(summary);
      console.log('📊 Resumen del día cargado:', summary);
    } catch (error) {
      console.error('Error cargando resumen del día:', error);
      toast.error('Error cargando datos del día');
    }
  }, []);

  // Función para verificar si se puede finalizar el día
  const checkCanFinalizarDia = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const shifts = await shiftService.getAllShifts();
      const todayShiftsData = shifts.filter(shift => {
        const shiftDate = shift.date || (shift.startTime?.toDate?.()?.toISOString()?.split('T')[0]);
        return shiftDate === today;
      });
      
      const morningShift = todayShiftsData.find(shift => shift.type === 'morning');
      const afternoonShift = todayShiftsData.find(shift => shift.type === 'afternoon');
      
      // Actualizar estado de turnos del día
      setTodayShifts({
        morning: morningShift,
        afternoon: afternoonShift
      });
      
      // Verificar si el día ya fue finalizado
      const dayClosed = morningShift?.dayClosed || afternoonShift?.dayClosed;
      setDayFinalizado(dayClosed);
      
      // Solo se puede finalizar el día si ambos turnos existen, están cerrados y el día no fue finalizado
      const canFinalizar = morningShift && 
                          afternoonShift && 
                          morningShift.status === 'closed' && 
                          afternoonShift.status === 'closed' &&
                          !dayClosed;
      
      setCanFinalizarDia(canFinalizar);
      
      if (canFinalizar) {
        console.log('✅ Ambos turnos cerrados - Finalizar Día habilitado');
        // Recargar el resumen del día cuando ambos turnos estén cerrados
        loadDaySummary();
      } else if (dayClosed) {
        console.log('✅ Día ya finalizado - Mostrando como cerrado');
        // Si el día ya fue finalizado, cargar el resumen para mostrar
        loadDaySummary();
      } else {
        console.log('❌ Finalizar Día deshabilitado - Turnos pendientes:', {
          morning: morningShift?.status || 'no existe',
          afternoon: afternoonShift?.status || 'no existe'
        });
      }
    } catch (error) {
      console.error('Error verificando estado de turnos:', error);
      setCanFinalizarDia(false);
    }
  }, [loadDaySummary]);

  // Cargar datos iniciales
  useEffect(() => {
    const initCashRegister = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Inicializando caja registradora...');

        // Inicializar listeners de tiempo real
        realtimeService.initializeRealtimeListeners();

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

        // Verificar si se puede finalizar el día
        await checkCanFinalizarDia();

      } catch (error) {
        console.error('Error cargando datos de caja:', error);
        toast.error('Error cargando datos de la caja');
      } finally {
        setIsLoading(false);
      }
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
    
    // Agregar listener para reset forzado
    window.addEventListener('forceResetShifts', handleForceResetShifts);

    return () => {
      window.removeEventListener('forceResetShifts', handleForceResetShifts);
    };
  }, [checkCanFinalizarDia, loadShiftData]); // Incluir dependencias necesarias

  // Configurar listeners de tiempo real (separado del useEffect principal)
  useEffect(() => {
    const setupListeners = () => {
      console.log('🔧 Configurando listeners de tiempo real...');
      
      // Escuchar cambios en ventas
      realtimeService.on('sales_updated', (data) => {
        console.log('💰 Ventas actualizadas:', data);
        // Usar setCurrentShift con callback para acceder al estado actual
        setCurrentShift(currentShiftState => {
          if (currentShiftState && data.sales) {
            console.log('🔄 Recargando datos del turno por ventas actualizadas');
            loadShiftData(currentShiftState);
          }
          return currentShiftState;
        });
      });

      // Escuchar nuevas ventas
      realtimeService.on('sale_synced', (data) => {
        console.log('💰 Nueva venta sincronizada:', data);
        setCurrentShift(currentShiftState => {
          if (currentShiftState) {
            console.log('🔄 Recargando datos del turno por nueva venta');
            loadShiftData(currentShiftState);
            toast.success('Nueva venta registrada en la caja');
          }
          return currentShiftState;
        });
      });

      // Escuchar nuevos turnos sincronizados
      realtimeService.on('shift_synced', (data) => {
        console.log('🔄 Turno sincronizado:', data);
        if (data.shiftData && data.shiftData.status === 'active') {
          console.log('✅ Configurando turno activo desde shift_synced');
          const newShift = { id: data.shiftId, ...data.shiftData };
          setCurrentShift(newShift);
          loadShiftData(newShift);
          toast.success(`Turno ${data.shiftData.type === 'morning' ? 'mañana' : 'tarde'} abierto exitosamente`);
        }
      });

      // Escuchar cambios en turnos
      realtimeService.on('shifts_updated', (data) => {
        console.log('🔄 Turnos actualizados:', data);
        if (data.shifts) {
          const activeShift = data.shifts.find(shift => shift.status === 'active' || !shift.endTime);
          if (activeShift) {
            console.log('✅ Configurando turno activo desde shifts_updated:', activeShift);
            setCurrentShift(activeShift);
            loadShiftData(activeShift);
          } else {
            console.log('❌ No hay turno activo, limpiando estado');
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
          
          // Verificar estado de finalizar día cuando cambian los turnos
          checkCanFinalizarDia();
        }
      });
      
      console.log('✅ Listeners de tiempo real configurados');
    };

    setupListeners();

    return () => {
      realtimeService.off('sales_updated');
      realtimeService.off('sale_synced');
      realtimeService.off('shift_synced');
      realtimeService.off('shifts_updated');
    };
  }, [checkCanFinalizarDia, loadShiftData]); // Incluir dependencias necesarias







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
  const completeShiftClose = useCallback(async (cashCountId, differences) => {
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
          role: currentUser?.role || 'ayudante',
          position: currentUser?.position,
          timestamp: new Date()
        },
        cashCountId: cashCountId,
        arqueo: {
          ...differences,
          cashCountId: cashCountId
        }
      };

      // Actualizar turno en Firestore
      await shiftService.updateShift(currentShift.id, shiftData);
      
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
      
      // Verificar estado de finalizar día después de cerrar turno
      await checkCanFinalizarDia();
    } catch (error) {
      console.error('Error cerrando turno:', error);
      toast.error('Error al cerrar el turno');
    }
  }, [currentShift, currentUser, loadShiftData, checkCanFinalizarDia]);

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
      console.log('🔄 Iniciando apertura de turno:', shiftData);
      
      // Verificar permisos
      if (!canOpenShift) {
        toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
        return;
      }

      // Verificar que no haya un turno activo del mismo tipo hoy
      const today = new Date().toISOString().split('T')[0];
      const shifts = await shiftService.getAllShifts();
      console.log(`📊 Turnos existentes hoy: ${shifts.length}`);
      
      const todayShifts = shifts.filter(shift => {
        const shiftDate = shift.date || (shift.startTime?.toDate?.()?.toISOString()?.split('T')[0]);
        return shiftDate === today;
      });
      
      const existingShift = todayShifts.find(shift => shift.type === shiftData.shiftType);
      if (existingShift) {
        toast.error(`Ya existe un turno ${shiftData.shiftType === 'morning' ? 'mañana' : 'tarde'} para hoy`);
        return;
      }

      // Validar secuencia de turnos
      if (shiftData.shiftType === 'afternoon') {
        const morningShift = todayShifts.find(shift => shift.type === 'morning');
        if (!morningShift) {
          toast.error('Debe abrirse el turno mañana antes que el turno tarde');
          return;
        }
        if (morningShift.status !== 'closed') {
          toast.error('El turno mañana debe estar cerrado antes de abrir el turno tarde');
          return;
        }
      }

      const shiftToCreate = {
        type: shiftData.shiftType,
        date: today,
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

      console.log('📝 Datos del turno a crear:', shiftToCreate);

      // Sincronizar turno (esto ya crea el turno en Firestore)
      console.log('🔄 Sincronizando turno con dataSyncService...');
      const shiftId = await dataSyncService.syncShift(shiftToCreate);
      console.log('✅ Turno sincronizado, ID:', shiftId);
      
      // Actualizar estado local
      const newShift = { id: shiftId, ...shiftToCreate };
      console.log('🔄 Actualizando estado local con turno:', newShift);
      setCurrentShift(newShift);
      
      // Cargar datos del turno
      await loadShiftData(newShift);
      
      toast.success(`Turno ${shiftData.shiftType === 'morning' ? 'mañana' : 'tarde'} abierto exitosamente`);
      
    } catch (error) {
      console.error('❌ Error abriendo turno:', error);
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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  if (!canOpenShift) {
                    toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
                    return;
                  }
                  setShowOpenShiftModal(true);
                }}
                disabled={!canOpenShift}
                className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                  canOpenShift 
                    ? 'bg-primary-600 text-white hover:bg-primary-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <LogIn className="h-5 w-5 mr-2" />
                {canOpenShift ? 'Abrir Turno' : 'Sin Permisos para Abrir Turno'}
              </button>
              
              {canFinalizarDia && (
                <button
                  onClick={async () => {
                    await loadDaySummary();
                    setShowFinalizarDiaModal(true);
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Finalizar Día
                </button>
              )}
              
              {dayFinalizado && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center px-4 py-3 bg-gray-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-700 font-medium">Día Finalizado</span>
                  </div>
                  <button
                    onClick={async () => {
                      await loadDaySummary();
                      setShowFinalizarDiaModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Resumen
                  </button>
                </div>
              )}
              
              {/* Botón de verificación para debug */}
              <button
                onClick={async () => {
                  console.log('🔍 Iniciando verificación del resumen del día...');
                  const result = await verifyDaySummary();
                  if (result.success) {
                    toast.success('Verificación completada. Revisa la consola para detalles.');
                  } else {
                    toast.error('Error en verificación: ' + result.error);
                  }
                }}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-medium flex items-center text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Verificar
              </button>

              {/* Botones de prueba para gastos */}
              <button
                onClick={async () => {
                  console.log('🔍 Iniciando prueba de gastos...');
                  await testExpenses();
                  toast.success('Prueba de gastos completada. Revisa la consola.');
                }}
                className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 font-medium flex items-center text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Probar Gastos
              </button>

              <button
                onClick={async () => {
                  console.log('➕ Agregando gasto de prueba...');
                  await addTestExpense();
                  toast.success('Gasto de prueba agregado. Revisa la consola.');
                }}
                className="bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 font-medium flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Gasto Test
              </button>
            </div>
            
            {/* Mostrar estado de turnos cuando no hay turno activo */}
            {(todayShifts.morning || todayShifts.afternoon) && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Estado de Turnos del Día</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">Mañana:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      todayShifts.morning ? 
                        (todayShifts.morning.status === 'closed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {todayShifts.morning ? 
                        (todayShifts.morning.status === 'closed' ? 'Cerrado' : 'Activo')
                        : 'No abierto'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">Tarde:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      todayShifts.afternoon ? 
                        (todayShifts.afternoon.status === 'closed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {todayShifts.afternoon ? 
                        (todayShifts.afternoon.status === 'closed' ? 'Cerrado' : 'Activo')
                        : 'No abierto'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
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

            {/* Estado de turnos del día */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Turnos del Día</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      todayShifts.morning ? 
                        (todayShifts.morning.status === 'active' ? 'bg-green-500' : 
                         todayShifts.morning.status === 'closed' ? 'bg-blue-500' : 'bg-gray-300') 
                        : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Turno Mañana</p>
                      <p className="text-sm text-gray-600">
                        {todayShifts.morning ? todayShifts.morning.employeeName : 'No abierto'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    todayShifts.morning ? 
                      (todayShifts.morning.status === 'active' ? 'bg-green-100 text-green-800' : 
                       todayShifts.morning.status === 'closed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600')
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {todayShifts.morning ? 
                      (todayShifts.morning.status === 'active' ? 'Activo' : 
                       todayShifts.morning.status === 'closed' ? 'Cerrado' : 'Pendiente')
                      : 'Pendiente'
                    }
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      todayShifts.afternoon ? 
                        (todayShifts.afternoon.status === 'active' ? 'bg-green-500' : 
                         todayShifts.afternoon.status === 'closed' ? 'bg-blue-500' : 'bg-gray-300') 
                        : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Turno Tarde</p>
                      <p className="text-sm text-gray-600">
                        {todayShifts.afternoon ? todayShifts.afternoon.employeeName : 'No abierto'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    todayShifts.afternoon ? 
                      (todayShifts.afternoon.status === 'active' ? 'bg-green-100 text-green-800' : 
                       todayShifts.afternoon.status === 'closed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600')
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {todayShifts.afternoon ? 
                      (todayShifts.afternoon.status === 'active' ? 'Activo' : 
                       todayShifts.afternoon.status === 'closed' ? 'Cerrado' : 'Pendiente')
                      : 'Pendiente'
                    }
                  </div>
                </div>
              </div>
              
              {dayFinalizado && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-blue-800 font-semibold">✅ Día Finalizado</p>
                        <p className="text-blue-700 text-sm">El día ha sido cerrado exitosamente</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await loadDaySummary();
                        setShowFinalizarDiaModal(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Resumen</span>
                    </button>
                  </div>
                </div>
              )}
              
              {canFinalizarDia && !dayFinalizado && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-green-800 font-semibold">✅ Día Completado</p>
                        <p className="text-green-700 text-sm">Ambos turnos cerrados - Puede finalizar el día</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await loadDaySummary();
                        setShowFinalizarDiaModal(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Finalizar Día</span>
                    </button>
                  </div>
                </div>
              )}
              
              {!canFinalizarDia && (todayShifts.morning || todayShifts.afternoon) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-yellow-800 font-medium">⏳ Turnos Pendientes</p>
                      <p className="text-yellow-700 text-sm">
                        {!todayShifts.morning ? 'Falta abrir turno mañana' :
                         !todayShifts.afternoon ? 'Falta abrir turno tarde' :
                         todayShifts.morning.status !== 'closed' ? 'Cierre turno mañana' :
                         todayShifts.afternoon.status !== 'closed' ? 'Cierre turno tarde' :
                         'Espere cierre de turnos'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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

                                                          {dayFinalizado ? (
                     <div className="flex items-center space-x-2">
                       <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg">
                         <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                         <span className="text-gray-700 font-medium text-sm">Día Finalizado</span>
                       </div>
                       <button
                         onClick={async () => {
                           await loadDaySummary();
                           setShowFinalizarDiaModal(true);
                         }}
                         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                       >
                         <Eye className="h-4 w-4 mr-2" />
                         Ver Resumen
                       </button>
                     </div>
                   ) : (
                     <button
                       onClick={async () => {
                         if (canFinalizarDia) {
                           await loadDaySummary();
                           setShowFinalizarDiaModal(true);
                         }
                       }}
                       disabled={!canFinalizarDia}
                       className={`px-4 py-2 rounded-lg flex items-center ${
                         canFinalizarDia 
                           ? 'bg-red-600 text-white hover:bg-red-700' 
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                       }`}
                       title={canFinalizarDia 
                         ? 'Finalizar el día (ambos turnos cerrados)' 
                         : 'Debe cerrar ambos turnos (mañana y tarde) para finalizar el día'
                       }
                     >
                       <LogOut className="h-4 w-4 mr-2" />
                       Finalizar Día
                       {!canFinalizarDia && (
                         <span className="ml-2 text-xs bg-gray-400 text-white px-1 py-0.5 rounded">
                           {!todayShifts.morning ? 'Falta turno mañana' :
                            !todayShifts.afternoon ? 'Falta turno tarde' :
                            todayShifts.morning.status !== 'closed' ? 'Cierre turno mañana' :
                            todayShifts.afternoon.status !== 'closed' ? 'Cierre turno tarde' :
                            'Espere cierre turnos'}
                         </span>
                       )}
                     </button>
                   )}
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
                setDayFinalizado(true);
                setCanFinalizarDia(false);
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
            daySummary={daySummary}
            onCheckCanFinalizarDia={checkCanFinalizarDia}
            dayFinalizado={dayFinalizado}
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
const FinalizarDiaModal = memo(({ onFinalizarDia, setShowFinalizarDiaModal, daySummary, onCheckCanFinalizarDia, dayFinalizado }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalizarDia = async () => {
    if (!daySummary) return;
    
    // Confirmar antes de finalizar
    const confirmed = window.confirm(
      `¿Está seguro que desea finalizar el día?\n\n` +
      `📅 Fecha: ${new Date(daySummary.date).toLocaleDateString('es-AR')}\n` +
      `💰 Total de ventas: ${daySummary.totalSales}\n` +
      `💵 Ingresos totales: $${daySummary.totalRevenue.toLocaleString()}\n\n` +
      `Esta acción cerrará definitivamente el día y no se podrá deshacer.`
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      console.log('🚀 Finalizando día:', daySummary);
      
      await onFinalizarDia(daySummary);
      
      toast.success('✅ Día finalizado exitosamente');
      setShowFinalizarDiaModal(false);
      
      // Recargar datos después de finalizar
      if (onCheckCanFinalizarDia) {
        await onCheckCanFinalizarDia();
      }
      
    } catch (error) {
      console.error('Error finalizando día:', error);
      toast.error('❌ Error al finalizar el día');
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
            <div className={`p-3 rounded-full ${dayFinalizado ? 'bg-blue-100' : 'bg-red-100'}`}>
              {dayFinalizado ? (
                <CheckCircle className="h-8 w-8 text-blue-600" />
              ) : (
                <LogOut className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {dayFinalizado ? 'Resumen del Día' : 'Finalizar Día'}
              </h2>
              <p className="text-sm text-gray-600">
                {new Date(daySummary.date).toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {dayFinalizado && ' - Día Finalizado'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="bg-red-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Gastos Totales</p>
                  <p className="text-2xl font-bold text-red-900">${daySummary.totalExpenses.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Balance Neto</p>
                  <p className={`text-2xl font-bold ${(daySummary.totalRevenue - daySummary.totalExpenses) >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                    ${(daySummary.totalRevenue - daySummary.totalExpenses).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          {daySummary.salesByPaymentMethod && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-600">Efectivo</p>
                  <p className="text-lg font-bold text-green-900">${daySummary.salesByPaymentMethod.efectivo.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-600">Débito</p>
                  <p className="text-lg font-bold text-blue-900">${daySummary.salesByPaymentMethod.tarjetaDebito.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-600">Crédito</p>
                  <p className="text-lg font-bold text-purple-900">${daySummary.salesByPaymentMethod.tarjetaCredito.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-600">Transferencia</p>
                  <p className="text-lg font-bold text-orange-900">${daySummary.salesByPaymentMethod.transferencia.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-600">MercadoPago</p>
                  <p className="text-lg font-bold text-yellow-900">${daySummary.salesByPaymentMethod.mercadopago.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Gastos del día */}
          {daySummary.expenses && daySummary.expenses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos del Día</h3>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Total Gastos</p>
                    <p className="text-2xl font-bold text-red-900">${daySummary.totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">{daySummary.expenses.length} gastos registrados</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {daySummary.expenses.map((expense) => (
                  <div key={expense.id} className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{expense.reason || 'Gasto operativo'}</p>
                        <p className="text-sm text-gray-600">
                          {expense.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">-${expense.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{expense.type || 'operational'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Advertencia - Solo mostrar si el día no está finalizado */}
          {!dayFinalizado && (
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
          )}
        </div>

        {/* Botones */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setShowFinalizarDiaModal(false)}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            {dayFinalizado ? 'Cerrar' : 'Cancelar'}
          </button>
          {!dayFinalizado && (
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
          )}
        </div>
      </div>
    </div>
  );
});

export default CashRegister;

