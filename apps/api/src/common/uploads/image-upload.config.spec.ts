import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { finalizeUploadedImage } from './image-upload.config';

const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const GIF_HEADER = Buffer.from('GIF89a');
const WEBP_HEADER = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP'),
]);
const SVG_CONTENT = Buffer.from(
  '<svg onload="alert(1)"><script>alert(1)</script></svg>',
);
const HTML_CONTENT = Buffer.from('<html><body>not an image</body></html>');

describe('finalizeUploadedImage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'image-upload-test-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function writeUpload(name: string, content: Buffer) {
    const filePath = path.join(dir, name);
    await fs.writeFile(filePath, content);
    return {
      path: filePath,
      filename: name,
    } as Express.Multer.File;
  }

  it.each([
    ['jpeg', JPEG_HEADER, '.jpg'],
    ['png', PNG_HEADER, '.png'],
    ['gif', GIF_HEADER, '.gif'],
    ['webp', WEBP_HEADER, '.webp'],
  ])(
    'accepts a real %s file and renames it to the correct extension',
    async (_label, header, expectedExt) => {
      const file = await writeUpload('upload.tmp', header);

      const finalFilename = await finalizeUploadedImage(file);

      expect(finalFilename).toBe(`upload${expectedExt}`);
      const finalPath = path.join(dir, finalFilename);
      await expect(fs.access(finalPath)).resolves.toBeUndefined();
    },
  );

  it('rejects an SVG file even when it claims a .jpg extension', async () => {
    const file = await writeUpload('upload.jpg', SVG_CONTENT);

    await expect(finalizeUploadedImage(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(fs.access(file.path)).rejects.toThrow();
  });

  it('rejects an HTML file disguised with an image extension', async () => {
    const file = await writeUpload('upload.png', HTML_CONTENT);

    await expect(finalizeUploadedImage(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(fs.access(file.path)).rejects.toThrow();
  });

  it('deletes the temp file when the content does not match any allowed signature', async () => {
    const file = await writeUpload('upload.tmp', Buffer.from('not-an-image'));

    await expect(finalizeUploadedImage(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(fs.access(file.path)).rejects.toThrow();
  });
});
