import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.productoImagen.findMany();
  
  for (const img of images) {
    if (!img.url.startsWith('http')) {
      console.log(`Fixing relative image URL: ${img.url}`);
      await prisma.productoImagen.update({
        where: { id: img.id },
        data: { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' }
      });
    }
  }
  console.log('Fixed all relative images to Unsplash absolute URLs.');
}

main().finally(() => prisma.$disconnect());
