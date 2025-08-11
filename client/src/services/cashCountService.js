import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { saleService, expensesService, shiftService } from './firebaseService';

// Servicio de arqueo de caja
export const cashCountService = {
  // Obtener ventas del turno por método de pago
  async getSalesByPaymentMethod(shiftId, forceRefresh = false) {
    try {
      console.log(`🔄 Obteniendo ventas para turno: ${shiftId}${forceRefresh ? ' (forzando refresh)' : ''}`);
      
      // Obtener información del turno para el monto inicial
      const shifts = await shiftService.getAllShifts();
      const currentShift = shifts.find(shift => shift.id === shiftId);
      const openingAmount = currentShift?.openingAmount || 0;
      
      console.log(`💰 Monto inicial del turno: $${openingAmount.toLocaleString()}`);
      
      // Usar getSalesByShift para obtener solo las ventas del turno específico
      const shiftSales = await saleService.getSalesByShift(shiftId, forceRefresh);
      
      console.log(`📊 Ventas encontradas: ${shiftSales.length}`);
      
      // Obtener gastos del turno
      const shiftExpenses = await expensesService.getExpensesByShift(shiftId);
      console.log(`💰 Gastos encontrados: ${shiftExpenses.length}`);
      
      const salesByMethod = {
        efectivo: { count: 0, total: 0, expected: 0 },
        tarjetaDebito: { count: 0, total: 0, expected: 0 },
        tarjetaCredito: { count: 0, total: 0, expected: 0 },
        transferencia: { count: 0, total: 0, expected: 0 },
        mercadopago: { count: 0, total: 0, expected: 0 }
      };

      let totalProcessed = 0;
      let totalAmount = 0;

      shiftSales.forEach(sale => {
        const paymentMethod = sale.paymentMethod;
        const saleAmount = sale.total || 0;
        
        console.log(`🔍 Procesando venta: ${paymentMethod} - $${saleAmount} - cardType: ${sale.cardType}`);
        
        if (paymentMethod === 'efectivo') {
          salesByMethod.efectivo.count++;
          salesByMethod.efectivo.total += saleAmount;
          salesByMethod.efectivo.expected += saleAmount;
        } else if (paymentMethod === 'tarjeta') {
          if (sale.cardType === 'credito') {
            salesByMethod.tarjetaCredito.count++;
            salesByMethod.tarjetaCredito.total += saleAmount;
            salesByMethod.tarjetaCredito.expected += saleAmount;
          } else {
            // Por defecto, si no hay cardType o es 'debito', va a tarjeta débito
            salesByMethod.tarjetaDebito.count++;
            salesByMethod.tarjetaDebito.total += saleAmount;
            salesByMethod.tarjetaDebito.expected += saleAmount;
          }
        } else if (paymentMethod === 'transferencia') {
          salesByMethod.transferencia.count++;
          salesByMethod.transferencia.total += saleAmount;
          salesByMethod.transferencia.expected += saleAmount;
        } else if (paymentMethod === 'mercadopago') {
          salesByMethod.mercadopago.count++;
          salesByMethod.mercadopago.total += saleAmount;
          salesByMethod.mercadopago.expected += saleAmount;
        } else {
          // Si no coincide con ningún método conocido, agregar a efectivo por defecto
          console.log(`⚠️ Método de pago desconocido: ${paymentMethod}, agregando a efectivo`);
          salesByMethod.efectivo.count++;
          salesByMethod.efectivo.total += saleAmount;
          salesByMethod.efectivo.expected += saleAmount;
        }
        
        totalProcessed++;
        totalAmount += saleAmount;
      });

      // Agregar gastos del turno como egresos esperados
      const totalExpenses = shiftExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      console.log(`💰 Total gastos del turno: $${totalExpenses.toLocaleString()}`);
      
      // Los gastos se restan del efectivo esperado (asumiendo que se pagan en efectivo)
      if (totalExpenses > 0) {
        salesByMethod.efectivo.expected -= totalExpenses;
        console.log(`📉 Efectivo esperado ajustado por gastos: $${salesByMethod.efectivo.expected.toLocaleString()}`);
      }

      console.log(`✅ Procesadas ${totalProcessed} ventas por $${totalAmount.toLocaleString()}`);
      console.log(`💰 Gastos del turno: $${totalExpenses.toLocaleString()}`);
      console.log(`💰 Monto inicial: $${openingAmount.toLocaleString()}`);
      console.log('📊 Resumen por método:', salesByMethod);

      return {
        ...salesByMethod,
        shiftExpenses,
        totalExpenses,
        openingAmount
      };
    } catch (error) {
      console.error('Error obteniendo ventas por método de pago:', error);
      throw error;
    }
  },

  // Crear arqueo de caja
  async createCashCount(cashCountData) {
    try {
      const cashCountsRef = collection(db, 'cash_counts');
      const docRef = await addDoc(cashCountsRef, {
        ...cashCountData,
        createdByEmail: auth?.currentUser?.email || null,
        createdByUid: auth?.currentUser?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Arqueo de caja creado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando arqueo de caja:', error);
      throw error;
    }
  },

  // Obtener arqueos por turno
  async getCashCountsByShift(shiftId) {
    try {
      const cashCountsRef = collection(db, 'cash_counts');
      const q = query(
        cashCountsRef, 
        where('shiftId', '==', shiftId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error cargando arqueos por turno:', error);
      throw error;
    }
  },

  // Obtener arqueos por rango de fechas
  async getCashCountsByDateRange(startDate, endDate) {
    try {
      const cashCountsRef = collection(db, 'cash_counts');
      const q = query(
        cashCountsRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error cargando arqueos por rango:', error);
      throw error;
    }
  },

  // Calcular diferencias del arqueo
  calculateDifferences(cashCountData) {
    const differences = {};

    // Calcular diferencias por método de pago
    Object.keys(cashCountData.paymentMethods).forEach(method => {
      const data = cashCountData.paymentMethods[method];
      const difference = (data.counted || 0) - (data.expected || 0);
      differences[method] = {
        expected: data.expected || 0,
        counted: data.counted || 0,
        difference: difference,
        hasDifference: Math.abs(difference) > 0
      };
    });

    // Calcular totales
    const totalExpected = Object.values(cashCountData.paymentMethods)
      .reduce((sum, data) => sum + (data.expected || 0), 0);
    
    const totalCounted = Object.values(cashCountData.paymentMethods)
      .reduce((sum, data) => sum + (data.counted || 0), 0);

    // Agregar ingresos adicionales
    const additionalIncomes = cashCountData.additionalIncomes || [];
    const totalAdditionalIncomes = additionalIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

    // Agregar egresos adicionales
    const additionalExpenses = cashCountData.additionalExpenses || [];
    const totalAdditionalExpenses = additionalExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Total final
    const finalTotal = totalCounted + totalAdditionalIncomes - totalAdditionalExpenses;
    const finalExpected = totalExpected + totalAdditionalIncomes - totalAdditionalExpenses;
    const finalDifference = finalTotal - finalExpected;

    return {
      differences,
      totalExpected,
      totalCounted,
      totalAdditionalIncomes,
      totalAdditionalExpenses,
      finalTotal,
      finalExpected,
      finalDifference,
      hasDifference: Math.abs(finalDifference) > 0
    };
  },

  // Validar arqueo antes de guardar
  validateCashCount(cashCountData) {
    const errors = [];

    // Validar que al menos un método de pago tenga datos contados
    const hasPaymentData = Object.values(cashCountData.paymentMethods || {})
      .some(data => (data.counted || 0) > 0);
    
    if (!hasPaymentData) {
      errors.push('⚠️ DEBE ingresar al menos un monto contado para continuar');
    }

    // Validar que los montos sean números positivos
    Object.entries(cashCountData.paymentMethods || {}).forEach(([method, data]) => {
      if (data.counted && data.counted < 0) {
        errors.push(`❌ El monto contado de ${method} no puede ser negativo`);
      }
    });

    // Validar que se hayan contado todos los métodos con ventas esperadas
    Object.entries(cashCountData.paymentMethods || {}).forEach(([method, data]) => {
      const methodLabels = {
        efectivo: 'Efectivo',
        tarjetaDebito: 'Tarjeta Débito',
        tarjetaCredito: 'Tarjeta Crédito',
        transferencia: 'Transferencia',
        mercadopago: 'MercadoPago'
      };
      
      if (data.expected > 0 && (data.counted || 0) === 0) {
        errors.push(`⚠️ Debe contar ${methodLabels[method]} - Esperado: $${data.expected.toLocaleString()}`);
      }
    });

    // Validar ingresos adicionales
    (cashCountData.additionalIncomes || []).forEach((income, index) => {
      if (!income.description || !income.description.trim()) {
        errors.push(`❌ El ingreso #${index + 1} debe tener una descripción`);
      }
      if (!income.amount || income.amount <= 0) {
        errors.push(`❌ El ingreso #${index + 1} debe tener un monto válido`);
      }
    });

    // Validar egresos adicionales
    (cashCountData.additionalExpenses || []).forEach((expense, index) => {
      if (!expense.description || !expense.description.trim()) {
        errors.push(`❌ El egreso #${index + 1} debe tener una descripción`);
      }
      if (!expense.amount || expense.amount <= 0) {
        errors.push(`❌ El egreso #${index + 1} debe tener un monto válido`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
