function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}, requerida para firmar/verificar el JWT de clientes.`);
  }
  return value;
}

export const getCustomerJwtSecret = () => requiredEnv('CUSTOMER_JWT_SECRET');
export const getCustomerJwtRefreshSecret = () => requiredEnv('CUSTOMER_JWT_REFRESH_SECRET');
