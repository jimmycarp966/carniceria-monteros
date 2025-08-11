const admin = require('firebase-admin');
const serviceAccount = require('../credentials/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const rtdb = admin.database();

async function completeShiftReset() {
  console.log('🚀 RESET COMPLETO DE TURNOS - LIMPIEZA TOTAL');
  console.log('============================================');
  
  try {
    // 1. AUDITORÍA INICIAL
    console.log('\n📋 1. AUDITORÍA INICIAL...');
    const shiftsSnapshot = await db.collection('shifts').get();
    const initialShifts = [];
    
    shiftsSnapshot.forEach(doc => {
      initialShifts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Turnos encontrados inicialmente: ${initialShifts.length}`);
    initialShifts.forEach(shift => {
      console.log(`  - ${shift.id}: ${shift.employeeName} | ${shift.status} | ${shift.openTime}`);
    });
    
    // 2. BORRAR TODOS LOS TURNOS DE FIRESTORE
    console.log('\n🗑️ 2. BORRANDO TURNOS DE FIRESTORE...');
    let firestoreDeleted = 0;
    
    for (const shift of initialShifts) {
      try {
        await db.collection('shifts').doc(shift.id).delete();
        console.log(`✅ Firestore borrado: ${shift.id}`);
        firestoreDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando ${shift.id}:`, error.message);
      }
    }
    
    // 3. LIMPIAR REALTIME DATABASE
    console.log('\n🗑️ 3. LIMPIANDO REALTIME DATABASE...');
    try {
      await rtdb.ref('shifts').remove();
      console.log('✅ RTDB completamente limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando RTDB:', error.message);
    }
    
    // 4. LIMPIAR REFERENCIAS EN VENTAS
    console.log('\n🔍 4. LIMPIANDO REFERENCIAS EN VENTAS...');
    const salesSnapshot = await db.collection('sales').get();
    const salesWithShifts = [];
    
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      if (sale.shiftId || sale.shiftReference) {
        salesWithShifts.push({ 
          id: doc.id, 
          shiftId: sale.shiftId, 
          shiftReference: sale.shiftReference 
        });
      }
    });
    
    console.log(`📊 Ventas con referencias a turnos: ${salesWithShifts.length}`);
    let salesCleaned = 0;
    
    for (const sale of salesWithShifts) {
      try {
        await db.collection('sales').doc(sale.id).update({
          shiftId: null,
          shiftReference: null,
          shiftData: null
        });
        console.log(`✅ Venta ${sale.id} limpiada`);
        salesCleaned++;
      } catch (error) {
        console.error(`❌ Error limpiando venta ${sale.id}:`, error.message);
      }
    }
    
    // 5. LIMPIAR REFERENCIAS EN OTRAS COLECCIONES
    console.log('\n🔍 5. LIMPIANDO OTRAS COLECCIONES...');
    const collectionsToCheck = [
      'income', 
      'expenses', 
      'inventory_movements', 
      'cash_counts',
      'days',
      'transactions',
      'payments',
      'refunds'
    ];
    
    let totalCleaned = 0;
    
    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const docsWithShifts = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.shiftId || data.shiftReference || data.shiftData) {
            docsWithShifts.push({ 
              id: doc.id, 
              shiftId: data.shiftId, 
              shiftReference: data.shiftReference,
              shiftData: data.shiftData
            });
          }
        });
        
        if (docsWithShifts.length > 0) {
          console.log(`📊 ${collectionName}: ${docsWithShifts.length} documentos con referencias`);
          
          for (const doc of docsWithShifts) {
            try {
              await db.collection(collectionName).doc(doc.id).update({
                shiftId: null,
                shiftReference: null,
                shiftData: null
              });
              console.log(`✅ ${collectionName} ${doc.id} limpiado`);
              totalCleaned++;
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
    
    // 6. VERIFICACIÓN FINAL
    console.log('\n🔍 6. VERIFICACIÓN FINAL...');
    
    // Verificar Firestore
    const finalShiftsSnapshot = await db.collection('shifts').get();
    console.log(`📊 Turnos restantes en Firestore: ${finalShiftsSnapshot.size}`);
    
    // Verificar RTDB
    try {
      const finalRtdbSnapshot = await rtdb.ref('shifts').once('value');
      console.log(`📊 Turnos restantes en RTDB: ${finalRtdbSnapshot.exists() ? 'SÍ' : 'NO'}`);
    } catch (error) {
      console.log('📊 RTDB: Error en verificación final');
    }
    
    // Verificar ventas limpias
    const finalSalesSnapshot = await db.collection('sales').get();
    const remainingSalesWithShifts = [];
    finalSalesSnapshot.forEach(doc => {
      const sale = doc.data();
      if (sale.shiftId || sale.shiftReference) {
        remainingSalesWithShifts.push(doc.id);
      }
    });
    console.log(`📊 Ventas con referencias restantes: ${remainingSalesWithShifts.length}`);
    
    // 7. RESULTADOS FINALES
    console.log('\n🎉 RESULTADOS DEL RESET COMPLETO:');
    console.log('==================================');
    console.log(`✅ Turnos borrados de Firestore: ${firestoreDeleted}`);
    console.log(`✅ Realtime Database: LIMPIO`);
    console.log(`✅ Ventas limpiadas: ${salesCleaned}`);
    console.log(`✅ Otras colecciones limpiadas: ${totalCleaned}`);
    console.log(`✅ Verificación final: ${finalShiftsSnapshot.size} turnos restantes`);
    
    if (finalShiftsSnapshot.size === 0 && remainingSalesWithShifts.length === 0) {
      console.log('\n🎯 ¡RESET COMPLETO EXITOSO!');
      console.log('🚀 El sistema está completamente limpio y listo para nuevos turnos.');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Aún quedan referencias en el sistema');
      if (remainingSalesWithShifts.length > 0) {
        console.log('📋 Ventas con referencias restantes:', remainingSalesWithShifts);
      }
    }
    
  } catch (error) {
    console.error('💥 ERROR EN RESET COMPLETO:', error.message);
  } finally {
    console.log('\n🔄 Finalizando proceso...');
    process.exit(0);
  }
}

// Ejecutar el reset completo
completeShiftReset();
