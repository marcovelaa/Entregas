import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching categories...');
  const categories = await prisma.categoria.findMany();
  console.log(categories.map(c => c.slug));

  let planLectorCat = await prisma.categoria.findUnique({ where: { slug: 'plan-lector' } });
  
  if (!planLectorCat) {
    console.log('Creating plan-lector category...');
    planLectorCat = await prisma.categoria.create({
      data: {
        nombre: 'Plan Lector',
        slug: 'plan-lector',
        descripcion: 'Libros de lectura complementaria',
        activo: true
      }
    });
  }

  const productsData = [
    // Plan Lector (4)
    {
      categoria_id: planLectorCat.id,
      nombre: 'El Principito - Edición Escolar',
      sku: 'LEC-PRI-1',
      precio_base: 45.00,
      atributos: { autor: 'Antoine de Saint-Exupéry' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: planLectorCat.id,
      nombre: 'Cien Años de Soledad',
      sku: 'LEC-GAB-1',
      precio_base: 85.00,
      atributos: { autor: 'Gabriel García Márquez' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1474932430478-367d16b99031?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1511108690759-009324a5033c?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: planLectorCat.id,
      nombre: 'Don Quijote de la Mancha (Adaptación)',
      sku: 'LEC-QUI-1',
      precio_base: 65.00,
      atributos: { autor: 'Miguel de Cervantes' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1456953180671-730de08edaa7?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: planLectorCat.id,
      nombre: 'Fahrenheit 451',
      sku: 'LEC-RAY-1',
      precio_base: 70.00,
      atributos: { autor: 'Ray Bradbury' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', es_principal: false, orden: 2 }
      ]
    }
  ];

  for (const prodData of productsData) {
    const { imagenes, ...data } = prodData;
    
    // Check if exists
    const existing = await prisma.producto.findUnique({ where: { sku: data.sku } });
    if (!existing) {
      await prisma.producto.create({
        data: {
          ...data,
          imagenes: {
            create: imagenes
          }
        }
      });
      console.log(`Created product: ${data.nombre}`);
    } else {
      console.log(`Product already exists: ${data.nombre}`);
    }
  }

  // Also check if any product doesn't have images
  console.log('\nChecking products without images...');
  const allProducts = await prisma.producto.findMany({ include: { imagenes: true } });
  for (const p of allProducts) {
    if (p.imagenes.length === 0) {
      console.warn(`WARNING: Product ${p.nombre} (${p.sku}) has no images!`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
