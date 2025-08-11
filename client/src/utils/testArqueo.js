// Script de prueba específico para el arqueo
export const testArqueo = {
  // Probar el flujo completo del arqueo
  async testArqueoFlow() {
    try {
      console.log('🧪 INICIANDO PRUEBA COMPLETA DEL ARQUEO');
      console.log('='.repeat(60));
      
      // 1. Obtener turno activo
      const { shiftService } = await import('../services/firebaseService');
      const activeShift = await shiftService.getActiveShift();
      
      if (!activeShift) {
        console.log('❌ No hay turno activo para probar');
        return;
      }
      
      console.log(`✅ Turno activo: ${activeShift.id}`);
      
      // 2. Probar cashCountService directamente
      const { cashCountService } = await import('../services/cashCountService');
      
      console.log('\n🔄 Probando cashCountService.getSalesByPaymentMethod...');
      const salesData = await cashCountService.getSalesByPaymentMethod(activeShift.id, true);
      
      console.log('📊 Resultado de cashCountService:', salesData);
      
      // 3. Verificar que los datos no sean 0
      const totalExpected = Object.values(salesData).reduce((sum, method) => sum + (method.expected || 0), 0);
      console.log(`💰 Total esperado: $${totalExpected.toLocaleString()}`);
      
      if (totalExpected === 0) {
        console.log('❌ PROBLEMA: Total esperado es 0');
        
        // 4. Verificar ventas directamente
        console.log('\n🔍 Verificando ventas directamente...');
        const { saleService } = await import('../services/firebaseService');
        const shiftSales = await saleService.getSalesByShift(activeShift.id, true);
        
        console.log(`📊 Ventas del turno: ${shiftSales.length}`);
        console.log('📋 Detalle de ventas:');
        shiftSales.forEach((sale, index) => {
          console.log(`  ${index + 1}. $${sale.total} - ${sale.paymentMethod} - cardType: ${sale.cardType}`);
        });
        
        // 5. Simular el procesamiento manual
        console.log('\n🔧 Simulando procesamiento manual...');
        const manualProcessing = {
          efectivo: { count: 0, total: 0, expected: 0 },
          tarjetaDebito: { count: 0, total: 0, expected: 0 },
          tarjetaCredito: { count: 0, total: 0, expected: 0 },
          transferencia: { count: 0, total: 0, expected: 0 },
          mercadopago: { count: 0, total: 0, expected: 0 }
        };
        
        shiftSales.forEach(sale => {
          const paymentMethod = sale.paymentMethod;
          const saleAmount = sale.total || 0;
          
          console.log(`  Procesando: ${paymentMethod} - $${saleAmount} - cardType: ${sale.cardType}`);
          
          if (paymentMethod === 'efectivo') {
            manualProcessing.efectivo.count++;
            manualProcessing.efectivo.total += saleAmount;
            manualProcessing.efectivo.expected += saleAmount;
          } else if (paymentMethod === 'tarjeta') {
            if (sale.cardType === 'credito') {
              manualProcessing.tarjetaCredito.count++;
              manualProcessing.tarjetaCredito.total += saleAmount;
              manualProcessing.tarjetaCredito.expected += saleAmount;
            } else {
              manualProcessing.tarjetaDebito.count++;
              manualProcessing.tarjetaDebito.total += saleAmount;
              manualProcessing.tarjetaDebito.expected += saleAmount;
            }
          } else if (paymentMethod === 'transferencia') {
            manualProcessing.transferencia.count++;
            manualProcessing.transferencia.total += saleAmount;
            manualProcessing.transferencia.expected += saleAmount;
          } else if (paymentMethod === 'mercadopago') {
            manualProcessing.mercadopago.count++;
            manualProcessing.mercadopago.total += saleAmount;
            manualProcessing.mercadopago.expected += saleAmount;
          }
        });
        
        console.log('📊 Resultado del procesamiento manual:', manualProcessing);
        
        const manualTotal = Object.values(manualProcessing).reduce((sum, method) => sum + (method.expected || 0), 0);
        console.log(`💰 Total manual: $${manualTotal.toLocaleString()}`);
        
        if (manualTotal > 0 && totalExpected === 0) {
          console.log('🚨 PROBLEMA ENCONTRADO: El cashCountService no está procesando correctamente');
          console.log('🔧 Comparando resultados:');
          console.log('  - cashCountService:', salesData);
          console.log('  - Procesamiento manual:', manualProcessing);
        }
        
      } else {
        console.log('✅ El cashCountService está funcionando correctamente');
      }
      
             return { activeShift, salesData };
      
    } catch (error) {
      console.error('❌ Error en prueba del arqueo:', error);
      throw error;
    }
  },
  
  // Probar solo el cashCountService
  async testCashCountService(shiftId) {
    try {
      console.log(`🧪 Probando cashCountService para turno: ${shiftId}`);
      
      const { cashCountService } = await import('../services/cashCountService');
      const result = await cashCountService.getSalesByPaymentMethod(shiftId, true);
      
      console.log('📊 Resultado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error probando cashCountService:', error);
      throw error;
    }
  }
};

// Exponer globalmente
window.testArqueo = testArqueo;
