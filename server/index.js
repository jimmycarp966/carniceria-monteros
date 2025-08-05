const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Inicializar base de datos
const { initDatabase } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
  res.json({ 
    status: 'OK', 
    message: 'Sistema de Carnicería Monteros funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de autenticación
app.post('/api/auth/login', async (req, res) => {
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
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (!user) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

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