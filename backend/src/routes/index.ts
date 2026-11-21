import { Router } from 'express';
import type { AppDependencies } from '../types/index.js';
import { heatRoutes } from './heat.routes.js';
import { protectionRoutes } from './protection.routes.js';
import { simulationRoutes } from './simulation.routes.js';

export function createApiRouter(dependencies: AppDependencies = {}) {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ status: 'UP', application: 'SunShield', version: '1.0.0' });
  });
  router.use('/heat', heatRoutes(dependencies));
  router.use('/protection', protectionRoutes(dependencies));
  router.use('/simulation', simulationRoutes(dependencies));
  return router;
}
