#!/usr/bin/env node

/**
 * Script de verificación de build
 * Ejecutar antes de hacer commit: node scripts/verify-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando verificación de build...\n');

try {
  // 1. Verificar que estamos en el directorio correcto
  if (!fs.existsSync('client/package.json')) {
    throw new Error('❌ No se encontró client/package.json. Ejecutar desde la raíz del proyecto.');
  }

  // 2. Instalar dependencias si es necesario
  console.log('📦 Verificando dependencias...');
  if (!fs.existsSync('client/node_modules')) {
    console.log('📦 Instalando dependencias...');
    execSync('cd client && npm install', { stdio: 'inherit' });
  }

  // 3. Ejecutar build
  console.log('🔨 Ejecutando build...');
  execSync('cd client && npm run build', { stdio: 'inherit' });

  // 4. Verificar que se creó la carpeta build
  if (!fs.existsSync('client/build')) {
    throw new Error('❌ No se creó la carpeta build');
  }

  // 5. Verificar archivos principales
  const requiredFiles = [
    'client/build/index.html',
    'client/build/static/js/main.js',
    'client/build/static/css/main.css'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`❌ Archivo requerido no encontrado: ${file}`);
    }
  }

  console.log('\n✅ Verificación completada exitosamente!');
  console.log('✅ El build está listo para producción');
  console.log('✅ Puedes hacer commit con seguridad');

} catch (error) {
  console.error('\n❌ Error en la verificación:');
  console.error(error.message);
  console.error('\n🔧 Soluciones:');
  console.error('1. Verificar que estás en el directorio correcto');
  console.error('2. Ejecutar: cd client && npm install');
  console.error('3. Verificar que no hay errores de ESLint');
  console.error('4. Revisar la consola para errores específicos');
  process.exit(1);
}
