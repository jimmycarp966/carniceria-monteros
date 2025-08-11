// Script de verificación para comparar resumen del día con ventas reales
import { saleService, shiftService } from '../services/firebaseService';

export const verifyDaySummary = async (date = new Date()) => {
  try {
    console.log('🔍 VERIFICANDO CONSISTENCIA DEL RESUMEN DEL DÍA');
    console.log('==============================================');
    
    const today = date.toISOString().split('T')[0];
    console.log(`📅 Fecha a verificar: ${today}`);
    
    // 1. Obtener todas las ventas del día
    console.log('\n📊 1. OBTENIENDO VENTAS DEL DÍA...');
    const allSales = await saleService.getAllSales();
    const todaySales = allSales.filter(sale => {
      const saleDate = sale.timestamp?.toDate?.()?.toISOString()?.split('T')[0] || 
                      sale.createdAt?.toDate?.()?.toISOString()?.split('T')[0];
      return saleDate === today;
    });
    
    console.log(`✅ Ventas encontradas: ${todaySales.length}`);
    console.log('📋 Detalles de ventas:');
    todaySales.forEach((sale, index) => {
      console.log(`   ${index + 1}. ID: ${sale.id} | Total: $${sale.total} | Método: ${sale.paymentMethod} | Turno: ${sale.shiftId}`);
    });
    
    // 2. Obtener turnos del día
    console.log('\n🔄 2. OBTENIENDO TURNOS DEL DÍA...');
    const shifts = await shiftService.getShiftsByDate(today);
    console.log(`✅ Turnos encontrados: ${shifts.length}`);
    shifts.forEach(shift => {
      console.log(`   - ${shift.type}: ${shift.employeeName} | Estado: ${shift.status}`);
    });
    
    // 3. Calcular totales reales
    console.log('\n💰 3. CALCULANDO TOTALES REALES...');
    const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const salesByPaymentMethod = {
      efectivo: { count: 0, total: 0 },
      tarjetaDebito: { count: 0, total: 0 },
      tarjetaCredito: { count: 0, total: 0 },
      transferencia: { count: 0, total: 0 },
      mercadopago: { count: 0, total: 0 }
    };
    
    todaySales.forEach(sale => {
      const method = sale.paymentMethod;
      if (salesByPaymentMethod[method]) {
        salesByPaymentMethod[method].count++;
        salesByPaymentMethod[method].total += sale.total || 0;
      }
    });
    
    console.log(`✅ Total real de ventas: $${totalRevenue.toLocaleString()}`);
    console.log('📊 Ventas por método de pago:');
    Object.entries(salesByPaymentMethod).forEach(([method, data]) => {
      if (data.count > 0) {
        console.log(`   - ${method}: ${data.count} ventas por $${data.total.toLocaleString()}`);
      }
    });
    
    // 4. Calcular totales por turno
    console.log('\n📈 4. CALCULANDO TOTALES POR TURNO...');
    const shiftsWithTotals = shifts.map(shift => {
      const shiftSales = todaySales.filter(sale => sale.shiftId === shift.id);
      const totalSales = shiftSales.length;
      const totalRevenue = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      
      console.log(`   ${shift.type}: ${totalSales} ventas por $${totalRevenue.toLocaleString()}`);
      
      return {
        id: shift.id,
        type: shift.type,
        employeeName: shift.employeeName,
        totalSales,
        totalRevenue,
        status: shift.status
      };
    });
    
    // 5. Generar resumen calculado (igual al de loadDaySummary)
    const calculatedSummary = {
      date: today,
      totalShifts: shifts.length,
      totalSales: todaySales.length,
      totalRevenue: totalRevenue,
      shifts: shiftsWithTotals,
      salesByPaymentMethod: {
        efectivo: salesByPaymentMethod.efectivo.total,
        tarjetaDebito: salesByPaymentMethod.tarjetaDebito.total,
        tarjetaCredito: salesByPaymentMethod.tarjetaCredito.total,
        transferencia: salesByPaymentMethod.transferencia.total,
        mercadopago: salesByPaymentMethod.mercadopago.total
      }
    };
    
    console.log('\n📋 5. RESUMEN CALCULADO:');
    console.log(JSON.stringify(calculatedSummary, null, 2));
    
    // 6. Verificar consistencia
    console.log('\n✅ 6. VERIFICACIÓN DE CONSISTENCIA:');
    console.log('====================================');
    
    // Verificar que todas las ventas tengan turno asignado
    const salesWithoutShift = todaySales.filter(sale => !sale.shiftId);
    if (salesWithoutShift.length > 0) {
      console.log(`⚠️  ADVERTENCIA: ${salesWithoutShift.length} ventas sin turno asignado:`);
      salesWithoutShift.forEach(sale => {
        console.log(`   - Venta ${sale.id}: $${sale.total}`);
      });
    } else {
      console.log('✅ Todas las ventas tienen turno asignado');
    }
    
    // Verificar que los totales coincidan
    const shiftTotalsSum = shiftsWithTotals.reduce((sum, shift) => sum + shift.totalRevenue, 0);
    if (Math.abs(shiftTotalsSum - totalRevenue) > 0.01) {
      console.log(`❌ ERROR: Los totales no coinciden`);
      console.log(`   - Total de ventas: $${totalRevenue}`);
      console.log(`   - Suma de turnos: $${shiftTotalsSum}`);
      console.log(`   - Diferencia: $${Math.abs(shiftTotalsSum - totalRevenue)}`);
    } else {
      console.log('✅ Los totales coinciden perfectamente');
    }
    
    // Verificar que no haya ventas duplicadas
    const saleIds = todaySales.map(sale => sale.id);
    const uniqueSaleIds = [...new Set(saleIds)];
    if (saleIds.length !== uniqueSaleIds.length) {
      console.log(`❌ ERROR: Hay ventas duplicadas`);
      console.log(`   - Ventas totales: ${saleIds.length}`);
      console.log(`   - Ventas únicas: ${uniqueSaleIds.length}`);
    } else {
      console.log('✅ No hay ventas duplicadas');
    }
    
    console.log('\n🎯 VERIFICACIÓN COMPLETADA');
    console.log('==========================');
    
    return {
      success: true,
      calculatedSummary,
      verification: {
        totalSales: todaySales.length,
        totalRevenue,
        salesWithoutShift: salesWithoutShift.length,
        totalsMatch: Math.abs(shiftTotalsSum - totalRevenue) <= 0.01,
        noDuplicates: saleIds.length === uniqueSaleIds.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para verificar múltiples días
export const verifyMultipleDays = async (days = 7) => {
  console.log(`🔍 VERIFICANDO ÚLTIMOS ${days} DÍAS`);
  console.log('==================================');
  
  const results = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    console.log(`\n📅 Verificando: ${date.toISOString().split('T')[0]}`);
    const result = await verifyDaySummary(date);
    results.push({
      date: date.toISOString().split('T')[0],
      ...result
    });
  }
  
  console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
  console.log('===========================');
  
  const successfulDays = results.filter(r => r.success);
  const failedDays = results.filter(r => !r.success);
  
  console.log(`✅ Días verificados exitosamente: ${successfulDays.length}`);
  console.log(`❌ Días con errores: ${failedDays.length}`);
  
  if (failedDays.length > 0) {
    console.log('\n❌ Días con problemas:');
    failedDays.forEach(day => {
      console.log(`   - ${day.date}: ${day.error}`);
    });
  }
  
  return results;
};
