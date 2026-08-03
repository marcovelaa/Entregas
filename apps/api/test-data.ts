import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const marca = await prisma.marca.create({ data: { nombre: 'Marca CURL', slug: 'marca-curl' } });
  let categoria = await prisma.categoria.findFirst({ where: { slug: 'test-cat' } });
  if (!categoria) {
    categoria = await prisma.categoria.create({ data: { nombre: 'Test Cat', slug: 'test-cat' } });
  }
  const producto = await prisma.producto.create({
    data: { nombre: 'Prod CURL', sku: 'CURL-01', categoria_id: categoria.id, marca_id: marca.id, precio_base: 10 }
  });
  console.log(marca.id);
}

main().then(async () => await prisma.$disconnect()).catch(async () => await prisma.$disconnect());
