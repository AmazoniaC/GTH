import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './core/middlewares/error.middleware';
import { apiLimiter } from './core/middlewares/rate-limit.middleware';

/** Construye y configura la aplicación Express. */
export function createApp(): Application {
  const app = express();

  // Detrás de un proxy inverso (producción): confía en el primer salto para
  // que el limitador de tasa identifique la IP real del cliente.
  if (env.isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  // Límite amplio para permitir archivos adjuntos (base64) y fotos.
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());
  if (!env.isProduction) app.use(morgan('dev'));

  // Límite general de peticiones para toda la API.
  app.use(env.apiPrefix, apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
