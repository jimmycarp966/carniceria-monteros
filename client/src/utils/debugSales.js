// Script de diagnóstico para ventas y shiftIds
export const debugSales = {
  // Verificar todas las ventas y sus shiftIds
  async checkAllSales() {
    try {
      console.log('🔍 DIAGNÓSTICO: Verificando todas las ventas...');
      
      const { saleService } = await import('../services/firebaseService');
      const allSales = await saleService.getAllSales();
      
      console.log(`📊 Total de ventas en la base de datos: ${allSales.length}`);
      
      // Agrupar por shiftId
      const salesByShift = {};
      const salesWithoutShift = [];
      
      allSales.forEach(sale => {
        const shiftId = sale.shiftId;
        if (shiftId) {
          if (!salesByShift[shiftId]) {
            salesByShift[shiftId] = [];
          }
          salesByShift[shiftId].push(sale);
        } else {
          salesWithoutShift.push(sale);
        }
      });
      
      console.log('📋 Ventas agrupadas por shiftId:');
      Object.entries(salesByShift).forEach(([shiftId, sales]) => {
        const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        console.log(`  • ShiftId: ${shiftId} (${typeof shiftId}) - ${sales.length} ventas por $${total.toLocaleString()}`);
      });
      
      if (salesWithoutShift.length > 0) {
        console.log(`⚠️ Ventas sin shiftId: ${salesWithoutShift.length}`);
        salesWithoutShift.forEach(sale => {
          console.log(`  • Venta ${sale.id}: $${sale.total} - ${sale.paymentMethod}`);
        });
      }
      
      return { salesByShift, salesWithoutShift, totalSales: allSales.length };
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      throw error;
    }
  },
  
  // Verificar ventas de un turno específico
  async checkShiftSales(shiftId) {
    try {
      console.log(`🔍 DIAGNÓSTICO: Verificando ventas del turno ${shiftId}...`);
      
      const { saleService } = await import('../services/firebaseService');
      const shiftSales = await saleService.getSalesByShift(shiftId);
      
      console.log(`📊 Ventas del turno ${shiftId}: ${shiftSales.length}`);
      
      if (shiftSales.length > 0) {
        const total = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        console.log(`💰 Total del turno: $${total.toLocaleString()}`);
        
        // Agrupar por método de pago
        const byMethod = {};
        shiftSales.forEach(sale => {
          const method = sale.paymentMethod || 'sin_metodo';
          if (!byMethod[method]) {
            byMethod[method] = { count: 0, total: 0 };
          }
          byMethod[method].count++;
          byMethod[method].total += sale.total || 0;
        });
        
        console.log('💳 Ventas por método de pago:');
        Object.entries(byMethod).forEach(([method, data]) => {
          console.log(`  • ${method}: ${data.count} ventas por $${data.total.toLocaleString()}`);
        });
      }
      
      return shiftSales;
    } catch (error) {
      console.error('❌ Error verificando ventas del turno:', error);
      throw error;
    }
  },
  
  // Verificar turno activo
  async checkActiveShift() {
    try {
      console.log('🔍 DIAGNÓSTICO: Verificando turno activo...');
      
      const { shiftService } = await import('../services/firebaseService');
      const activeShift = await shiftService.getActiveShift();
      
      if (activeShift) {
        console.log(`✅ Turno activo encontrado:`);
        console.log(`  • ID: ${activeShift.id} (${typeof activeShift.id})`);
        console.log(`  • Tipo: ${activeShift.type}`);
        console.log(`  • Estado: ${activeShift.status}`);
        console.log(`  • Inicio: ${activeShift.startTime?.toDate?.() || activeShift.startTime}`);
        
        // Verificar ventas de este turno
        await this.checkShiftSales(activeShift.id);
        
        return activeShift;
      } else {
        console.log('❌ No hay turno activo');
        return null;
      }
    } catch (error) {
      console.error('❌ Error verificando turno activo:', error);
      throw error;
    }
  },
  
  // Ejecutar diagnóstico completo
  async runFullDiagnostic() {
    try {
      console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO DE VENTAS');
      console.log('=' .repeat(50));
      
      // 1. Verificar turno activo
      const activeShift = await this.checkActiveShift();
      
      console.log('\n' + '=' .repeat(50));
      
      // 2. Verificar todas las ventas
      const { salesByShift, salesWithoutShift } = await this.checkAllSales();
      
      console.log('\n' + '=' .repeat(50));
      
      // 3. Resumen
      console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
      console.log(`• Turno activo: ${activeShift ? `SÍ (${activeShift.id})` : 'NO'}`);
      console.log(`• Total de ventas: ${Object.values(salesByShift).reduce((sum, sales) => sum + sales.length, 0)}`);
      console.log(`• Ventas sin turno: ${salesWithoutShift.length}`);
      
      if (activeShift && salesByShift[activeShift.id]) {
        const shiftSales = salesByShift[activeShift.id];
        const total = shiftSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        console.log(`• Ventas del turno activo: ${shiftSales.length} por $${total.toLocaleString()}`);
      }
      
      return { activeShift, salesByShift, salesWithoutShift };
    } catch (error) {
      console.error('❌ Error en diagnóstico completo:', error);
      throw error;
    }
  }
};

// Exponer globalmente para uso en consola
window.debugSales = debugSales;
