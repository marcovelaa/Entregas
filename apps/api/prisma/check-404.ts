import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.productoImagen.findMany();
  for (const img of images) {
    if (img.url.startsWith('http')) {
      try {
        const res = await fetch(img.url, { method: 'HEAD' });
        if (res.status !== 200 && res.status !== 302) {
          console.log(`INVALID URL (${res.status}): ${img.url}`);
        }
      } catch (e) {
        console.log(`ERROR FETCHING: ${img.url} - ${e}`);
      }
    }
  }
  console.log('Checked all URLs.');
}
main().finally(() => prisma.$disconnect());
