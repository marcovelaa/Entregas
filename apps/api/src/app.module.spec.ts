import 'reflect-metadata';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/iam/auth/guards/roles.guard';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('AppModule global guards', () => {
  it('registers throttling, JWT authentication and permissions in execution order', () => {
    const { AppModule } =
      jest.requireActual<typeof import('./app.module')>('./app.module');
    const metadata = Reflect.getMetadata('providers', AppModule) as unknown;
    const providers = metadata as Array<{
      provide?: unknown;
      useClass?: unknown;
    }>;
    const globalGuards = providers
      .filter((provider) => provider.provide === APP_GUARD)
      .map((provider) => provider.useClass);

    expect(globalGuards).toEqual([ThrottlerGuard, JwtAuthGuard, RolesGuard]);
  });
});
