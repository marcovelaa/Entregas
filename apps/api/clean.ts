import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.productoImagen.deleteMany();
  await prisma.variante.deleteMany();
  await prisma.producto.deleteMany();
  console.log('Productos limpiados exitosamente.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
