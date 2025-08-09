const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Inicializar base de datos
const { initDatabase } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando servidor de Carnicería Monteros...');
console.log('📊 Entorno:', process.env.NODE_ENV);
console.log('🔧 Puerto:', PORT);
console.log('🔐 Admin creds inline:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
console.log('🔐 Admin creds b64:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_B64);
console.log('🔐 Admin creds path:', process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH || 'N/A');

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Inicializar Firebase Admin para custom claims
let admin;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    let serviceAccount = null;
    const jsonInline = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const jsonB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
    const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
    const fallbackPath = path.join(__dirname, 'credentials', 'service-account.json');

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

    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('✅ Firebase Admin inicializado');
    } else {
      console.warn('⚠️ Credenciales de Firebase Admin no encontradas; endpoints de claims no estarán activos.');
    }
  }
} catch (e) {
  console.warn('⚠️ Firebase Admin no disponible:', e.message);
}

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rutas básicas
app.get('/api/health', (req, res) => {
  console.log('✅ Health check solicitado');
  res.json({ 
    status: 'OK', 
    message: 'Sistema de Carnicería Monteros funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint solicitado');
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba simple para login
app.post('/api/auth/test-login', (req, res) => {
  console.log('🔐 Test login solicitado:', req.body);
  
  const { email, password } = req.body;
  
  // Credenciales de prueba
  if (email === 'admin@carniceria.com' && password === 'admin123') {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';
    
    const token = jwt.sign(
      { 
        id: 1, 
        email: email, 
        rol: 'admin',
        sucursal_id: 1
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Test login exitoso para:', email);

    res.json({
      token,
      user: {
        id: 1,
        nombre: 'Administrador',
        email: email,
        rol: 'admin',
        sucursal_id: 1
      }
    });
  } else {
    console.log('❌ Test login fallido para:', email);
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Endpoint para asignar custom claims (Firebase Admin)
app.post('/api/admin/set-claims', async (req, res) => {
  try {
    if (!admin || !admin.apps || !admin.apps.length) {
      return res.status(500).json({ error: 'Firebase Admin no inicializado' });
    }
    const { email, role, permissions } = req.body;
    if (!email) return res.status(400).json({ error: 'email requerido' });

    const userRecord = await admin.auth().getUserByEmail(email);

    const claims = {};
    if (role) claims.role = role;
    if (Array.isArray(permissions)) {
      claims.permissions = permissions.reduce((acc, p) => { acc[p] = true; return acc; }, {});
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, claims);
    res.json({ ok: true, uid: userRecord.uid, claims });
  } catch (error) {
    console.error('❌ Error asignando claims:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para leer custom claims por email
app.get('/api/admin/get-claims', async (req, res) => {
  try {
    if (!admin || !admin.apps || !admin.apps.length) {
      return res.status(500).json({ error: 'Firebase Admin no inicializado' });
    }
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email requerido' });

    const userRecord = await admin.auth().getUserByEmail(email);
    res.json({ uid: userRecord.uid, customClaims: userRecord.customClaims || {} });
  } catch (error) {
    console.error('❌ Error obteniendo claims:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de autenticación
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login solicitado:', req.body);
  
  try {
    const { email, password } = req.body;
    const { db } = require('./database/database');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';

    db.get(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email],
      async (err, user) => {
        if (err) {
          console.error('❌ Error en base de datos:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (!user) {
          console.log('❌ Usuario no encontrado:', email);
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('👤 Usuario encontrado:', user.email);

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          console.log('❌ Contraseña inválida para:', email);
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('✅ Login exitoso para:', email);

        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            rol: user.rol,
            sucursal_id: user.sucursal_id
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            sucursal_id: user.sucursal_id
          }
        });
      }
    );
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Ruta para obtener datos del dashboard
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const { db } = require('./database/database');
  
  db.get('SELECT COUNT(*) as total FROM productos WHERE activo = 1', (err, productos) => {
    if (err) {
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    db.get('SELECT COUNT(*) as total FROM ventas WHERE DATE(created_at) = DATE("now")', (err, ventas) => {
      if (err) {
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      db.get('SELECT COUNT(*) as total FROM clientes WHERE activo = 1', (err, clientes) => {
        if (err) {
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        res.json({
          productos: productos.total,
          ventas_hoy: ventas.total,
          clientes: clientes.total,
          sucursales: 2
        });
      });
    });
  });
});

// Servir archivos estáticos en producción
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal en el servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Sistema de Administración de Carnicería Monteros`);
  console.log(`📍 Sucursales: Centro y Norte`);
  
  // Inicializar base de datos
  initDatabase();
}); 