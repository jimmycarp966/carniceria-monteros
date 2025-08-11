const admin = require('firebase-admin');
const serviceAccount = require('../credentials/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function killAllShifts() {
  console.log('💀 ELIMINANDO TODOS LOS TURNOS...');
  
  try {
    // Obtener todos los turnos
    const snapshot = await db.collection('shifts').get();
    console.log(`📊 Encontrados ${snapshot.size} turnos`);
    
    if (snapshot.size === 0) {
      console.log('✅ No hay turnos para eliminar');
      return;
    }
    
    // Eliminar uno por uno
    let deleted = 0;
    for (const doc of snapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Eliminado: ${doc.id}`);
        deleted++;
      } catch (error) {
        console.error(`❌ Error eliminando ${doc.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 ${deleted} turnos eliminados`);
    
    // Verificación final
    const finalCheck = await db.collection('shifts').get();
    console.log(`📊 Turnos restantes: ${finalCheck.size}`);
    
    if (finalCheck.size === 0) {
      console.log('🎯 ¡SISTEMA LIMPIO!');
    } else {
      console.log('⚠️ Aún quedan turnos');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    process.exit(0);
  }
}

killAllShifts();
