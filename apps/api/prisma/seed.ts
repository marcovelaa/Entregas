import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ALL_PERMISSIONS, BASE_ROLE_PERMISSIONS } from '@repo/rbac-contract';
import { diffCatalogoPermisos } from './reconcile-permisos';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Sincronizar el catálogo de permisos (agrega y quita de verdad)
  const codigosExistentes = (
    await prisma.permiso.findMany({ select: { codigo: true } })
  ).map((p) => p.codigo);
  const codigosDeseados = ALL_PERMISSIONS.map((p) => p.codigo);
  const { aAgregar, aQuitar } = diffCatalogoPermisos(
    codigosExistentes,
    codigosDeseados,
  );

  for (const p of ALL_PERMISSIONS.filter((p) => aAgregar.includes(p.codigo))) {
    await prisma.permiso.create({
      data: { codigo: p.codigo, descripcion: p.descripcion },
    });
  }
  for (const p of ALL_PERMISSIONS) {
    await prisma.permiso.update({
      where: { codigo: p.codigo },
      data: { descripcion: p.descripcion },
    });
  }
  for (const codigo of aQuitar) {
    const afectados = await prisma.rolPermiso.findMany({
      where: { permiso_codigo: codigo },
      include: { rol: true },
    });
    if (afectados.length) {
      console.warn(
        `⚠️  Revocando permiso retirado '${codigo}' de: ${afectados.map((a) => a.rol.nombre).join(', ')}`,
      );
    }
    await prisma.permiso.delete({ where: { codigo } });
  }
  console.log(
    `✅ Catálogo sincronizado (+${aAgregar.length} / -${aQuitar.length})`,
  );

  // 2. Crear Roles Base — recordar cuáles YA existían antes de este upsert,
  //    para no pisar sus grants en el paso 3.
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

  // Los pasos 2-3 corren en una sola transacción: si el proceso se cae entre
  // el upsert de roles y la aplicación de grants, un re-run vería los roles
  // como "ya existentes" (el upsert ya corrió) y saltaría TODOS los grants
  // — incluyendo los del Super Usuario recién creado, dejándolo sin permisos
  // y sin forma de auto-repararse desde /configuracion/roles. Atómico evita
  // ese estado inconsistente: o completan ambos pasos, o ninguno.
  const rolesPreexistentes = new Set<string>();
  await prisma.$transaction(async (tx) => {
    for (const r of roles) {
      const existia = await tx.rol.findUnique({
        where: { nombre: r.nombre },
      });
      if (existia) rolesPreexistentes.add(r.nombre);
      await tx.rol.upsert({
        where: { nombre: r.nombre },
        update: { descripcion: r.descripcion, activo: r.activo },
        create: r,
      });
    }

    // 3. Aplicar los permisos base SOLO a roles recién creados en esta corrida.
    //    Si el rol ya existía, la DB manda — un admin pudo haberlo personalizado
    //    desde /configuracion/roles y el seed no debe pisarlo.
    for (const [nombreRol, permisosRol] of Object.entries(
      BASE_ROLE_PERMISSIONS,
    )) {
      if (rolesPreexistentes.has(nombreRol)) continue;

      const rol = await tx.rol.findUnique({ where: { nombre: nombreRol } });
      if (!rol) continue; // rol custom sin defaults en el contrato

      for (const permisoCodigo of permisosRol) {
        await tx.rolPermiso.create({
          data: { rol_id: rol.id, permiso_codigo: permisoCodigo },
        });
      }
    }
  });
  console.log('✅ Roles base insertados/actualizados');
  console.log('✅ Permisos base asignados a los roles nuevos');

  const superRol = await prisma.rol.findUnique({
    where: { nombre: 'Super Usuario' },
  });

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
