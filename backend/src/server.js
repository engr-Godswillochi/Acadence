import app from './app.js';
import { closeDatabasePool, verifyDatabaseConnection } from './config/database.js';
import { env, validateServerEnvironment } from './config/env.js';

let server;
let isShuttingDown = false;

async function shutDown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(`${signal} received. Closing the server.`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await closeDatabasePool();
}

async function startServer() {
  validateServerEnvironment();
  await verifyDatabaseConnection();

  server = app.listen(env.port, () => {
    console.info(`Acadence API listening on port ${env.port}.`);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutDown(signal)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Graceful shutdown failed.', error);
        process.exit(1);
      });
  });
}

startServer().catch((error) => {
  console.error('Unable to start the Acadence API.', error);
  process.exit(1);
});
