const admin = require('firebase-admin');
const serviceAccount = require('../credentials/service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carniceria-monteros-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function deleteActiveShifts() {
  try {
    console.log('🔍 Buscando turnos activos...');
    
    // Obtener todos los turnos
    const shiftsSnapshot = await db.collection('shifts').get();
    const allShifts = [];
    
    shiftsSnapshot.forEach(doc => {
      allShifts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Total de turnos encontrados: ${allShifts.length}`);
    
    // Filtrar turnos activos
    const activeShifts = allShifts.filter(shift => 
      shift.status === 'active' || !shift.endTime
    );
    
    console.log(`📊 Turnos activos encontrados: ${activeShifts.length}`);
    
    if (activeShifts.length === 0) {
      console.log('✅ No hay turnos activos para borrar');
      return;
    }
    
    // Mostrar información de turnos activos
    activeShifts.forEach(shift => {
      console.log(`  - ${shift.id}: ${shift.employeeName} | ${shift.openTime} | ${shift.status}`);
    });
    
    // Borrar turnos activos
    console.log('🗑️ Borrando turnos activos...');
    let deletedCount = 0;
    
    for (const shift of activeShifts) {
      try {
        await db.collection('shifts').doc(shift.id).delete();
        console.log(`✅ Borrado: ${shift.id}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error borrando ${shift.id}:`, error.message);
      }
    }
    
    // También limpiar Realtime Database
    console.log('🗑️ Limpiando Realtime Database...');
    try {
      const rtdb = admin.database();
      await rtdb.ref('shifts').remove();
      console.log('✅ Realtime Database limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando Realtime Database:', error.message);
    }
    
    console.log(`🎉 ${deletedCount} turnos activos borrados exitosamente`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la función
deleteActiveShifts();
