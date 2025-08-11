// Script de diagnóstico para verificar la configuración de Firebase
import { auth, db, realtimeDb } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { ref, get } from 'firebase/database';

export const firebaseDiagnostic = {
  async runFullDiagnostic() {
    console.log('🔍 Iniciando diagnóstico completo de Firebase...');
    
    const results = {
      firestore: false,
      auth: false,
      realtimeDatabase: false,
      collections: [],
      errors: []
    };

    try {
      // 1. Verificar Firestore
      console.log('📊 Verificando Firestore...');
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, limit(1));
      await getDocs(productsQuery); // eslint-disable-line no-unused-vars
      results.firestore = true;
      console.log('✅ Firestore conectado correctamente');
      
      // 2. Verificar colecciones existentes
      const collections = ['products', 'sales', 'shifts', 'customers', 'employees', 'inventory'];
      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(query(collectionRef, limit(1)));
          results.collections.push({
            name: collectionName,
            exists: true,
            count: snapshot.size
          });
        } catch (error) {
          results.collections.push({
            name: collectionName,
            exists: false,
            error: error.message
          });
        }
      }

      // 3. Verificar Authentication
      console.log('🔐 Verificando Authentication...');
      const currentUser = auth.currentUser;
      results.auth = true;
      console.log('✅ Authentication configurado correctamente');
      if (currentUser) {
        console.log('👤 Usuario autenticado:', currentUser.email);
      } else {
        console.log('👤 No hay usuario autenticado');
      }

      // 4. Verificar Realtime Database
      console.log('⚡ Verificando Realtime Database...');
      try {
        const statsRef = ref(realtimeDb, 'stats');
        await get(statsRef);
        results.realtimeDatabase = true;
        console.log('✅ Realtime Database conectado correctamente');
      } catch (error) {
        results.realtimeDatabase = false;
        results.errors.push(`Realtime Database: ${error.message}`);
        console.log('❌ Error en Realtime Database:', error.message);
      }

    } catch (error) {
      results.errors.push(`Error general: ${error.message}`);
      console.error('❌ Error en diagnóstico:', error);
    }

    // Mostrar resumen
    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log('========================');
    console.log(`Firestore: ${results.firestore ? '✅ OK' : '❌ ERROR'}`);
    console.log(`Authentication: ${results.auth ? '✅ OK' : '❌ ERROR'}`);
    console.log(`Realtime Database: ${results.realtimeDatabase ? '✅ OK' : '❌ ERROR'}`);
    
    console.log('\n📁 Colecciones:');
    results.collections.forEach(col => {
      console.log(`  ${col.name}: ${col.exists ? '✅ Existe' : '❌ No existe'} ${col.count ? `(${col.count} docs)` : ''}`);
    });

    if (results.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  },

  async testDataOperations() {
    console.log('\n🧪 Probando operaciones de datos...');
    
    try {
      // Test 1: Leer productos
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(query(productsRef, limit(5)));
      console.log(`✅ Leídos ${productsSnapshot.size} productos`);

      // Test 2: Leer turnos
      const shiftsRef = collection(db, 'shifts');
      const shiftsSnapshot = await getDocs(query(shiftsRef, limit(5)));
      console.log(`✅ Leídos ${shiftsSnapshot.size} turnos`);

      // Test 3: Leer ventas
      const salesRef = collection(db, 'sales');
      const salesSnapshot = await getDocs(query(salesRef, limit(5)));
      console.log(`✅ Leídas ${salesSnapshot.size} ventas`);

      return true;
    } catch (error) {
      console.error('❌ Error en operaciones de datos:', error);
      return false;
    }
  }
};

// Función para ejecutar desde la consola del navegador
window.firebaseDiagnostic = firebaseDiagnostic;
