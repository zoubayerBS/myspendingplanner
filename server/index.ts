import 'dotenv/config';
import { app, initDB } from './app';

const PORT = process.env.PORT || 3001;

async function start() {
  await initDB();
  console.log('Database initialized');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
