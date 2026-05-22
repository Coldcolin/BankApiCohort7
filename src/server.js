import express from 'express';

function createFallbackApp(message) {
  const app = express();

  app.all('*', (_req, res) => {
    res.status(503).json({
      message,
      code: 'CONFIG_ERROR',
    });
  });

  return app;
}

let app;

try {
  const { createApp } = await import('./app.js');
  app = createApp();
} catch (err) {
  console.error('Failed to initialize app:', err);

  const message =
    err.message === 'Invalid environment variables'
      ? 'Server misconfigured: set DATABASE_URL and JWT_SECRET in Vercel environment variables, then redeploy.'
      : err.message || 'Server failed to start';

  app = createFallbackApp(message);
}

export default app;
