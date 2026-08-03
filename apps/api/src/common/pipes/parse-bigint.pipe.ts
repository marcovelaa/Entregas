import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException(
        `El parámetro '${value}' debe ser un número entero válido`,
      );
    }
    return BigInt(value);
  }
}
