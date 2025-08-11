const admin = require('firebase-admin');
const serviceAccount = require('../credentials/service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const rtdb = admin.database();

async function nuclearReset() {
  console.log('🚀 INICIANDO RESET NUCLEAR DE TURNOS...');
  console.log('=====================================');
  
  try {
    // 1. AUDITORÍA COMPLETA DE FIRESTORE
    console.log('\n📋 1. AUDITORÍA FIRESTORE...');
    const shiftsSnapshot = await db.collection('shifts').get();
    const firestoreShifts = [];
    
    shiftsSnapshot.forEach(doc => {
      firestoreShifts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Turnos en Firestore: ${firestoreShifts.length}`);
    firestoreShifts.forEach(shift => {
      console.log(`  - ${shift.id}: ${shift.employeeName} | ${shift.status} | ${shift.openTime}`);
    });
    
    // 2. AUDITORÍA REALTIME DATABASE
    console.log('\n📋 2. AUDITORÍA REALTIME DATABASE...');
    try {
      const rtdbSnapshot = await rtdb.ref('shifts').once('value');
      if (rtdbSnapshot.exists()) {
        const rtdbShifts = rtdbSnapshot.val();
        const rtdbKeys = Object.keys(rtdbShifts || {});
        console.log(`📊 Turnos en RTDB: ${rtdbKeys.length}`);
        rtdbKeys.forEach(id => {
          const data = rtdbShifts[id];
          console.log(`  - ${id}: ${data.employeeName} | ${data.status}`);
        });
      } else {
        console.log('📊 No hay turnos en RTDB');
      }
    } catch (error) {
      console.log('📊 Error accediendo a RTDB:', error.message);
    }
    
    // 3. BORRAR TODOS LOS TURNOS DE FIRESTORE
    console.log('\n🗑️ 3. BORRANDO TODOS LOS TURNOS DE FIRESTORE...');
    let firestoreDeleted = 0;
    for (const shift of firestoreShifts) {
      try {
        await db.collection('shifts').doc(shift.id).delete();
        console.log(`✅ Firestore borrado: ${shift.id}`);
        firestoreDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando ${shift.id}:`, error.message);
      }
    }
    
    // 4. LIMPIAR COMPLETAMENTE REALTIME DATABASE
    console.log('\n🗑️ 4. LIMPIANDO REALTIME DATABASE...');
    try {
      await rtdb.ref('shifts').remove();
      console.log('✅ RTDB completamente limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando RTDB:', error.message);
    }
    
    // 5. BUSCAR Y BORRAR TURNOS EN OTRAS COLECCIONES
    console.log('\n🔍 5. BUSCANDO TURNOS EN OTRAS COLECCIONES...');
    
    // Buscar en ventas que referencien turnos
    const salesSnapshot = await db.collection('sales').get();
    const salesWithShifts = [];
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      if (sale.shiftId) {
        salesWithShifts.push({ id: doc.id, shiftId: sale.shiftId });
      }
    });
    
    console.log(`📊 Ventas con referencias a turnos: ${salesWithShifts.length}`);
    if (salesWithShifts.length > 0) {
      console.log('🗑️ Limpiando referencias de turnos en ventas...');
      for (const sale of salesWithShifts) {
        try {
          await db.collection('sales').doc(sale.id).update({
            shiftId: null,
            shiftReference: null
          });
          console.log(`✅ Venta ${sale.id} limpiada`);
        } catch (error) {
          console.error(`❌ Error limpiando venta ${sale.id}:`, error.message);
        }
      }
    }
    
    // 6. VERIFICAR COLECCIONES ADICIONALES
    console.log('\n🔍 6. VERIFICANDO COLECCIONES ADICIONALES...');
    const collectionsToCheck = ['income', 'expenses', 'inventory_movements'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const docsWithShifts = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.shiftId || data.shiftReference) {
            docsWithShifts.push({ id: doc.id, shiftId: data.shiftId, shiftReference: data.shiftReference });
          }
        });
        
        if (docsWithShifts.length > 0) {
          console.log(`📊 ${collectionName}: ${docsWithShifts.length} documentos con referencias a turnos`);
          console.log(`🗑️ Limpiando referencias en ${collectionName}...`);
          
          for (const doc of docsWithShifts) {
            try {
              await db.collection(collectionName).doc(doc.id).update({
                shiftId: null,
                shiftReference: null
              });
              console.log(`✅ ${collectionName} ${doc.id} limpiado`);
            } catch (error) {
              console.error(`❌ Error limpiando ${collectionName} ${doc.id}:`, error.message);
            }
          }
        } else {
          console.log(`📊 ${collectionName}: Sin referencias a turnos`);
        }
      } catch (error) {
        console.log(`📊 ${collectionName}: Error accediendo - ${error.message}`);
      }
    }
    
    // 7. VERIFICACIÓN FINAL
    console.log('\n🔍 7. VERIFICACIÓN FINAL...');
    
    // Verificar Firestore
    const finalFirestoreSnapshot = await db.collection('shifts').get();
    console.log(`📊 Turnos restantes en Firestore: ${finalFirestoreSnapshot.size}`);
    
    // Verificar RTDB
    try {
      const finalRtdbSnapshot = await rtdb.ref('shifts').once('value');
      console.log(`📊 Turnos restantes en RTDB: ${finalRtdbSnapshot.exists() ? 'SÍ' : 'NO'}`);
    } catch (error) {
      console.log('📊 RTDB: Error en verificación final');
    }
    
    // 8. RESULTADOS FINALES
    console.log('\n🎉 RESULTADOS DEL RESET NUCLEAR:');
    console.log('================================');
    console.log(`✅ Turnos borrados de Firestore: ${firestoreDeleted}`);
    console.log(`✅ RTDB completamente limpiado`);
    console.log(`✅ Referencias limpiadas en ventas: ${salesWithShifts.length}`);
    console.log(`✅ Verificación final: ${finalFirestoreSnapshot.size} turnos restantes`);
    
    if (finalFirestoreSnapshot.size === 0) {
      console.log('\n🎯 ¡RESET NUCLEAR COMPLETADO EXITOSAMENTE!');
      console.log('🚀 El sistema está completamente limpio y listo para un nuevo turno.');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Aún quedan turnos en el sistema');
    }
    
  } catch (error) {
    console.error('💥 ERROR EN RESET NUCLEAR:', error.message);
  } finally {
    console.log('\n🔄 Finalizando proceso...');
    process.exit(0);
  }
}

// Ejecutar el reset nuclear
nuclearReset();
