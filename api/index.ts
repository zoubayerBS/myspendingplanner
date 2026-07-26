import { app, initDB } from '../server/app';

let dbReady = false;

export default async function handler(req: any, res: any) {
  try {
    if (!dbReady) {
      await initDB();
      dbReady = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless function error:', err?.message, err?.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Internal server error' });
    }
  }
}
