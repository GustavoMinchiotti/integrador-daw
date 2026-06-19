import { ApiProperty } from '@nestjs/swagger';

export class ResumenProyectosDTO {
  @ApiProperty()
  activos!: number;

  @ApiProperty()
  finalizados!: number;

  @ApiProperty()
  bajas!: number;

  @ApiProperty()
  internos!: number;
}
