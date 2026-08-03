const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.compraDetalle.deleteMany({});
  await prisma.compra.deleteMany({});
  console.log('Compras eliminadas');
}
main().finally(() => prisma.$disconnect());
