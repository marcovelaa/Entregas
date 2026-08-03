const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categorias = await prisma.categoria.findMany();
  
  let marca = await prisma.marca.findFirst();
  if (!marca) {
    marca = await prisma.marca.create({ data: { nombre: 'Santillana', slug: 'santillana' } });
  }
  
  const textCat = categorias.find(c => c.slug === 'textos-escolares');
  const libCat = categorias.find(c => c.slug === 'libros');
  
  // Test End-to-End by creating products
  const p1 = await prisma.producto.create({
    data: {
      nombre: 'Matemáticas 1 Básico',
      sku: 'MAT-1-BAS',
      naturaleza: 'Textos Escolares',
      categoria_id: textCat.id,
      marca_id: marca.id,
      atributos: {
        serie: 'Bicentenario',
        materia: 'Matemáticas',
        nivel: 'Primaria',
        subnivel: '1ro',
        isbn: '978-987-1234-56-7'
      }
    }
  });
  
  const p2 = await prisma.producto.create({
    data: {
      nombre: 'Cien Años de Soledad',
      sku: 'CIEN-ANOS',
      naturaleza: 'Libros',
      categoria_id: libCat.id,
      marca_id: marca.id,
      atributos: {
        autor: 'Gabriel García Márquez',
        edicion: '2020',
        encuadernacion: 'Tapa Dura (Cartoné)',
        paginas: '416',
        edad_recomendada: 'Adultos',
        isbn: '978-84-376-0494-7'
      }
    }
  });

  console.log("Prueba superada!");
  console.log("Producto 1:", p1);
  console.log("Producto 2:", p2);
}

main().finally(() => prisma.$disconnect());
