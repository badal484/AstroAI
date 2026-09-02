import { Router } from 'express';
import mongoose from 'mongoose';
import type { ApiSuccessResponse } from '@astroai/shared-types';
import { redis } from '../../lib/redis';

export const healthRouter = Router();

interface HealthPayload {
  status: 'ok';
  uptimeSeconds: number;
  dependencies: {
    mongo: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

healthRouter.get('/health', (req, res) => {
  const payload: HealthPayload = {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    dependencies: {
      mongo:
        mongoose.connection.readyState === mongoose.ConnectionStates.connected
          ? 'connected'
          : 'disconnected',
      redis: redis.status === 'ready' ? 'connected' : 'disconnected',
    },
  };

  const body: ApiSuccessResponse<HealthPayload> = {
    success: true,
    data: payload,
    requestId: req.requestId,
  };

  res.status(200).json(body);
});
