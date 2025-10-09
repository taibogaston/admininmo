#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Función para matar procesos en puertos específicos
function killPorts(ports) {
  const { exec } = require('child_process');
  
  ports.forEach(port => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            exec(`taskkill /f /pid ${pid}`, (err) => {
              if (!err) {
                console.log(`✅ Proceso ${pid} en puerto ${port} terminado`);
              }
            });
          }
        });
      }
    });
  });
}

// Función para ejecutar comandos
function runCommand(command, args, cwd, name) {
  console.log(`🚀 Iniciando ${name}...`);
  
  const child = spawn(command, args, {
    cwd: cwd,
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    console.log(`📝 ${name} terminado con código ${code}`);
  });

  return child;
}

// Manejar señales de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando todos los procesos...');
  killPorts([3000, 4000]);
  setTimeout(() => {
    console.log('✅ Todos los procesos cerrados');
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando todos los procesos...');
  killPorts([3000, 4000]);
  setTimeout(() => {
    console.log('✅ Todos los procesos cerrados');
    process.exit(0);
  }, 1000);
});

// Verificar argumentos
const args = process.argv.slice(2);
const command = args[0];

if (command === 'web') {
  runCommand('npm', ['run', 'dev'], path.join(__dirname, '../apps/web'), 'Web App');
} else if (command === 'api') {
  runCommand('npm', ['run', 'dev'], path.join(__dirname, '../apps/api'), 'API Server');
} else if (command === 'both') {
  const apiProcess = runCommand('npm', ['run', 'dev'], path.join(__dirname, '../apps/api'), 'API Server');
  setTimeout(() => {
    runCommand('npm', ['run', 'dev'], path.join(__dirname, '../apps/web'), 'Web App');
  }, 2000);
} else {
  console.log('Uso: node scripts/dev.js [web|api|both]');
  console.log('  web  - Solo la aplicación web (puerto 3000)');
  console.log('  api  - Solo el servidor API (puerto 4000)');
  console.log('  both - Ambos servidores');
}
