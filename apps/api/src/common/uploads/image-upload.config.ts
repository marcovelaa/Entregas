import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

export const IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DECLARED_MIME_ALLOWLIST = /^image\/(jpeg|png|webp|gif)$/;

type ImageSignature = {
  extension: string;
  matches: (header: Buffer) => boolean;
};

// Real (magic-byte) signatures — the declared Content-Type/mimetype is
// client-supplied and trivially spoofable, so it only fast-rejects obvious
// mismatches. This is what actually keeps an SVG/HTML upload from passing
// as a JPEG.
const IMAGE_SIGNATURES: ImageSignature[] = [
  {
    extension: '.jpg',
    matches: (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
  },
  {
    extension: '.png',
    matches: (h) =>
      h[0] === 0x89 &&
      h[1] === 0x50 &&
      h[2] === 0x4e &&
      h[3] === 0x47 &&
      h[4] === 0x0d &&
      h[5] === 0x0a &&
      h[6] === 0x1a &&
      h[7] === 0x0a,
  },
  {
    extension: '.gif',
    matches: (h) =>
      h[0] === 0x47 &&
      h[1] === 0x49 &&
      h[2] === 0x46 &&
      h[3] === 0x38 &&
      (h[4] === 0x37 || h[4] === 0x39) &&
      h[5] === 0x61,
  },
  {
    extension: '.webp',
    matches: (h) =>
      h[0] === 0x52 &&
      h[1] === 0x49 &&
      h[2] === 0x46 &&
      h[3] === 0x46 &&
      h[8] === 0x57 &&
      h[9] === 0x45 &&
      h[10] === 0x42 &&
      h[11] === 0x50,
  },
];

function ensureUploadDir(destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
}

/** Multer config shared by every image-upload endpoint: size cap + declared-MIME fast filter. */
export function imageUploadOptions(destination: string) {
  ensureUploadDir(destination);
  return {
    storage: diskStorage({
      destination,
      filename: (
        _req: unknown,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
      ) => {
        const tempName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, tempName);
      },
    }),
    limits: { fileSize: IMAGE_MAX_FILE_SIZE_BYTES },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!DECLARED_MIME_ALLOWLIST.test(file.mimetype)) {
        cb(
          new BadRequestException(
            'Solo se permiten imágenes JPG, PNG, WebP o GIF',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

/**
 * Verifies the uploaded file's real content against known image magic bytes
 * and renames it to match. Deletes the file and throws on mismatch — the
 * declared MIME/extension are never trusted for storage or serving.
 */
export async function finalizeUploadedImage(
  file: Express.Multer.File,
): Promise<string> {
  const header = Buffer.alloc(12);
  const handle = await fsPromises.open(file.path, 'r');
  try {
    await handle.read(header, 0, 12, 0);
  } finally {
    await handle.close();
  }

  const signature = IMAGE_SIGNATURES.find((s) => s.matches(header));
  if (!signature) {
    await fsPromises.unlink(file.path).catch(() => undefined);
    throw new BadRequestException(
      'El archivo no es una imagen JPG, PNG, WebP o GIF válida',
    );
  }

  const dir = path.dirname(file.path);
  const base = path.basename(file.filename, path.extname(file.filename));
  const finalFilename = `${base}${signature.extension}`;
  const finalPath = path.join(dir, finalFilename);
  if (finalPath !== file.path) {
    await fsPromises.rename(file.path, finalPath);
  }
  return finalFilename;
}
