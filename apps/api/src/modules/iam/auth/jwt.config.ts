function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}, requerida para firmar/verificar JWT.`,
    );
  }
  return value;
}

export const getJwtSecret = () => requiredEnv('JWT_SECRET');
export const getJwtRefreshSecret = () => requiredEnv('JWT_REFRESH_SECRET');
