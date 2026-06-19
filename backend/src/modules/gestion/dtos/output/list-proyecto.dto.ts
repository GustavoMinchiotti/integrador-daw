import { ApiProperty } from '@nestjs/swagger';
import { EstadosProyectosEnum } from '../../enums/estados-proyectos.enum';
import { ListClienteDTO } from './list-cliente.dto';
import { PulsoProyectoDTO } from './pulso-proyecto.dto';

export class ListProyectoDTO {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  estado!: EstadosProyectosEnum;

  @ApiProperty({ type: () => ListClienteDTO })
  cliente?: ListClienteDTO;

  @ApiProperty({ type: () => PulsoProyectoDTO })
  pulso!: PulsoProyectoDTO;
}
