import 'reflect-metadata';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const passportCanActivate = jest.fn();

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn(() =>
    class PassportJwtGuard {
      canActivate(context: ExecutionContext) {
        return passportCanActivate(context);
      }
    },
  ),
}));

import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(request: { user?: unknown } = {}): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite exclusivamente rutas declaradas públicas sin validar JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const request = {};

    expect(new JwtAuthGuard(reflector).canActivate(createContext(request))).toBe(
      true,
    );
    expect(passportCanActivate).not.toHaveBeenCalled();
    expect(request).not.toHaveProperty('user');
  });

  it('delegates protected routes to Passport without injecting a user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    passportCanActivate.mockReturnValue(false);
    const request = {};
    const context = createContext(request);

    expect(new JwtAuthGuard(reflector).canActivate(context)).toBe(false);
    expect(passportCanActivate).toHaveBeenCalledWith(context);
    expect(request).not.toHaveProperty('user');
  });
});
