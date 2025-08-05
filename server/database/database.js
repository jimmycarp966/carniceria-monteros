const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'carniceria.db');
const db = new sqlite3.Database(dbPath);

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de usuarios
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'empleado',
        sucursal_id INTEGER,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabla de sucursales
      db.run(`CREATE TABLE IF NOT EXISTS sucursales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        direccion TEXT,
        telefono TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabla de categorías
      db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabla de proveedores
      db.run(`CREATE TABLE IF NOT EXISTS proveedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        contacto TEXT,
        telefono TEXT,
        email TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabla de productos
      db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        categoria_id INTEGER,
        proveedor_id INTEGER,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
      )`);

      // Tabla de inventario
      db.run(`CREATE TABLE IF NOT EXISTS inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sucursal_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        stock_actual INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 5,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
        FOREIGN KEY (producto_id) REFERENCES productos (id),
        UNIQUE(sucursal_id, producto_id)
      )`);

      // Tabla de clientes
      db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        direccion TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabla de ventas
      db.run(`CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sucursal_id INTEGER NOT NULL,
        cliente_id INTEGER,
        empleado_id INTEGER NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        metodo_pago TEXT DEFAULT 'efectivo',
        estado TEXT DEFAULT 'completada',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
        FOREIGN KEY (cliente_id) REFERENCES clientes (id),
        FOREIGN KEY (empleado_id) REFERENCES usuarios (id)
      )`);

      // Tabla de detalles de venta
      db.run(`CREATE TABLE IF NOT EXISTS detalles_venta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas (id),
        FOREIGN KEY (producto_id) REFERENCES productos (id)
      )`);

      // Tabla de movimientos de inventario
      db.run(`CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sucursal_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        motivo TEXT,
        usuario_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
        FOREIGN KEY (producto_id) REFERENCES productos (id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`);

      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

const insertInitialData = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insertar sucursales
      db.run(`INSERT OR IGNORE INTO sucursales (id, nombre, direccion, telefono) VALUES 
        (1, 'Sucursal Centro', 'Av. Principal 123, Monteros', '0381-1234567'),
        (2, 'Sucursal Norte', 'Calle Norte 456, Monteros', '0381-7654321')`);

      // Insertar categorías
      db.run(`INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES 
        (1, 'Carnes Rojas', 'Res, cerdo, cordero'),
        (2, 'Carnes Blancas', 'Pollo, pavo'),
        (3, 'Embutidos', 'Salchichas, chorizos, jamones'),
        (4, 'Preparados', 'Hamburguesas, milanesas')`);

      // Insertar proveedores
      db.run(`INSERT OR IGNORE INTO proveedores (id, nombre, contacto, telefono, email) VALUES 
        (1, 'Carnes Monteros S.A.', 'Juan Pérez', '0381-1111111', 'juan@carnesmonteros.com'),
        (2, 'Distribuidora Norte', 'María González', '0381-2222222', 'maria@distribuidoranorte.com')`);

      // Insertar admin user
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, email, password, rol, sucursal_id) VALUES 
        (1, 'Administrador', 'admin@carniceria.com', '${hashedPassword}', 'admin', 1)`);

      db.run("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Base de datos inicializada correctamente');
          resolve();
        }
      });
    });
  });
};

const initDatabase = async () => {
  try {
    await createTables();
    await insertInitialData();
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
};

module.exports = { db, initDatabase }; 