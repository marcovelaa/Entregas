import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ALL_PERMISSIONS, BASE_ROLE_PERMISSIONS } from '@repo/rbac-contract';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Crear Permisos
  const permisos = ALL_PERMISSIONS;

  for (const p of permisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: { descripcion: p.descripcion },
      create: { codigo: p.codigo, descripcion: p.descripcion },
    });
  }
  console.log('✅ Permisos insertados/actualizados');

  // 2. Crear Roles Base
  const roles = [
    {
      nombre: 'Super Usuario',
      descripcion: 'Acceso total. No puede ser eliminado ni desactivado.',
      activo: true,
    },
    {
      nombre: 'Administrador',
      descripcion: 'Acceso a gestión interna salvo configuración crítica.',
      activo: true,
    },
    {
      nombre: 'Encargado de Ventas',
      descripcion: 'Gestión de ventas, descuentos y clientes.',
      activo: true,
    },
    {
      nombre: 'Vendedor',
      descripcion: 'Solo puede operar el POS. Sin acceso administrativo.',
      activo: true,
    },
  ];

  for (const r of roles) {
    await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: { descripcion: r.descripcion, activo: r.activo },
      create: r,
    });
  }
  console.log('✅ Roles base insertados/actualizados');

  // 3. Asignar los permisos base a cada rol. Los upserts preservan permisos
  // adicionales gestionados explícitamente desde IAM.
  const superRol = await prisma.rol.findUnique({
    where: { nombre: 'Super Usuario' },
  });
  for (const [nombreRol, permisosRol] of Object.entries(
    BASE_ROLE_PERMISSIONS,
  )) {
    const rol = await prisma.rol.findUnique({ where: { nombre: nombreRol } });
    if (!rol) continue;

    for (const permisoCodigo of permisosRol) {
      await prisma.rolPermiso.upsert({
        where: {
          rol_id_permiso_codigo: {
            rol_id: rol.id,
            permiso_codigo: permisoCodigo,
          },
        },
        update: {},
        create: {
          rol_id: rol.id,
          permiso_codigo: permisoCodigo,
        },
      });
    }
  }
  console.log('✅ Permisos base asignados a los roles');

  // 4. Crear el Super Usuario Inicial
  const emailAdmin = process.env.ADMIN_EMAIL || 'admin@entregas.com.bo';
  const plainPassword = process.env.ADMIN_PASSWORD || 'temporal123';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: emailAdmin },
  });
  if (!existingAdmin && superRol) {
    await prisma.usuario.create({
      data: {
        email: emailAdmin,
        password_hash: hashedPassword,
        nombres: 'Super',
        apellidos: 'Admin',
        rol_id: superRol.id,
      },
    });
    console.log(`✅ Super Usuario creado (${emailAdmin})`);
  } else {
    console.log('ℹ️ Super Usuario ya existía');
  }

  // 5. Crear Categorías Base con sus Plantillas
  const categoriasBase = [
    {
      nombre: 'Textos Escolares',
      slug: 'textos-escolares',
      descripcion:
        'Textos de Inicial, Primaria, Secundaria y Libros de Plan Lector',
      activo: true,
      plantilla_atributos: [
        {
          name: 'serie',
          label: 'Serie / Proyecto',
          type: 'text',
          required: false,
        },
        {
          name: 'coleccion',
          label: 'Colección',
          type: 'text',
          required: false,
        },
        {
          name: 'nivel',
          label: 'Nivel Educativo',
          type: 'select',
          options: ['Inicial', 'Primaria', 'Secundaria'],
          required: false,
        },
        { name: 'materia', label: 'Materia', type: 'text', required: false },
        { name: 'isbn', label: 'ISBN', type: 'text', required: false },
        { name: 'autor', label: 'Autor(es)', type: 'text', required: false },
      ],
    },
    {
      nombre: 'Material Escolar',
      slug: 'material-escolar',
      descripcion: 'Útiles en general',
      activo: true,
      plantilla_atributos: [
        {
          name: 'tipo_material',
          label: 'Tipo',
          type: 'select',
          options: ['Escritura', 'Arte y Plástica', 'Geometría', 'Otros'],
        },
      ],
    },
    {
      nombre: 'Cuadernos',
      slug: 'cuadernos',
      descripcion: 'Cuadernos por paquete, pallet, espiral, cosido',
      activo: true,
      plantilla_atributos: [],
    },
    {
      nombre: 'Papel',
      slug: 'papel',
      descripcion: 'Hojas, cartulinas, resmas',
      activo: true,
      plantilla_atributos: [
        {
          name: 'tamano',
          label: 'Tamaño',
          type: 'select',
          options: ['Carta', 'Oficio', 'A4', 'Pliego', 'Medio Pliego'],
        },
        { name: 'gramaje', label: 'Gramaje (gr)', type: 'text' },
        { name: 'color', label: 'Color', type: 'text' },
      ],
    },
  ];

  for (const cat of categoriasBase) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: { plantilla_atributos: cat.plantilla_atributos },
      create: cat,
    });
  }
  console.log(
    '✅ Categorías base (Libros, Material Escolar, Papel) insertadas',
  );

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
