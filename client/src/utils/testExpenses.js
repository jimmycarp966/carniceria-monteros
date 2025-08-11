import { expensesService } from '../services/firebaseService.js';

export const testExpenses = async () => {
  console.log('🔍 INICIANDO PRUEBA DE GASTOS...');
  
  try {
    // 1. Obtener todos los gastos del sistema
    console.log('📊 1. OBTENIENDO TODOS LOS GASTOS...');
    const allExpenses = await expensesService.getAllExpenses();
    console.log(`📊 Total gastos en el sistema: ${allExpenses.length}`);
    
    if (allExpenses.length === 0) {
      console.log('❌ No hay gastos en el sistema');
      return;
    }
    
    // 2. Mostrar detalles de cada gasto
    console.log('📋 2. DETALLES DE GASTOS:');
    allExpenses.forEach((expense, index) => {
      console.log(`${index + 1}. ID: ${expense.id}`);
      console.log(`   - Monto: $${expense.amount}`);
      console.log(`   - Razón: ${expense.reason}`);
      console.log(`   - Método de pago: ${expense.paymentMethod}`);
      console.log(`   - Fecha: ${expense.createdAt?.toDate?.()?.toISOString()}`);
      console.log(`   - Turno: ${expense.shiftId}`);
      console.log('   ---');
    });
    
    // 3. Probar búsqueda por rango de fecha (hoy)
    console.log('📅 3. PROBANDO BÚSQUEDA POR FECHA (HOY)...');
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('📅 Fecha de hoy:', today);
    console.log('📅 Rango de búsqueda:', startDate.toISOString(), 'a', endDate.toISOString());
    
    const todayExpenses = await expensesService.getExpensesByDateRange(startDate, endDate);
    console.log(`💰 Gastos encontrados para hoy: ${todayExpenses.length}`);
    
    // 4. Mostrar gastos de hoy
    if (todayExpenses.length > 0) {
      console.log('📋 4. GASTOS DE HOY:');
      todayExpenses.forEach((expense, index) => {
        console.log(`${index + 1}. $${expense.amount} - ${expense.reason} (${expense.paymentMethod})`);
      });
    } else {
      console.log('❌ No se encontraron gastos para hoy');
    }
    
    // 5. Verificar si hay gastos con fechas válidas
    console.log('🔍 5. VERIFICANDO FECHAS DE GASTOS...');
    const expensesWithValidDates = allExpenses.filter(expense => {
      const hasValidDate = expense.createdAt?.toDate?.();
      if (!hasValidDate) {
        console.log(`⚠️ Gasto ${expense.id} sin fecha válida:`, expense.createdAt);
      }
      return hasValidDate;
    });
    
    console.log(`✅ Gastos con fechas válidas: ${expensesWithValidDates.length}/${allExpenses.length}`);
    
  } catch (error) {
    console.error('❌ Error en prueba de gastos:', error);
  }
};

// Función para agregar un gasto de prueba
export const addTestExpense = async () => {
  console.log('➕ AGREGANDO GASTO DE PRUEBA...');
  
  try {
    const testExpense = {
      shiftId: 'test-shift-id',
      amount: 1000,
      reason: 'Gasto de prueba para diagnóstico',
      paymentMethod: 'efectivo',
      type: 'operational'
    };
    
    const expenseId = await expensesService.addExpense(testExpense);
    console.log('✅ Gasto de prueba agregado con ID:', expenseId);
    
    return expenseId;
  } catch (error) {
    console.error('❌ Error agregando gasto de prueba:', error);
  }
};
