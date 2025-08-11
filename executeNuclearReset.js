const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, query, limit } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCVn2q5J4zl0U1RL8D6nmaWGdq5WPJ2t9Y",
  authDomain: "carniceria-monteros.firebaseapp.com",
  projectId: "carniceria-monteros",
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com",
  storageBucket: "carniceria-monteros.firebasestorage.app",
  messagingSenderId: "295246860976",
  appId: "1:295246860976:web:a529e27f8e382c59daa175",
  measurementId: "G-8LQFDMWNND",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// Función principal de reset nuclear
const nuclearReset = async () => {
  try {
    console.log('🚨 INICIANDO RESET NUCLEAR DEL SISTEMA...');
    console.log('⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos históricos');
    
    const results = {
      success: true,
      deleted: {},
      errors: []
    };

    // Colecciones a eliminar
    const collections = [
      'shifts', 'days', 'sales', 'expenses', 'purchases', 
      'inventory_movements', 'notifications', 'activity_logs', 'cash_counts'
    ];

    for (const collectionName of collections) {
      try {
        const deletedCount = await deleteAllFromCollection(collectionName);
        results.deleted[collectionName] = deletedCount;
        console.log(`✅ ${collectionName} eliminados: ${deletedCount}`);
      } catch (error) {
        results.errors.push({ collection: collectionName, error: error.message });
        console.error(`❌ Error eliminando ${collectionName}:`, error);
      }
    }

    // Calcular total de documentos eliminados
    const totalDeleted = Object.values(results.deleted).reduce((sum, count) => sum + count, 0);
    
    console.log('🎉 RESET NUCLEAR COMPLETADO');
    console.log(`📊 Total de documentos eliminados: ${totalDeleted}`);
    console.log('📋 Resumen:', results.deleted);
    
    if (results.errors.length > 0) {
      console.log('⚠️ Errores encontrados:', results.errors);
    }

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

// Ejecutar el reset nuclear
console.log('🚨 EJECUTANDO RESET NUCLEAR...');
nuclearReset().then(result => {
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
  process.exit(0);
}).catch(error => {
  console.error('❌ Error ejecutando reset nuclear:', error);
  process.exit(1);
});
