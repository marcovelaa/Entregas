import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.producto.findMany({ include: { imagenes: true } });
  for (const pr of prods) {
    console.log(pr.nombre + ' -> ' + pr.imagenes[0]?.url);
  }
}
main().finally(() => prisma.$disconnect());
