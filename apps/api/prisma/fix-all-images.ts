import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const validUrls = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400'
];

async function main() {
  const products = await prisma.producto.findMany();
  
  await prisma.productoImagen.deleteMany();
  
  for (const product of products) {
    await prisma.productoImagen.createMany({
      data: [
        { producto_id: product.id, url: validUrls[0], es_principal: true, orden: 0 },
        { producto_id: product.id, url: validUrls[1], es_principal: false, orden: 1 },
        { producto_id: product.id, url: validUrls[2], es_principal: false, orden: 2 },
      ]
    });
  }
  console.log('Deleted all images and recreated 3 known-good Unsplash URLs per product.');
}
main().finally(() => prisma.$disconnect());
