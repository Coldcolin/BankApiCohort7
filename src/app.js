import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { getOpenapiSpec, getOpenapiSpecPath } from './config/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import transfersRoutes from './routes/transfers.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';

export function createApp() {
  const app = express();

  if (process.env.VERCEL) {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (process.env.VERCEL) {
    app.use('/api', async (_req, _res, next) => {
      try {
        await connectDb();
        next();
      } catch (err) {
        next(err);
      }
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const serverRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
    );
    const hash = crypto.createHash('sha256').update(serverRoot).digest('hex');
    const workspaceUuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;

    app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
      res.json({
        workspace: {
          root: serverRoot,
          uuid: workspaceUuid,
        },
      });
    });
  }

  app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
    try {
      swaggerUi.setup(getOpenapiSpec())(req, res, next);
    } catch (err) {
      next(err);
    }
  });
  app.get('/openapi.yaml', (_req, res, next) => {
    try {
      res.type('text/yaml').sendFile(getOpenapiSpecPath());
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/accounts', accountsRoutes);
  app.use('/api/v1/transfers', transfersRoutes);
  app.use('/api/v1/transactions', transactionsRoutes);

  app.use(errorHandler);

  return app;
}
