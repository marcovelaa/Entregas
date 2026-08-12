import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CrearClienteUseCase } from '../../application/use-cases/crear-cliente.use-case';
import { ListarClientesUseCase } from '../../application/use-cases/listar-clientes.use-case';
import { ActualizarClienteUseCase } from '../../application/use-cases/actualizar-cliente.use-case';
import {
  CrearClienteDto,
  ActualizarClienteDto,
  ListarClientesDto,
} from '../../application/dtos/cliente.dto';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly crearClienteUseCase: CrearClienteUseCase,
    private readonly listarClientesUseCase: ListarClientesUseCase,
    private readonly actualizarClienteUseCase: ActualizarClienteUseCase,
  ) {}

  @Post()
  @RequierePermiso('clientes:gestionar')
  async crear(@Body() dto: CrearClienteDto) {
    return this.crearClienteUseCase.execute(dto);
  }

  @Get()
  async listar(@Query() dto: ListarClientesDto) {
    return this.listarClientesUseCase.execute(dto);
  }

  @Put(':id')
  @RequierePermiso('clientes:gestionar')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.actualizarClienteUseCase.execute(id, dto);
  }
}
