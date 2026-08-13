import { PrismaClienteRepository } from './prisma-cliente.repository';

function buildPrismaMock() {
  return {
    cliente: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
}

describe('PrismaClienteRepository — credenciales', () => {
  it('crearConCredenciales persiste el password_hash y no lo expone en el resultado serializado por defecto', async () => {
    const prisma = buildPrismaMock();
    prisma.cliente.create.mockResolvedValue({
      id: 1n,
      nombre: 'Ana Pérez',
      email: 'ana@example.test',
      telefono: null,
      documento_id: null,
      direccion: null,
      password_hash: 'hashed',
      activo: true,
      creado_en: new Date(),
      actualizado_en: new Date(),
    });
    const repo = new PrismaClienteRepository(prisma as any);

    const result = await repo.crearConCredenciales({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.test',
      telefono: undefined,
      passwordHash: 'hashed',
    });

    expect(prisma.cliente.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ password_hash: 'hashed', email: 'ana@example.test' }),
    });
    expect(result.passwordHash).toBe('hashed');
    expect(result.id).toBe('1');
  });

  it('buscarPorEmailConCredenciales devuelve null si no existe', async () => {
    const prisma = buildPrismaMock();
    prisma.cliente.findMany = jest.fn();
    (prisma as any).cliente.findFirst = jest.fn().mockResolvedValue(null);
    const repo = new PrismaClienteRepository(prisma as any);

    const result = await repo.buscarPorEmailConCredenciales('nadie@example.test');

    expect(result).toBeNull();
  });
});
