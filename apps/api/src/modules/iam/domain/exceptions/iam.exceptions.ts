export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UsuarioNoEncontradoException extends DomainException {}
export class EmailDuplicadoException extends DomainException {}
export class UsuarioDuplicadoException extends DomainException {}
export class RolNoEncontradoException extends DomainException {}
export class RolDuplicadoException extends DomainException {}
export class OperacionNoPermitidaException extends DomainException {}
