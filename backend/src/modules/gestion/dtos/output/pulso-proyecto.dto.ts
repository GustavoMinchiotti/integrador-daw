import { ApiProperty } from '@nestjs/swagger';

export type NivelPulsoProyecto =
  | 'ESTABLE'
  | 'ATENCION'
  | 'CRITICO'
  | 'SIN_DATOS'
  | 'CERRADO'
  | 'PAUSADO';

export class PulsoProyectoDTO {
  @ApiProperty()
  nivel!: NivelPulsoProyecto;

  @ApiProperty()
  puntaje!: number;

  @ApiProperty()
  avance!: number;

  @ApiProperty()
  totalTareas!: number;

  @ApiProperty()
  pendientes!: number;

  @ApiProperty()
  enProgreso!: number;

  @ApiProperty()
  finalizadas!: number;

  @ApiProperty()
  diasSinActividad!: number;

  @ApiProperty()
  recomendacion!: string;
}
