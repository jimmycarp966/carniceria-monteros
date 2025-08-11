const admin = require('firebase-admin');
const serviceAccount = require('../credentials/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function killAllShifts() {
  console.log('💀 ELIMINANDO TODOS LOS TURNOS Y DATOS RELACIONADOS...');
  
  try {
    // 1. ELIMINAR TODOS LOS TURNOS
    console.log('\n🗑️ 1. ELIMINANDO TURNOS...');
    const shiftsSnapshot = await db.collection('shifts').get();
    console.log(`📊 Encontrados ${shiftsSnapshot.size} turnos`);
    
    let shiftsDeleted = 0;
    for (const doc of shiftsSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Turno eliminado: ${doc.id}`);
        shiftsDeleted++;
      } catch (error) {
        console.error(`❌ Error eliminando turno ${doc.id}:`, error.message);
      }
    }
    
    // 2. ELIMINAR TODOS LOS GASTOS
    console.log('\n🗑️ 2. ELIMINANDO GASTOS...');
    const expensesSnapshot = await db.collection('expenses').get();
    console.log(`📊 Encontrados ${expensesSnapshot.size} gastos`);
    
    let expensesDeleted = 0;
    for (const doc of expensesSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Gasto eliminado: ${doc.id}`);
        expensesDeleted++;
      } catch (error) {
        console.error(`❌ Error eliminando gasto ${doc.id}:`, error.message);
      }
    }
    
    // 3. ELIMINAR HISTORIAL DE CAJAS (CASH_COUNTS)
    console.log('\n🗑️ 3. ELIMINANDO HISTORIAL DE CAJAS...');
    const cashCountsSnapshot = await db.collection('cash_counts').get();
    console.log(`📊 Encontrados ${cashCountsSnapshot.size} arqueos de caja`);
    
    let cashCountsDeleted = 0;
    for (const doc of cashCountsSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Arqueo de caja eliminado: ${doc.id}`);
        cashCountsDeleted++;
      } catch (error) {
        console.error(`❌ Error eliminando arqueo ${doc.id}:`, error.message);
      }
    }
    
    // 4. ELIMINAR DÍAS
    console.log('\n🗑️ 4. ELIMINANDO DÍAS...');
    const daysSnapshot = await db.collection('days').get();
    console.log(`📊 Encontrados ${daysSnapshot.size} días`);
    
    let daysDeleted = 0;
    for (const doc of daysSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Día eliminado: ${doc.id}`);
        daysDeleted++;
      } catch (error) {
        console.error(`❌ Error eliminando día ${doc.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 RESUMEN DE ELIMINACIÓN:`);
    console.log(`✅ Turnos eliminados: ${shiftsDeleted}`);
    console.log(`✅ Gastos eliminados: ${expensesDeleted}`);
    console.log(`✅ Arqueos de caja eliminados: ${cashCountsDeleted}`);
    console.log(`✅ Días eliminados: ${daysDeleted}`);
    
    // Verificación final
    const finalShiftsCheck = await db.collection('shifts').get();
    const finalExpensesCheck = await db.collection('expenses').get();
    const finalCashCountsCheck = await db.collection('cash_counts').get();
    const finalDaysCheck = await db.collection('days').get();
    
    console.log(`\n📊 VERIFICACIÓN FINAL:`);
    console.log(`📊 Turnos restantes: ${finalShiftsCheck.size}`);
    console.log(`📊 Gastos restantes: ${finalExpensesCheck.size}`);
    console.log(`📊 Arqueos de caja restantes: ${finalCashCountsCheck.size}`);
    console.log(`📊 Días restantes: ${finalDaysCheck.size}`);
    
    if (finalShiftsCheck.size === 0 && finalExpensesCheck.size === 0 && 
        finalCashCountsCheck.size === 0 && finalDaysCheck.size === 0) {
      console.log('🎯 ¡SISTEMA COMPLETAMENTE LIMPIO!');
    } else {
      console.log('⚠️ Aún quedan datos en el sistema');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    process.exit(0);
  }
}

killAllShifts();
