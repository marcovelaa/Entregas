const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
BigInt.prototype.toJSON = function() { return this.toString() };
async function run() {
  const prods = await prisma.producto.findMany({ where: { categoria: { slug: 'textos-escolares' } } });
  console.log(JSON.stringify(prods, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
