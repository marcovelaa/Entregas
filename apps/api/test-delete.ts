import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create a Marca
  const marca = await prisma.marca.create({
    data: { nombre: 'Test Marca', slug: 'test-marca' }
  });
  console.log('Created Marca:', marca.id);

  // 2. Create a Categoria
  let categoria = await prisma.categoria.findFirst({ where: { slug: 'test-cat' } });
  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: { nombre: 'Test Cat', slug: 'test-cat' }
    });
  }
  
  // 3. Create a Producto with the Marca
  const producto = await prisma.producto.create({
    data: {
      nombre: 'Test Producto',
      sku: 'TEST-001',
      categoria_id: categoria.id,
      marca_id: marca.id,
      precio_base: 10
    }
  });
  console.log('Created Producto:', producto.id, 'with marca_id:', producto.marca_id);

  // 4. Count products for the Marca
  const count = await prisma.producto.count({
    where: { marca_id: marca.id }
  });
  console.log('Count of products for marca', marca.id, 'is:', count);

  // 5. Delete the product and marca to clean up
  await prisma.producto.delete({ where: { id: producto.id } });
  await prisma.marca.delete({ where: { id: marca.id } });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
