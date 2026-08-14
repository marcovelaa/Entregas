import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createContext(user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('RolesGuard', () => {
  it('permite el acceso si el endpoint no requiere ningún permiso específico', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(undefined))).toBe(true);
  });

  it('permite el acceso si el usuario autenticado tiene el permiso requerido', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('ventas:crear'),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(
        createContext({ permisos: ['ventas:crear', 'ventas:ver'] }),
      ),
    ).toBe(true);
  });

  it('rechaza con ForbiddenException si el usuario no tiene el permiso requerido', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('ventas:crear'),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(createContext({ permisos: ['ventas:ver'] })),
    ).toThrow(ForbiddenException);
  });

  it('rechaza con ForbiddenException si no hay usuario autenticado en la request', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('ventas:crear'),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
