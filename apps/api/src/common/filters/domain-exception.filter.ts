import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  EmailDuplicadoException,
  OperacionNoPermitidaException,
  RolDuplicadoException,
  RolNoEncontradoException,
  UsuarioDuplicadoException,
  UsuarioNoEncontradoException,
} from '../../modules/iam/domain/exceptions/iam.exceptions';

const STATUS_MAP = new Map<Function, HttpStatus>([
  [UsuarioNoEncontradoException, HttpStatus.NOT_FOUND],
  [RolNoEncontradoException, HttpStatus.NOT_FOUND],
  [EmailDuplicadoException, HttpStatus.CONFLICT],
  [UsuarioDuplicadoException, HttpStatus.CONFLICT],
  [RolDuplicadoException, HttpStatus.CONFLICT],
  [OperacionNoPermitidaException, HttpStatus.FORBIDDEN],
]);

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = STATUS_MAP.get(exception.constructor) ?? HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message: exception.message,
    });
  }
}
