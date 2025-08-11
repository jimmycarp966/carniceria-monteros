// Script completo para limpiar todos los turnos desde el navegador
// Uso: En la consola del navegador, ejecutar: clearAllShifts()

export const clearAllShifts = async () => {
  console.log('🔥 LIMPIEZA COMPLETA DE TURNOS DESDE NAVEGADOR...');
  console.log('================================================');
  
  try {
    // 1. LIMPIAR FIRESTORE
    console.log('\n📋 1. LIMPIANDO FIRESTORE...');
    const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
    const allShifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📊 Turnos encontrados en Firestore: ${allShifts.length}`);
    
    let firestoreDeleted = 0;
    for (const shift of allShifts) {
      try {
        await deleteDoc(doc(db, 'shifts', shift.id));
        console.log(`✅ Firestore borrado: ${shift.id}`);
        firestoreDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando ${shift.id}:`, error);
      }
    }
    
    // 2. LIMPIAR REALTIME DATABASE
    console.log('\n📋 2. LIMPIANDO REALTIME DATABASE...');
    try {
      const { ref, remove } = await import('firebase/database');
      const { realtimeDb } = await import('../firebase');
      
      if (realtimeDb) {
        await remove(ref(realtimeDb, 'shifts'));
        console.log('✅ Realtime Database limpiado');
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando RTDB:', error);
    }
    
    // 3. LIMPIAR LOCALSTORAGE
    console.log('\n📋 3. LIMPIANDO LOCALSTORAGE...');
    const keysToRemove = [
      'currentShift',
      'shiftData', 
      'cashRegisterState',
      'activeShift',
      'shiftCache',
      'shiftStats',
      'shiftDataCache',
      'shiftSyncData',
      'lastShiftUpdate',
      'shiftNotifications',
      'shiftTimer',
      'shiftStartTime',
      'shiftEndTime',
      'shiftDuration',
      'shiftBreakTime',
      'shiftPauseTime',
      'shiftResumeTime',
      'shiftStatus',
      'shiftType',
      'shiftEmployee',
      'shiftLocation',
      'shiftNotes',
      'shiftCashCount',
      'shiftSales',
      'shiftRevenue',
      'shiftExpenses',
      'shiftProfit',
      'shiftTransactions',
      'shiftPayments',
      'shiftRefunds',
      'shiftDiscounts',
      'shiftTaxes',
      'shiftTotals',
      'shiftSummary',
      'shiftReport',
      'shiftAudit',
      'shiftHistory',
      'shiftArchive',
      'shiftBackup',
      'shiftRestore',
      'shiftExport',
      'shiftImport',
      'shiftSync',
      'shiftBackup',
      'shiftRestore',
      'shiftExport',
      'shiftImport',
      'shiftSync',
      'shiftBackup',
      'shiftRestore',
      'shiftExport',
      'shiftImport',
      'shiftSync'
    ];
    
    let localStorageCleared = 0;
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ localStorage.${key} eliminado`);
        localStorageCleared++;
      }
    });
    
    // 4. LIMPIAR SESSIONSTORAGE
    console.log('\n📋 4. LIMPIANDO SESSIONSTORAGE...');
    let sessionStorageCleared = 0;
    keysToRemove.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log(`✅ sessionStorage.${key} eliminado`);
        sessionStorageCleared++;
      }
    });
    
    // 5. LIMPIAR INDEXEDDB (si existe)
    console.log('\n📋 5. LIMPIANDO INDEXEDDB...');
    try {
      if ('indexedDB' in window) {
        const request = indexedDB.deleteDatabase('shiftCache');
        request.onsuccess = () => console.log('✅ IndexedDB limpiado');
        request.onerror = () => console.warn('⚠️ Error limpiando IndexedDB');
      }
    } catch (error) {
      console.warn('⚠️ Error accediendo a IndexedDB:', error);
    }
    
    // 6. DISPARAR EVENTOS DE RESET
    console.log('\n📋 6. DISPARANDO EVENTOS DE RESET...');
    const events = [
      'forceResetShifts',
      'shiftsCleared',
      'shiftReset',
      'cashRegisterReset',
      'systemReset'
    ];
    
    events.forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName));
      console.log(`✅ Evento ${eventName} disparado`);
    });
    
    // 7. LIMPIAR CACHE DE SERVICIOS
    console.log('\n📋 7. LIMPIANDO CACHE DE SERVICIOS...');
    try {
      // Limpiar cache de servicios si existe
      if (window.smartCache) {
        window.smartCache.clear();
        console.log('✅ SmartCache limpiado');
      }
      
      if (window.dataCache) {
        window.dataCache.clear();
        console.log('✅ DataCache limpiado');
      }
      
      // Limpiar cache de Firebase
      if (window.firebaseCache) {
        window.firebaseCache.clear();
        console.log('✅ FirebaseCache limpiado');
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando cache de servicios:', error);
    }
    
    // 8. RESULTADOS FINALES
    console.log('\n🎉 RESULTADOS DE LA LIMPIEZA COMPLETA:');
    console.log('=====================================');
    console.log(`✅ Turnos borrados de Firestore: ${firestoreDeleted}`);
    console.log(`✅ Realtime Database: LIMPIO`);
    console.log(`✅ localStorage limpiado: ${localStorageCleared} claves`);
    console.log(`✅ sessionStorage limpiado: ${sessionStorageCleared} claves`);
    console.log(`✅ IndexedDB: LIMPIO`);
    console.log(`✅ Eventos disparados: ${events.length}`);
    console.log(`✅ Cache de servicios: LIMPIO`);
    
    // 9. VERIFICACIÓN FINAL
    console.log('\n🔍 VERIFICACIÓN FINAL...');
    const finalSnapshot = await getDocs(collection(db, 'shifts'));
    console.log(`📊 Turnos restantes en Firestore: ${finalSnapshot.size}`);
    
    if (finalSnapshot.size === 0) {
      console.log('\n🎯 ¡LIMPIEZA COMPLETA EXITOSA!');
      console.log('🚀 El sistema está completamente limpio.');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Aún quedan turnos en Firestore');
    }
    
    // 10. RECARGAR PÁGINA
    console.log('\n🔄 Recargando página en 3 segundos...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
    return {
      firestoreDeleted,
      localStorageCleared,
      sessionStorageCleared,
      eventsDispatched: events.length
    };
    
  } catch (error) {
    console.error('💥 ERROR EN LIMPIEZA COMPLETA:', error);
    throw error;
  }
};

// Hacer la función disponible globalmente
if (typeof window !== 'undefined') {
  window.clearAllShifts = clearAllShifts;
  console.log('🛠️ Función de limpieza completa disponible:');
  console.log('  - clearAllShifts() - Limpieza completa de turnos');
}
