import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');

  const catTextos = await prisma.categoria.findUnique({ where: { slug: 'textos-escolares' } });
  const catMaterial = await prisma.categoria.findUnique({ where: { slug: 'material-escolar' } });
  const catCuadernos = await prisma.categoria.findUnique({ where: { slug: 'cuadernos' } });
  const catPapel = await prisma.categoria.findUnique({ where: { slug: 'papel' } });

  if (!catTextos || !catMaterial || !catCuadernos || !catPapel) {
    throw new Error('Missing categories');
  }

  const productsData = [
    // Textos Escolares (4)
    {
      categoria_id: catTextos.id,
      nombre: 'Matemáticas 1 - Nivel Primaria',
      sku: 'MAT-PRI-1',
      precio_base: 150.00,
      atributos: { materia: 'mat', nivel: 'Primaria', grado: 'pri-1' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catTextos.id,
      nombre: 'Lenguaje y Comunicación 3 - Secundaria',
      sku: 'LEN-SEC-3',
      precio_base: 180.00,
      atributos: { materia: 'lit', nivel: 'Secundaria', grado: 'sec-3' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1511108690759-009324a5033c?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1456953180671-730de08edaa7?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catTextos.id,
      nombre: 'Ciencias Naturales 5 - Primaria',
      sku: 'CIE-PRI-5',
      precio_base: 140.00,
      atributos: { materia: 'cie', nivel: 'Primaria', grado: 'pri-5' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catTextos.id,
      nombre: 'Historia Universal 1 - Secundaria',
      sku: 'HIS-SEC-1',
      precio_base: 160.00,
      atributos: { materia: 'soc', nivel: 'Secundaria', grado: 'sec-1' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1447069387362-f0f41d204a9d?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', es_principal: false, orden: 2 }
      ]
    },

    // Material Escolar (4)
    {
      categoria_id: catMaterial.id,
      nombre: 'Caja de Colores x24',
      sku: 'COL-24-001',
      precio_base: 45.50,
      atributos: { tipo_material: 'Arte y Plástica' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1506542784860-e83626880816?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catMaterial.id,
      nombre: 'Estuche Geométrico Profesional',
      sku: 'GEO-PRO-1',
      precio_base: 30.00,
      atributos: { tipo_material: 'Geometría' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1611078652317-09ebc713b185?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1589998059171-9899ea1914eb?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catMaterial.id,
      nombre: 'Marcadores Acrílicos x12',
      sku: 'MAR-ACR-12',
      precio_base: 55.00,
      atributos: { tipo_material: 'Arte y Plástica' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1506542784860-e83626880816?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catMaterial.id,
      nombre: 'Bolígrafos Gel x5 Colores',
      sku: 'BOL-GEL-5',
      precio_base: 18.50,
      atributos: { tipo_material: 'Escritura' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1568205612837-017257d2310a?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1589998059171-9899ea1914eb?w=400', es_principal: false, orden: 2 }
      ]
    },

    // Cuadernos (4)
    {
      categoria_id: catCuadernos.id,
      nombre: 'Cuaderno Espiral 100 hojas',
      sku: 'CUA-ESP-100',
      precio_base: 25.00,
      atributos: { size: 'Carta', sheets: 100 },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1531346878377-a541e4b29f95?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1579623545199-4c22754605ea?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catCuadernos.id,
      nombre: 'Cuaderno Cosido 50 hojas',
      sku: 'CUA-COS-50',
      precio_base: 15.00,
      atributos: { size: 'Medio Oficio', sheets: 50 },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1522026720524-17157a3e742e?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1534665482403-a909d0d97c67?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1581452140510-cdccb4661005?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catCuadernos.id,
      nombre: 'Cuaderno Universitario 200 hojas',
      sku: 'CUA-UNI-200',
      precio_base: 45.00,
      atributos: { size: 'Universitario', sheets: 200 },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1531346878377-a541e4b29f95?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1579623545199-4c22754605ea?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catCuadernos.id,
      nombre: 'Cuaderno Tapa Dura 100 hojas',
      sku: 'CUA-DUR-100',
      precio_base: 35.00,
      atributos: { size: 'Carta', sheets: 100 },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1581452140510-cdccb4661005?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1522026720524-17157a3e742e?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1534665482403-a909d0d97c67?w=400', es_principal: false, orden: 2 }
      ]
    },

    // Papel (4)
    {
      categoria_id: catPapel.id,
      nombre: 'Resma Papel Bond A4 500 hojas',
      sku: 'RES-A4-500',
      precio_base: 35.00,
      atributos: { tamano: 'A4', gramaje: '75', color: 'Blanco' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1596706037061-0428d0089e9d?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catPapel.id,
      nombre: 'Cartulina de Colores Paquete 10',
      sku: 'CAR-COL-10',
      precio_base: 12.00,
      atributos: { tamano: 'Pliego', gramaje: '120', color: 'Surtido' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1618335805561-ebdb4532a2f8?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1518778644552-87c26fb46a74?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1579621970228-568eb2ade2da?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catPapel.id,
      nombre: 'Papel Crepé Paquete x5',
      sku: 'PAP-CRE-5',
      precio_base: 8.50,
      atributos: { tamano: 'Medio Pliego', gramaje: '30', color: 'Surtido' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1596706037061-0428d0089e9d?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?w=400', es_principal: false, orden: 2 }
      ]
    },
    {
      categoria_id: catPapel.id,
      nombre: 'Goma Eva Pliego Entero x10',
      sku: 'GOM-EVA-10',
      precio_base: 25.00,
      atributos: { tamano: 'Pliego', gramaje: '200', color: 'Brillante Surtido' },
      imagenes: [
        { url: 'https://images.unsplash.com/photo-1618335805561-ebdb4532a2f8?w=400', es_principal: true, orden: 0 },
        { url: 'https://images.unsplash.com/photo-1579621970228-568eb2ade2da?w=400', es_principal: false, orden: 1 },
        { url: 'https://images.unsplash.com/photo-1518778644552-87c26fb46a74?w=400', es_principal: false, orden: 2 }
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

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
