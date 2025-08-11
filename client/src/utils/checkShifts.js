import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc } from 'firebase/firestore';

export const checkShiftsStatus = async () => {
  try {
    console.log('🔍 Verificando estado de turnos...');
    
    // Obtener todos los turnos
    const shiftsRef = collection(db, 'shifts');
    const allShiftsSnapshot = await getDocs(shiftsRef);
    
    console.log(`📊 Total de turnos en la base de datos: ${allShiftsSnapshot.docs.length}`);
    
    if (allShiftsSnapshot.docs.length === 0) {
      console.log('❌ No hay turnos registrados');
      return { hasShifts: false, shifts: [] };
    }
    
    const shifts = allShiftsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Analizar turnos por estado
    const activeShifts = shifts.filter(shift => shift.status === 'active');
    const closedShifts = shifts.filter(shift => shift.status === 'closed');
    const dayClosedShifts = shifts.filter(shift => shift.dayClosed === true);
    
    console.log(`🟢 Turnos activos: ${activeShifts.length}`);
    console.log(`🔴 Turnos cerrados: ${closedShifts.length}`);
    console.log(`📅 Turnos con día cerrado: ${dayClosedShifts.length}`);
    
    // Agrupar turnos por fecha
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const date = shift.date || (shift.startTime?.toDate?.()?.toISOString()?.split('T')[0]) || 'sin fecha';
      if (!shiftsByDate[date]) {
        shiftsByDate[date] = [];
      }
      shiftsByDate[date].push(shift);
    });
    
    console.log('\n📅 Turnos agrupados por fecha:');
    Object.entries(shiftsByDate).forEach(([date, dateShifts]) => {
      const morningShift = dateShifts.find(s => s.type === 'morning');
      const afternoonShift = dateShifts.find(s => s.type === 'afternoon');
      
      console.log(`\n${date}:`);
      console.log(`  Mañana: ${morningShift ? `${morningShift.status} (${morningShift.employeeName || 'sin empleado'})` : 'no existe'}`);
      console.log(`  Tarde: ${afternoonShift ? `${afternoonShift.status} (${afternoonShift.employeeName || 'sin empleado'})` : 'no existe'}`);
      
      if (morningShift && afternoonShift && 
          morningShift.status === 'closed' && afternoonShift.status === 'closed') {
        console.log(`  ✅ Ambos turnos cerrados - Día listo para finalizar`);
      } else {
        console.log(`  ❌ Día no listo para finalizar`);
      }
    });
    
    return {
      hasShifts: true,
      totalShifts: shifts.length,
      activeShifts: activeShifts.length,
      closedShifts: closedShifts.length,
      dayClosedShifts: dayClosedShifts.length,
      shiftsByDate
    };
    
  } catch (error) {
    console.error('❌ Error verificando turnos:', error);
    return { hasShifts: false, error: error.message };
  }
};

export const createTestShifts = async () => {
  try {
    console.log('🧪 Creando turnos de prueba...');
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const testShifts = [
      {
        type: 'morning',
        date: yesterday,
        employeeName: 'Test Employee',
        employeeId: 'test-employee-1',
        startTime: new Date(`${yesterday}T08:00:00`),
        endTime: new Date(`${yesterday}T14:00:00`),
        status: 'closed',
        dayClosed: true,
        totalSales: 15,
        totalRevenue: 90000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'afternoon',
        date: yesterday,
        employeeName: 'Test Employee',
        employeeId: 'test-employee-1',
        startTime: new Date(`${yesterday}T14:00:00`),
        endTime: new Date(`${yesterday}T20:00:00`),
        status: 'closed',
        dayClosed: true,
        totalSales: 10,
        totalRevenue: 60000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const shiftsRef = collection(db, 'shifts');
    const createdShifts = [];
    
    for (const shiftData of testShifts) {
      const docRef = await addDoc(shiftsRef, shiftData);
      createdShifts.push({ id: docRef.id, ...shiftData });
      console.log(`✅ Turno creado: ${docRef.id} (${shiftData.type})`);
    }
    
    return createdShifts;
    
  } catch (error) {
    console.error('❌ Error creando turnos de prueba:', error);
    throw error;
  }
};
