import { nuclearReset } from './nuclearReset';

// Ejecutar reset nuclear inmediatamente
console.log('🚨 EJECUTANDO RESET NUCLEAR...');

nuclearReset({
  confirmMessage: '🚨 RESET NUCLEAR - ¿Estás 100% seguro?\n\nEsta acción eliminará TODOS los datos históricos:\n• Turnos\n• Días\n• Ventas\n• Gastos\n• Compras\n• Movimientos de inventario\n• Notificaciones\n• Logs de actividad\n• Arqueos de caja\n\nEsta acción es IRREVERSIBLE y NO se puede deshacer.'
}).then(result => {
  if (result.success) {
    console.log('✅ Reset nuclear completado exitosamente');
    console.log(`📊 Total de documentos eliminados: ${result.totalDeleted}`);
    console.log('📋 Detalles:', result.deleted);
    
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️ Errores encontrados:', result.errors);
    }
  } else {
    console.error('❌ Error en reset nuclear:', result.message || result.error);
  }
}).catch(error => {
  console.error('❌ Error ejecutando reset nuclear:', error);
});
