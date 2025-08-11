import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc } from 'firebase/firestore';

export const debugDaysCollection = async () => {
  try {
    console.log('🔍 Diagnóstico de la colección days...');
    
    // Verificar si hay días en la colección
    const daysRef = collection(db, 'days');
    const allDaysSnapshot = await getDocs(daysRef);
    
    console.log(`📊 Total de documentos en colección 'days': ${allDaysSnapshot.docs.length}`);
    
    if (allDaysSnapshot.docs.length === 0) {
      console.log('❌ No hay días registrados en la base de datos');
      console.log('💡 Esto puede deberse a:');
      console.log('   1. Nunca se ha finalizado un día');
      console.log('   2. Los días no se están creando correctamente');
      console.log('   3. Problema con las reglas de seguridad');
      return { hasDays: false, days: [] };
    }
    
    // Obtener días cerrados
    const closedDaysQuery = query(
      daysRef,
      where('status', '==', 'closed'),
      orderBy('closedAt', 'desc'),
      limit(10)
    );
    
    const closedDaysSnapshot = await getDocs(closedDaysQuery);
    console.log(`📋 Días cerrados encontrados: ${closedDaysSnapshot.docs.length}`);
    
    const days = closedDaysSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    days.forEach((day, index) => {
      console.log(`📅 Día ${index + 1}:`, {
        id: day.id,
        date: day.date,
        status: day.status,
        totalRevenue: day.totalRevenue,
        totalSales: day.totalSales,
        closedAt: day.closedAt?.toDate?.()?.toLocaleString() || 'N/A'
      });
    });
    
    return { hasDays: true, days };
    
  } catch (error) {
    console.error('❌ Error en diagnóstico de días:', error);
    return { hasDays: false, error: error.message };
  }
};

export const createTestDay = async () => {
  try {
    console.log('🧪 Creando día de prueba...');
    
    const testDayData = {
      date: new Date().toISOString().split('T')[0],
      totalRevenue: 150000,
      totalSales: 25,
      totalShifts: 2,
      totalExpenses: 50000,
      salesByPaymentMethod: {
        efectivo: 80000,
        tarjetaDebito: 40000,
        tarjetaCredito: 20000,
        transferencia: 10000,
        mercadopago: 0
      },
      shifts: [
        {
          id: 'test-shift-1',
          type: 'morning',
          employeeName: 'Test Employee',
          totalSales: 15,
          totalRevenue: 90000
        },
        {
          id: 'test-shift-2',
          type: 'afternoon',
          employeeName: 'Test Employee',
          totalSales: 10,
          totalRevenue: 60000
        }
      ],
      status: 'closed',
      closedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const daysRef = collection(db, 'days');
    const docRef = await addDoc(daysRef, testDayData);
    
    console.log('✅ Día de prueba creado con ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creando día de prueba:', error);
    throw error;
  }
};
