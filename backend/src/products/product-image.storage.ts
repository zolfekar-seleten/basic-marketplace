import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface UploadedProductImage {
  buffer: Buffer;
  mimetype: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SIGNATURES = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    test: (b: Buffer) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    test: (b: Buffer) =>
      b.length >= 8 &&
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    test: (b: Buffer) =>
      b.length >= 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
];

@Injectable()
export class ProductImageStorage {
  private readonly logger = new Logger(ProductImageStorage.name);
  readonly directory = resolve(process.cwd(), 'uploads', 'products');

  async save(file: UploadedProductImage): Promise<string> {
    if (
      !file?.buffer ||
      file.buffer.length === 0 ||
      file.buffer.length > MAX_IMAGE_SIZE
    ) {
      throw new BadRequestException(
        'Image must be a non-empty file no larger than 5 MB',
      );
    }

    const detected = SIGNATURES.find((signature) =>
      signature.test(file.buffer),
    );
    if (!detected || file.mimetype !== detected.mime) {
      throw new BadRequestException(
        'Only valid JPEG, PNG, and WebP images are allowed',
      );
    }

    await mkdir(this.directory, { recursive: true });
    const filename = `image-${randomUUID()}.${detected.extension}`;
    await writeFile(join(this.directory, filename), file.buffer, {
      flag: 'wx',
      mode: 0o600,
    });
    return `/uploads/products/${filename}`;
  }

  async removeManaged(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const match =
      /^\/uploads\/products\/(image-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp))$/i.exec(
        url,
      );
    if (!match) return;

    const filepath = resolve(this.directory, match[1]);
    if (dirname(filepath) !== this.directory) return;
    try {
      await unlink(filepath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Could not remove managed product image: ${match[1]}`);
      }
    }
  }

  async removeAfterFailure(url: string | null | undefined): Promise<void> {
    try {
      await this.removeManaged(url);
    } catch {
      // Preserve the original database or application error.
    }
  }
}
