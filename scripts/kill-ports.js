#!/usr/bin/env node

const { exec } = require('child_process');

function killPorts(ports) {
  console.log('🔍 Buscando procesos en puertos:', ports.join(', '));
  
  ports.forEach(port => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        console.log(`❌ Error buscando puerto ${port}:`, error.message);
        return;
      }
      
      if (stdout) {
        const lines = stdout.trim().split('\n');
        let found = false;
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            found = true;
            exec(`taskkill /f /pid ${pid}`, (err) => {
              if (err) {
                console.log(`❌ Error terminando proceso ${pid}:`, err.message);
              } else {
                console.log(`✅ Proceso ${pid} en puerto ${port} terminado`);
              }
            });
          }
        });
        
        if (!found) {
          console.log(`✅ Puerto ${port} ya está libre`);
        }
      } else {
        console.log(`✅ Puerto ${port} ya está libre`);
      }
    });
  });
}

// Obtener puertos de los argumentos o usar los por defecto
const args = process.argv.slice(2);
const ports = args.length > 0 ? args.map(port => parseInt(port)) : [3000, 4000];

killPorts(ports);

console.log('🎯 Comando ejecutado. Los procesos se están terminando...');
