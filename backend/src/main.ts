import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const uploadsDirectory = resolve(process.cwd(), 'uploads', 'products');
  await mkdir(uploadsDirectory, { recursive: true });
  app.use(
    '/uploads/products',
    express.static(uploadsDirectory, { fallthrough: false }),
  );

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configuredCorsOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedCorsOrigins = new Set(configuredCorsOrigins);
  const isDevelopment = configService.get<string>('NODE_ENV') === 'development';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedCorsOrigins.has(origin) || isDevelopment) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['X-Permissions-Version'],
    maxAge: 86400,
    optionsSuccessStatus: 204,
  });

  const port = Number(configService.get<string>('APP_PORT')) || 3000;

  await app.listen(port);
}
void bootstrap();
