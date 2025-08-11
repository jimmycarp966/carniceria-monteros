const admin = require('firebase-admin');
const serviceAccount = require('../credentials/service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const rtdb = admin.database();

async function forceDeleteAll() {
  console.log('💥 FORZANDO ELIMINACIÓN TOTAL DE TURNOS...');
  console.log('==========================================');
  
  try {
    // 1. ELIMINAR TODA LA COLECCIÓN DE TURNOS
    console.log('\n💥 1. ELIMINANDO TODA LA COLECCIÓN DE TURNOS...');
    
    let batch = db.batch();
    let batchCount = 0;
    const batchSize = 500;
    
    const shiftsSnapshot = await db.collection('shifts').get();
    console.log(`📊 Encontrados ${shiftsSnapshot.size} turnos para eliminar`);
    
    shiftsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      batchCount++;
      
      if (batchCount >= batchSize) {
        console.log(`🗑️ Ejecutando batch de ${batchCount} eliminaciones...`);
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    });
    
    if (batchCount > 0) {
      console.log(`🗑️ Ejecutando batch final de ${batchCount} eliminaciones...`);
      await batch.commit();
    }
    
    // 2. LIMPIAR RTDB COMPLETAMENTE
    console.log('\n💥 2. LIMPIANDO RTDB COMPLETAMENTE...');
    try {
      await rtdb.ref().remove();
      console.log('✅ RTDB completamente eliminado');
    } catch (error) {
      console.warn('⚠️ Error limpiando RTDB:', error.message);
    }
    
    // 3. VERIFICAR Y FORZAR ELIMINACIÓN INDIVIDUAL
    console.log('\n💥 3. VERIFICANDO Y FORZANDO ELIMINACIÓN...');
    
    // Esperar un momento para que se procesen las eliminaciones
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verifySnapshot = await db.collection('shifts').get();
    console.log(`📊 Turnos restantes después del batch: ${verifySnapshot.size}`);
    
    if (verifySnapshot.size > 0) {
      console.log('💥 FORZANDO ELIMINACIÓN INDIVIDUAL...');
      
      for (const doc of verifySnapshot.docs) {
        try {
          await doc.ref.delete();
          console.log(`✅ Forzado eliminado: ${doc.id}`);
        } catch (error) {
          console.error(`❌ Error forzando eliminación de ${doc.id}:`, error.message);
        }
      }
    }
    
    // 4. VERIFICACIÓN FINAL MÚLTIPLE
    console.log('\n🔍 4. VERIFICACIÓN FINAL MÚLTIPLE...');
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n📋 Verificación ${i + 1}/3...`);
      
      const finalSnapshot = await db.collection('shifts').get();
      console.log(`📊 Turnos restantes: ${finalSnapshot.size}`);
      
      if (finalSnapshot.size === 0) {
        console.log('✅ ¡VERIFICACIÓN EXITOSA! No quedan turnos.');
        break;
      } else {
        console.log('⚠️ Aún quedan turnos, esperando...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 5. VERIFICAR RTDB
    console.log('\n🔍 5. VERIFICANDO RTDB...');
    try {
      const rtdbSnapshot = await rtdb.ref().once('value');
      console.log(`📊 RTDB tiene datos: ${rtdbSnapshot.exists() ? 'SÍ' : 'NO'}`);
    } catch (error) {
      console.log('📊 RTDB: Error en verificación');
    }
    
    // 6. RESULTADO FINAL
    const finalCheck = await db.collection('shifts').get();
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('==================');
    console.log(`📊 Turnos restantes en Firestore: ${finalCheck.size}`);
    
    if (finalCheck.size === 0) {
      console.log('\n🎉 ¡ELIMINACIÓN FORZADA EXITOSA!');
      console.log('🚀 El sistema está completamente limpio.');
      console.log('✨ Puedes abrir un nuevo turno sin problemas.');
    } else {
      console.log('\n💥 ADVERTENCIA: Aún quedan turnos persistentes');
      console.log('🔧 Considera usar la consola del navegador con resetAllShifts()');
    }
    
  } catch (error) {
    console.error('💥 ERROR EN ELIMINACIÓN FORZADA:', error.message);
  } finally {
    console.log('\n🔄 Finalizando proceso...');
    process.exit(0);
  }
}

// Ejecutar la eliminación forzada
forceDeleteAll();
