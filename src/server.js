const { buildApp } = require('./app');
const { initDb } = require('./db');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function start() {
  // Retry DB init for a short window so the container can start
  // before Postgres is fully ready (compose healthchecks help too).
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await initDb();
      console.log('Database initialized.');
      break;
    } catch (err) {
      console.log(`DB init attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const app = buildApp();
  app.listen(PORT, () => console.log(`Taskly listening on port ${PORT}`));
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
