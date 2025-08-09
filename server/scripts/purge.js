/*
  Script de purga de datos Firestore (usar con cuidado)
  - Elimina documentos de colecciones de la app
  - Conserva el empleado admin por email
  Uso:
    WINDOWS POWERSHELL (en carpeta server):
      $env:GOOGLE_APPLICATION_CREDENTIALS_PATH=(Resolve-Path .\credentials\service-account.json).Path; node scripts/purge.js
*/

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function initAdmin() {
  let serviceAccount = null;
  const jsonInline = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const jsonB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
  const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
  const fallbackPath = path.join(__dirname, '..', 'credentials', 'service-account.json');

  if (jsonInline) {
    serviceAccount = JSON.parse(jsonInline);
  } else if (jsonB64) {
    const decoded = Buffer.from(jsonB64, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
  } else if (jsonPath && fs.existsSync(jsonPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else if (fs.existsSync(fallbackPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  }

  if (!serviceAccount) {
    throw new Error('Credenciales de Firebase Admin no encontradas');
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

async function deleteCollection(db, collName, filterFn = null) {
  const batchSize = 300;
  const collRef = db.collection(collName);
  const snapshot = await collRef.get();
  let count = 0;

  const docs = snapshot.docs.filter((doc) => (filterFn ? filterFn(doc) : true));
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
    count += Math.min(batchSize, docs.length - i);
  }
  return count;
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const adminEmail = 'admin@carniceria.com';
  const tasks = [];

  const collections = [
    'products',
    'inventory',
    'inventory_movements',
    'sales',
    'expenses',
    'purchases',
    'customers',
    'suppliers',
    'categories',
    'shifts',
    'notifications',
    'activity_logs',
    'alerts'
  ];

  for (const coll of collections) {
    // borrar todo
    // eslint-disable-next-line no-await-in-loop
    const n = await deleteCollection(db, coll);
    console.log(`Purga ${coll}: ${n} documentos eliminados`);
  }

  // Empleados: eliminar todo excepto el admin
  const kept = await deleteCollection(db, 'employees', (doc) => {
    const data = doc.data() || {};
    return (data.email || '').toLowerCase() !== adminEmail;
  });
  console.log(`Purga employees (excepto admin): ${kept} documentos eliminados`);

  // Asegurar doc del admin exista con permisos amplios (si no existe)
  const employeesRef = db.collection('employees');
  const q = await employeesRef.where('email', '==', adminEmail).get();
  if (q.empty) {
    await employeesRef.add({
      name: 'Administrador',
      email: adminEmail,
      position: 'Administrador',
      status: 'active',
      permissions: ['admin'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Empleado admin creado');
  } else {
    console.log('Empleado admin preservado');
  }

  console.log('✅ Purga completada');
  process.exit(0);
}

main().catch((e) => {
  console.error('Error en purga:', e);
  process.exit(1);
});


