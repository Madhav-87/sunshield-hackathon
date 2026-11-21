import { Router } from 'express';
import type { AppDependencies } from '../types/index.js';

export function createApiRouter(dependencies: AppDependencies = {}) {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ status: 'UP', application: 'SunShield', version: '1.0.0' });
  });
  return router;
}

