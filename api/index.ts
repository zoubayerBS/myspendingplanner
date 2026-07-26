import { app, initDB } from '../server/app';

let dbReady = false;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    await initDB();
    dbReady = true;
  }
  return app(req, res);
}
