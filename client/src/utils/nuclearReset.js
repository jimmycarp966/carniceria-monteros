import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Función para eliminar todos los documentos de una colección
const deleteAllFromCollection = async (collectionName, batchSize = 500) => {
  try {
    console.log(`🗑️ Eliminando todos los documentos de ${collectionName}...`);
    
    const collectionRef = collection(db, collectionName);
    let deletedCount = 0;
    let hasMore = true;
    
    while (hasMore) {
      const snapshot = await getDocs(query(collectionRef, limit(batchSize)));
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      await batch.commit();
      deletedCount += snapshot.docs.length;
      console.log(`✅ Eliminados ${snapshot.docs.length} documentos de ${collectionName} (total: ${deletedCount})`);
      
      if (snapshot.docs.length < batchSize) {
        hasMore = false;
      }
    }
    
    console.log(`✅ Total eliminados de ${collectionName}: ${deletedCount}`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ Error eliminando documentos de ${collectionName}:`, error);
    throw error;
  }
};

// Función para eliminar documentos específicos por fecha
const deleteDocumentsByDateRange = async (collectionName, startDate, endDate) => {
  try {
    console.log(`🗑️ Eliminando documentos de ${collectionName} entre ${startDate} y ${endDate}...`);
    
    const collectionRef = collection(db, collectionName);
    const q = query(
      collectionRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log(`✅ Eliminados ${snapshot.docs.length} documentos de ${collectionName} en el rango de fechas`);
    return snapshot.docs.length;
  } catch (error) {
    console.error(`❌ Error eliminando documentos por fecha de ${collectionName}:`, error);
    throw error;
  }
};

// Función para eliminar documentos por turno
const deleteDocumentsByShift = async (collectionName, shiftId) => {
  try {
    console.log(`🗑️ Eliminando documentos de ${collectionName} del turno ${shiftId}...`);
    
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, where('shiftId', '==', shiftId));
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log(`✅ Eliminados ${snapshot.docs.length} documentos de ${collectionName} del turno ${shiftId}`);
    return snapshot.docs.length;
  } catch (error) {
    console.error(`❌ Error eliminando documentos del turno de ${collectionName}:`, error);
    throw error;
  }
};

// Función principal de reset nuclear
export const nuclearReset = async (options = {}) => {
  const {
    includeShifts = true,
    includeDays = true,
    includeSales = true,
    includeExpenses = true,
    includePurchases = true,
    includeInventoryMovements = true,
    includeNotifications = true,
    includeActivityLogs = true,
    dateRange = null, // { startDate, endDate }
    confirmMessage = '¿Estás seguro de que quieres eliminar TODOS los datos históricos? Esta acción es IRREVERSIBLE.'
  } = options;

  try {
    // Confirmación del usuario
    if (!window.confirm(confirmMessage)) {
      console.log('❌ Reset nuclear cancelado por el usuario');
      return { success: false, message: 'Operación cancelada' };
    }

    console.log('🚨 INICIANDO RESET NUCLEAR DEL SISTEMA...');
    console.log('⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos históricos');
    
    const results = {
      success: true,
      deleted: {},
      errors: []
    };

    // 1. Eliminar turnos (shifts)
    if (includeShifts) {
      try {
        const deletedShifts = await deleteAllFromCollection('shifts');
        results.deleted.shifts = deletedShifts;
        console.log(`✅ Turnos eliminados: ${deletedShifts}`);
      } catch (error) {
        results.errors.push({ collection: 'shifts', error: error.message });
        console.error('❌ Error eliminando turnos:', error);
      }
    }

    // 2. Eliminar días (days)
    if (includeDays) {
      try {
        const deletedDays = await deleteAllFromCollection('days');
        results.deleted.days = deletedDays;
        console.log(`✅ Días eliminados: ${deletedDays}`);
      } catch (error) {
        results.errors.push({ collection: 'days', error: error.message });
        console.error('❌ Error eliminando días:', error);
      }
    }

    // 3. Eliminar ventas (sales)
    if (includeSales) {
      try {
        const deletedSales = await deleteAllFromCollection('sales');
        results.deleted.sales = deletedSales;
        console.log(`✅ Ventas eliminadas: ${deletedSales}`);
      } catch (error) {
        results.errors.push({ collection: 'sales', error: error.message });
        console.error('❌ Error eliminando ventas:', error);
      }
    }

    // 4. Eliminar gastos (expenses)
    if (includeExpenses) {
      try {
        const deletedExpenses = await deleteAllFromCollection('expenses');
        results.deleted.expenses = deletedExpenses;
        console.log(`✅ Gastos eliminados: ${deletedExpenses}`);
      } catch (error) {
        results.errors.push({ collection: 'expenses', error: error.message });
        console.error('❌ Error eliminando gastos:', error);
      }
    }

    // 5. Eliminar compras (purchases)
    if (includePurchases) {
      try {
        const deletedPurchases = await deleteAllFromCollection('purchases');
        results.deleted.purchases = deletedPurchases;
        console.log(`✅ Compras eliminadas: ${deletedPurchases}`);
      } catch (error) {
        results.errors.push({ collection: 'purchases', error: error.message });
        console.error('❌ Error eliminando compras:', error);
      }
    }

    // 6. Eliminar movimientos de inventario (inventory_movements)
    if (includeInventoryMovements) {
      try {
        const deletedMovements = await deleteAllFromCollection('inventory_movements');
        results.deleted.inventory_movements = deletedMovements;
        console.log(`✅ Movimientos de inventario eliminados: ${deletedMovements}`);
      } catch (error) {
        results.errors.push({ collection: 'inventory_movements', error: error.message });
        console.error('❌ Error eliminando movimientos de inventario:', error);
      }
    }

    // 7. Eliminar notificaciones (notifications)
    if (includeNotifications) {
      try {
        const deletedNotifications = await deleteAllFromCollection('notifications');
        results.deleted.notifications = deletedNotifications;
        console.log(`✅ Notificaciones eliminadas: ${deletedNotifications}`);
      } catch (error) {
        results.errors.push({ collection: 'notifications', error: error.message });
        console.error('❌ Error eliminando notificaciones:', error);
      }
    }

    // 8. Eliminar logs de actividad (activity_logs)
    if (includeActivityLogs) {
      try {
        const deletedLogs = await deleteAllFromCollection('activity_logs');
        results.deleted.activity_logs = deletedLogs;
        console.log(`✅ Logs de actividad eliminados: ${deletedLogs}`);
      } catch (error) {
        results.errors.push({ collection: 'activity_logs', error: error.message });
        console.error('❌ Error eliminando logs de actividad:', error);
      }
    }

    // 9. Eliminar arqueos de caja (cash_counts)
    try {
      const deletedCashCounts = await deleteAllFromCollection('cash_counts');
      results.deleted.cash_counts = deletedCashCounts;
      console.log(`✅ Arqueos de caja eliminados: ${deletedCashCounts}`);
    } catch (error) {
      results.errors.push({ collection: 'cash_counts', error: error.message });
      console.error('❌ Error eliminando arqueos de caja:', error);
    }

    // Calcular total de documentos eliminados
    const totalDeleted = Object.values(results.deleted).reduce((sum, count) => sum + count, 0);
    
    console.log('🎉 RESET NUCLEAR COMPLETADO');
    console.log(`📊 Total de documentos eliminados: ${totalDeleted}`);
    console.log('📋 Resumen:', results.deleted);
    
    if (results.errors.length > 0) {
      console.log('⚠️ Errores encontrados:', results.errors);
    }

    // Limpiar cache local
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 Cache local limpiado');
    }

    // Disparar evento para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('nuclearResetCompleted', { 
      detail: { results, totalDeleted } 
    }));

    return {
      success: true,
      totalDeleted,
      deleted: results.deleted,
      errors: results.errors
    };

  } catch (error) {
    console.error('❌ Error en reset nuclear:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para reset parcial por fecha
export const resetByDateRange = async (startDate, endDate, options = {}) => {
  try {
    console.log(`🗑️ Iniciando reset por rango de fechas: ${startDate} a ${endDate}`);
    
    const confirmMessage = `¿Estás seguro de que quieres eliminar todos los datos entre ${startDate} y ${endDate}? Esta acción es IRREVERSIBLE.`;
    
    if (!window.confirm(confirmMessage)) {
      return { success: false, message: 'Operación cancelada' };
    }

    const results = {
      success: true,
      deleted: {},
      errors: []
    };

    // Eliminar por rango de fechas
    const collections = ['shifts', 'days', 'sales', 'expenses', 'purchases', 'inventory_movements', 'cash_counts'];
    
    for (const collectionName of collections) {
      try {
        const deleted = await deleteDocumentsByDateRange(collectionName, startDate, endDate);
        results.deleted[collectionName] = deleted;
      } catch (error) {
        results.errors.push({ collection: collectionName, error: error.message });
      }
    }

    const totalDeleted = Object.values(results.deleted).reduce((sum, count) => sum + count, 0);
    
    console.log(`✅ Reset por fecha completado. Total eliminados: ${totalDeleted}`);
    
    return {
      success: true,
      totalDeleted,
      deleted: results.deleted,
      errors: results.errors
    };

  } catch (error) {
    console.error('❌ Error en reset por fecha:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para eliminar turnos específicos y sus datos relacionados
export const killAllShifts = async (shiftIds = null) => {
  try {
    console.log('🔪 Iniciando KILL ALL SHIFTS...');
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODOS los turnos y sus datos relacionados? Esta acción es IRREVERSIBLE.')) {
      return { success: false, message: 'Operación cancelada' };
    }

    const results = {
      success: true,
      deleted: {},
      errors: []
    };

    // Si no se especifican IDs, eliminar todos los turnos
    if (!shiftIds) {
      const shiftsRef = collection(db, 'shifts');
      const snapshot = await getDocs(shiftsRef);
      shiftIds = snapshot.docs.map(doc => doc.id);
    }

    console.log(`🗑️ Eliminando ${shiftIds.length} turnos y sus datos relacionados...`);

    // Eliminar datos relacionados por turno
    const relatedCollections = ['sales', 'expenses', 'cash_counts'];
    
    for (const shiftId of shiftIds) {
      for (const collectionName of relatedCollections) {
        try {
          await deleteDocumentsByShift(collectionName, shiftId);
        } catch (error) {
          results.errors.push({ 
            collection: collectionName, 
            shiftId, 
            error: error.message 
          });
        }
      }
    }

    // Eliminar los turnos
    try {
      const deletedShifts = await deleteAllFromCollection('shifts');
      results.deleted.shifts = deletedShifts;
    } catch (error) {
      results.errors.push({ collection: 'shifts', error: error.message });
    }

    // Eliminar días relacionados
    try {
      const deletedDays = await deleteAllFromCollection('days');
      results.deleted.days = deletedDays;
    } catch (error) {
      results.errors.push({ collection: 'days', error: error.message });
    }

    const totalDeleted = Object.values(results.deleted).reduce((sum, count) => sum + count, 0);
    
    console.log(`✅ KILL ALL SHIFTS completado. Total eliminados: ${totalDeleted}`);
    
    return {
      success: true,
      totalDeleted,
      deleted: results.deleted,
      errors: results.errors
    };

  } catch (error) {
    console.error('❌ Error en KILL ALL SHIFTS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para obtener estadísticas antes del reset
export const getResetStatistics = async () => {
  try {
    console.log('📊 Obteniendo estadísticas para reset...');
    
    const collections = [
      'shifts', 'days', 'sales', 'expenses', 'purchases', 
      'inventory_movements', 'notifications', 'activity_logs', 'cash_counts'
    ];
    
    const stats = {};
    
    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        stats[collectionName] = snapshot.docs.length;
      } catch (error) {
        console.error(`❌ Error obteniendo estadísticas de ${collectionName}:`, error);
        stats[collectionName] = 'Error';
      }
    }
    
    const total = Object.values(stats).reduce((sum, count) => {
      return typeof count === 'number' ? sum + count : sum;
    }, 0);
    
    console.log('📊 Estadísticas obtenidas:', stats);
    console.log(`📊 Total de documentos: ${total}`);
    
    return {
      success: true,
      stats,
      total
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
