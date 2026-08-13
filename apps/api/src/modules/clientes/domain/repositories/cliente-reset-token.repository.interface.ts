export const CLIENTE_RESET_TOKEN_REPOSITORY = 'CLIENTE_RESET_TOKEN_REPOSITORY';

export type ClienteResetTokenData = {
  id: string;
  clienteId: string;
  tokenHash: string;
  expiraEn: Date;
  usado: boolean;
};

export interface IClienteResetTokenRepository {
  crear(clienteId: string, tokenHash: string, expiraEn: Date): Promise<void>;
  buscarPorHash(tokenHash: string): Promise<ClienteResetTokenData | null>;
  marcarUsado(id: string): Promise<void>;
}
