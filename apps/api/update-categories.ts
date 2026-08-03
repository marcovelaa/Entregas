import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando categorías...');
  
  const librosCat = await prisma.categoria.findUnique({ where: { slug: 'libros' } });
  const textosCat = await prisma.categoria.findUnique({ where: { slug: 'textos-escolares' } });

  if (textosCat) {
    // 1. Update the Textos Escolares template to make fields optional
    const newTemplate = [
      { name: 'serie', label: 'Serie / Proyecto', type: 'text', required: false },
      { name: 'coleccion', label: 'Colección', type: 'text', required: false },
      { name: 'nivel', label: 'Nivel Educativo', type: 'select', options: ['Inicial', 'Primaria', 'Secundaria'], required: false },
      { name: 'materia', label: 'Materia', type: 'text', required: false },
      { name: 'isbn', label: 'ISBN', type: 'text', required: false },
      { name: 'autor', label: 'Autor(es)', type: 'text', required: false }
    ];

    await prisma.categoria.update({
      where: { id: textosCat.id },
      data: { plantilla_atributos: newTemplate }
    });
    console.log('Plantilla de Textos Escolares actualizada.');

    // 2. Move existing products from Libros to Textos Escolares
    if (librosCat) {
      await prisma.producto.updateMany({
        where: { categoria_id: librosCat.id },
        data: { categoria_id: textosCat.id }
      });
      console.log('Productos de Libros movidos a Textos Escolares.');

      // 3. Delete Libros category
      await prisma.categoria.delete({
        where: { id: librosCat.id }
      });
      console.log('Categoría Libros eliminada.');
    }
  }

  console.log('Listo.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
