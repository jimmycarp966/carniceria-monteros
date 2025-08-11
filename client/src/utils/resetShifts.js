// Utilidad para reiniciar turnos desde la consola del navegador
// Uso: En la consola del navegador, ejecutar: resetAllShifts()

export const resetAllShifts = async () => {
  console.log('🔥 INICIANDO RESET COMPLETO DE TURNOS...');
  
  try {
    const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    // 1. Obtener todos los turnos
    console.log('📋 Obteniendo todos los turnos...');
    const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
    const allShifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📊 Total de turnos encontrados: ${allShifts.length}`);
    
    // 2. Mostrar información de turnos activos
    const activeShifts = allShifts.filter(shift => shift.status === 'active' || !shift.endTime);
    console.log(`📊 Turnos activos: ${activeShifts.length}`);
    activeShifts.forEach(shift => {
      console.log(`  - ${shift.id}: ${shift.employeeName} | ${shift.openTime} | ${shift.status}`);
    });
    
    // 3. Borrar todos los turnos
    console.log('🗑️ Borrando todos los turnos...');
    let deletedCount = 0;
    
    for (const shift of allShifts) {
      try {
        await deleteDoc(doc(db, 'shifts', shift.id));
        console.log(`✅ Borrado: ${shift.id}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error borrando ${shift.id}:`, error);
      }
    }
    
    // 4. Limpiar Realtime Database
    console.log('🗑️ Limpiando Realtime Database...');
    try {
      const { ref, remove } = await import('firebase/database');
      const { realtimeDb } = await import('../firebase');
      
      if (realtimeDb) {
        await remove(ref(realtimeDb, 'shifts'));
        console.log('✅ Realtime Database limpiado');
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando Realtime Database:', error);
    }
    
    // 5. Limpiar localStorage
    console.log('🗑️ Limpiando localStorage...');
    const keysToRemove = [
      'currentShift',
      'shiftData', 
      'cashRegisterState',
      'activeShift',
      'shiftCache',
      'shiftStats'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ localStorage.${key} eliminado`);
      }
    });
    
    // 6. Disparar evento de reset
    console.log('🔄 Disparando evento de reset...');
    window.dispatchEvent(new CustomEvent('forceResetShifts'));
    
    console.log(`🎉 RESET COMPLETO: ${deletedCount} turnos borrados`);
    
    // 7. Recargar página después de 2 segundos
    setTimeout(() => {
      console.log('🔄 Recargando página...');
      window.location.reload();
    }, 2000);
    
    return deletedCount;
    
  } catch (error) {
    console.error('💥 Error en reset de turnos:', error);
    throw error;
  }
};

// Función para diagnosticar turnos sin borrarlos
export const diagnoseShifts = async () => {
  console.log('🔍 DIAGNÓSTICO DE TURNOS...');
  
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    // Verificar Firestore
    console.log('📋 Verificando turnos en Firestore...');
    const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
    const firestoreShifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📊 Turnos en Firestore: ${firestoreShifts.length}`);
    
    firestoreShifts.forEach(shift => {
      console.log(`  - ${shift.id}: ${shift.status} | ${shift.employeeName} | ${shift.openTime}`);
    });
    
    // Verificar Realtime Database
    console.log('📋 Verificando turnos en Realtime Database...');
    try {
      const { ref, get } = await import('firebase/database');
      const { realtimeDb } = await import('../firebase');
      
      if (realtimeDb) {
        const rtdbSnapshot = await get(ref(realtimeDb, 'shifts'));
        if (rtdbSnapshot.exists()) {
          const rtdbShifts = rtdbSnapshot.val();
          console.log(`📊 Turnos en RTDB: ${Object.keys(rtdbShifts || {}).length}`);
          Object.entries(rtdbShifts || {}).forEach(([id, data]) => {
            console.log(`  - ${id}: ${data.status} | ${data.employeeName}`);
          });
        } else {
          console.log('📊 No hay turnos en RTDB');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error verificando RTDB:', error);
    }
    
    // Verificar localStorage
    console.log('📋 Verificando localStorage...');
    const keysToCheck = [
      'currentShift',
      'shiftData', 
      'cashRegisterState',
      'activeShift',
      'shiftCache',
      'shiftStats'
    ];
    
    keysToCheck.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`  - ${key}: ${value.substring(0, 100)}...`);
      } else {
        console.log(`  - ${key}: No encontrado`);
      }
    });
    
    return {
      firestore: firestoreShifts.length,
      rtdb: 0, // Se calculará si existe
      localStorage: keysToCheck.filter(key => localStorage.getItem(key)).length
    };
    
  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
    throw error;
  }
};

// Función para borrar solo turnos activos
export const resetActiveShifts = async () => {
  console.log('🔥 BORRANDO SOLO TURNOS ACTIVOS...');
  
  try {
    const { collection, getDocs, deleteDoc, doc, query, where } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    // Buscar turnos activos
    const activeShiftsQuery = query(collection(db, 'shifts'), where('status', '==', 'active'));
    const activeSnapshot = await getDocs(activeShiftsQuery);
    const activeShifts = activeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Turnos activos encontrados: ${activeShifts.length}`);
    activeShifts.forEach(shift => {
      console.log(`  - ${shift.id}: ${shift.employeeName} | ${shift.openTime}`);
    });
    
    // Borrar turnos activos
    let deletedCount = 0;
    for (const shift of activeShifts) {
      try {
        await deleteDoc(doc(db, 'shifts', shift.id));
        console.log(`✅ Borrado: ${shift.id}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error borrando ${shift.id}:`, error);
      }
    }
    
    // Limpiar localStorage
    localStorage.removeItem('currentShift');
    localStorage.removeItem('shiftData');
    localStorage.removeItem('cashRegisterState');
    
    // Disparar evento de reset
    window.dispatchEvent(new CustomEvent('forceResetShifts'));
    
    console.log(`🎉 ${deletedCount} turnos activos borrados`);
    
    // Recargar página
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return deletedCount;
    
  } catch (error) {
    console.error('💥 Error borrando turnos activos:', error);
    throw error;
  }
};

// Hacer las funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.resetAllShifts = resetAllShifts;
  window.diagnoseShifts = diagnoseShifts;
  window.resetActiveShifts = resetActiveShifts;
  
  console.log('🛠️ Funciones de reset disponibles:');
  console.log('  - resetAllShifts() - Borrar todos los turnos');
  console.log('  - diagnoseShifts() - Diagnosticar turnos sin borrar');
  console.log('  - resetActiveShifts() - Borrar solo turnos activos');
}
