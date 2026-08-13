import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClienteJwtAuthGuard extends AuthGuard('jwt-cliente') {}
