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
import { saleService, expensesService } from './firebaseService';

// Servicio de arqueo de caja
export const cashCountService = {
  // Obtener ventas del turno por método de pago
  async getSalesByPaymentMethod(shiftId) {
    try {
      const allSales = await saleService.getAllSales();
      const shiftSales = allSales.filter(sale => sale.shiftId === shiftId);
      
      const salesByMethod = {
        efectivo: { count: 0, total: 0, expected: 0 },
        tarjetaDebito: { count: 0, total: 0, expected: 0 },
        tarjetaCredito: { count: 0, total: 0, expected: 0 },
        transferencia: { count: 0, total: 0, expected: 0 },
        mercadopago: { count: 0, total: 0, expected: 0 }
      };

      shiftSales.forEach(sale => {
        const paymentMethod = sale.paymentMethod;
        if (paymentMethod === 'efectivo') {
          salesByMethod.efectivo.count++;
          salesByMethod.efectivo.total += sale.total || 0;
          salesByMethod.efectivo.expected += sale.total || 0;
        } else if (paymentMethod === 'tarjeta') {
          if (sale.cardType === 'credito') {
            salesByMethod.tarjetaCredito.count++;
            salesByMethod.tarjetaCredito.total += sale.total || 0;
            salesByMethod.tarjetaCredito.expected += sale.total || 0;
          } else {
            salesByMethod.tarjetaDebito.count++;
            salesByMethod.tarjetaDebito.total += sale.total || 0;
            salesByMethod.tarjetaDebito.expected += sale.total || 0;
          }
        } else if (paymentMethod === 'transferencia') {
          salesByMethod.transferencia.count++;
          salesByMethod.transferencia.total += sale.total || 0;
          salesByMethod.transferencia.expected += sale.total || 0;
        } else if (paymentMethod === 'mercadopago') {
          salesByMethod.mercadopago.count++;
          salesByMethod.mercadopago.total += sale.total || 0;
          salesByMethod.mercadopago.expected += sale.total || 0;
        }
      });

      return salesByMethod;
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
    let totalDifference = 0;

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
      totalDifference += difference;
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

    // Validar que al menos un método de pago tenga datos
    const hasPaymentData = Object.values(cashCountData.paymentMethods || {})
      .some(data => (data.counted || 0) > 0);
    
    if (!hasPaymentData) {
      errors.push('Debe ingresar al menos un monto contado');
    }

    // Validar que los montos sean números positivos
    Object.entries(cashCountData.paymentMethods || {}).forEach(([method, data]) => {
      if (data.counted && data.counted < 0) {
        errors.push(`El monto contado de ${method} no puede ser negativo`);
      }
    });

    // Validar ingresos adicionales
    (cashCountData.additionalIncomes || []).forEach((income, index) => {
      if (!income.description || !income.description.trim()) {
        errors.push(`El ingreso #${index + 1} debe tener una descripción`);
      }
      if (!income.amount || income.amount <= 0) {
        errors.push(`El ingreso #${index + 1} debe tener un monto válido`);
      }
    });

    // Validar egresos adicionales
    (cashCountData.additionalExpenses || []).forEach((expense, index) => {
      if (!expense.description || !expense.description.trim()) {
        errors.push(`El egreso #${index + 1} debe tener una descripción`);
      }
      if (!expense.amount || expense.amount <= 0) {
        errors.push(`El egreso #${index + 1} debe tener un monto válido`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
