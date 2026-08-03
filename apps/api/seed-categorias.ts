import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.producto.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.marca.deleteMany({});
  
  const cats = ['Textos Escolares', 'Libros', 'Material Escolar', 'Cuadernos', 'Papel'];
  for (const c of cats) {
    await prisma.categoria.create({
      data: { nombre: c, slug: c.toLowerCase().replace(/ /g, '-'), activo: true }
    });
  }
  console.log('DB limpia y Categorias creadas');
}
run().finally(() => prisma.$disconnect());
