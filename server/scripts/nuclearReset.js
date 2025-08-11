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
  console.log('🚀 INICIANDO RESET NUCLEAR COMPLETO...');
  console.log('=====================================');
  
  try {
    // Obtener fecha actual
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Fecha objetivo: ${today}`);
    
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
    
    // 3. AUDITORÍA DE VENTAS DEL DÍA
    console.log('\n📋 3. AUDITORÍA DE VENTAS DEL DÍA...');
    const salesSnapshot = await db.collection('sales').get();
    const todaySales = [];
    const allSales = [];
    
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      allSales.push({ id: doc.id, ...sale });
      
      // Verificar si la venta es del día actual
      const saleDate = sale.timestamp?.toDate?.()?.toISOString()?.split('T')[0] || 
                      sale.createdAt?.toDate?.()?.toISOString()?.split('T')[0];
      
      if (saleDate === today) {
        todaySales.push({ id: doc.id, ...sale });
      }
    });
    
    console.log(`📊 Ventas totales en el sistema: ${allSales.length}`);
    console.log(`📊 Ventas del día ${today}: ${todaySales.length}`);
    
    if (todaySales.length > 0) {
      console.log('📋 Detalles de ventas del día:');
      todaySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. ID: ${sale.id} | Total: $${sale.total} | Método: ${sale.paymentMethod} | Turno: ${sale.shiftId}`);
      });
    }
    
    // 4. BORRAR TODOS LOS TURNOS DE FIRESTORE
    console.log('\n🗑️ 4. BORRANDO TODOS LOS TURNOS DE FIRESTORE...');
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
    
    // 5. LIMPIAR COMPLETAMENTE REALTIME DATABASE
    console.log('\n🗑️ 5. LIMPIANDO REALTIME DATABASE...');
    try {
      await rtdb.ref('shifts').remove();
      console.log('✅ RTDB completamente limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando RTDB:', error.message);
    }
    
    // 6. BORRAR TODAS LAS VENTAS DEL DÍA
    console.log('\n🗑️ 6. BORRANDO TODAS LAS VENTAS DEL DÍA...');
    let salesDeleted = 0;
    for (const sale of todaySales) {
      try {
        await db.collection('sales').doc(sale.id).delete();
        console.log(`✅ Venta borrada: ${sale.id} | $${sale.total} | ${sale.paymentMethod}`);
        salesDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando venta ${sale.id}:`, error.message);
      }
    }
    
    // 6.1. BORRAR TODOS LOS GASTOS
    console.log('\n🗑️ 6.1. BORRANDO TODOS LOS GASTOS...');
    const expensesSnapshot = await db.collection('expenses').get();
    let expensesDeleted = 0;
    for (const doc of expensesSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Gasto borrado: ${doc.id}`);
        expensesDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando gasto ${doc.id}:`, error.message);
      }
    }
    
    // 6.2. BORRAR HISTORIAL DE CAJAS (CASH_COUNTS)
    console.log('\n🗑️ 6.2. BORRANDO HISTORIAL DE CAJAS...');
    const cashCountsSnapshot = await db.collection('cash_counts').get();
    let cashCountsDeleted = 0;
    for (const doc of cashCountsSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Arqueo de caja borrado: ${doc.id}`);
        cashCountsDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando arqueo ${doc.id}:`, error.message);
      }
    }
    
    // 6.3. BORRAR TODOS LOS DÍAS
    console.log('\n🗑️ 6.3. BORRANDO TODOS LOS DÍAS...');
    const daysSnapshot = await db.collection('days').get();
    let daysDeleted = 0;
    for (const doc of daysSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Día borrado: ${doc.id}`);
        daysDeleted++;
      } catch (error) {
        console.error(`❌ Error borrando día ${doc.id}:`, error.message);
      }
    }
    
    // 7. LIMPIAR REFERENCIAS EN OTRAS COLECCIONES
    console.log('\n🔍 7. LIMPIANDO REFERENCIAS EN OTRAS COLECCIONES...');
    
    // Buscar en ventas restantes que referencien turnos
    const remainingSalesSnapshot = await db.collection('sales').get();
    const salesWithShifts = [];
    remainingSalesSnapshot.forEach(doc => {
      const sale = doc.data();
      if (sale.shiftId) {
        salesWithShifts.push({ id: doc.id, shiftId: sale.shiftId });
      }
    });
    
    console.log(`📊 Ventas restantes con referencias a turnos: ${salesWithShifts.length}`);
    if (salesWithShifts.length > 0) {
      console.log('🗑️ Limpiando referencias de turnos en ventas restantes...');
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
    
    // Verificar otras colecciones
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
    
    // 8. VERIFICACIÓN FINAL
    console.log('\n🔍 8. VERIFICACIÓN FINAL...');
    
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
    
    // Verificar ventas del día
    const finalSalesSnapshot = await db.collection('sales').get();
    const finalTodaySales = [];
    finalSalesSnapshot.forEach(doc => {
      const sale = doc.data();
      const saleDate = sale.timestamp?.toDate?.()?.toISOString()?.split('T')[0] || 
                      sale.createdAt?.toDate?.()?.toISOString()?.split('T')[0];
      
      if (saleDate === today) {
        finalTodaySales.push({ id: doc.id, ...sale });
      }
    });
    
    console.log(`📊 Ventas restantes del día ${today}: ${finalTodaySales.length}`);
    
    // 9. RESULTADOS FINALES
    console.log('\n🎉 RESULTADOS DEL RESET NUCLEAR COMPLETO:');
    console.log('==========================================');
    console.log(`✅ Turnos borrados de Firestore: ${firestoreDeleted}`);
    console.log(`✅ RTDB completamente limpiado`);
    console.log(`✅ Ventas del día borradas: ${salesDeleted}`);
    console.log(`✅ Gastos borrados: ${expensesDeleted}`);
    console.log(`✅ Arqueos de caja borrados: ${cashCountsDeleted}`);
    console.log(`✅ Días borrados: ${daysDeleted}`);
    console.log(`✅ Referencias limpiadas en ventas restantes: ${salesWithShifts.length}`);
    console.log(`✅ Verificación final: ${finalFirestoreSnapshot.size} turnos restantes`);
    console.log(`✅ Verificación final: ${finalTodaySales.length} ventas del día restantes`);
    
    if (finalFirestoreSnapshot.size === 0 && finalTodaySales.length === 0) {
      console.log('\n🎯 ¡RESET NUCLEAR COMPLETO EXITOSAMENTE!');
      console.log('🚀 El sistema está completamente limpio y listo para un nuevo día.');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Aún quedan datos en el sistema');
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
