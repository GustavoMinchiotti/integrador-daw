import { ApiProperty } from '@nestjs/swagger';
import { ListProyectoDTO } from './list-proyecto.dto';
import { ResumenProyectosDTO } from './resumen-proyectos.dto';

export class ListProyectosPaginadoDTO {
  @ApiProperty({ type: () => ListProyectoDTO, isArray: true })
  data!: ListProyectoDTO[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  lastPage!: number;

  @ApiProperty({ type: () => ResumenProyectosDTO })
  resumen!: ResumenProyectosDTO;
}
