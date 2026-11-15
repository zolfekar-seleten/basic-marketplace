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

  app.enableCors({
    exposedHeaders: ['X-Permissions-Version'],
  });

  const port = Number(configService.get<string>('APP_PORT')) || 3000;

  await app.listen(port);
}
void bootstrap();
