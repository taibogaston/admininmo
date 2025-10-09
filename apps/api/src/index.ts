import { createServer } from "./server";
import { env } from "./env";

const app = createServer();

const server = app.listen(env.API_PORT, () => {
  console.log(`API listening on port ${env.API_PORT}`);
});

// Manejar señales de cierre para cerrar el servidor correctamente
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor API...');
  server.close(() => {
    console.log('✅ Servidor API cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor API...');
  server.close(() => {
    console.log('✅ Servidor API cerrado correctamente');
    process.exit(0);
  });
});
