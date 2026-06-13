import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTareaDto } from '../dtos/input/create-tarea.dto';
import { UpdateTareaDto } from '../dtos/input/update-tarea.dto';
import { Tarea } from '../entities/tarea.entity';
import { EstadosTareasEnum } from '../enums/estados-tareas.enum';
import { Proyecto } from '../entities/proyecto.entity';

@Injectable()
export class TareasService {
  constructor(
    @InjectRepository(Tarea)
    private readonly tareasRepository: Repository<Tarea>,

    @InjectRepository(Proyecto)
    private readonly proyectosRepository: Repository<Proyecto>,
  ) {}

  async crearTarea(
    dto: CreateTareaDto,
    idProyecto: number,
  ): Promise<{ id: number }> {
    const proyecto = await this.proyectosRepository.findOne({
      where: { id: idProyecto },
    });

    if (!proyecto) {
      throw new BadRequestException('El proyecto indicado no existe');
    }

    const tarea = this.tareasRepository.create(dto);

    tarea.estado = EstadosTareasEnum.PENDIENTE;

    tarea.proyecto = proyecto;

    await this.tareasRepository.save(tarea);

    return { id: tarea.id };
  }

  async actualizarTarea(dto: UpdateTareaDto, idTarea: number): Promise<void> {
    const tarea = await this.tareasRepository.findOne({
      where: { id: idTarea },
    });

    if (!tarea) {
      throw new BadRequestException('La tarea indicada no existe');
    }

    this.tareasRepository.merge(tarea, dto);

    await this.tareasRepository.save(tarea);
  }

  async obtenerTareas(idProyecto: number, estado?: string) {
    const where: any = {
      proyecto: { id: idProyecto },
    };

    if (estado) {
      where.estado = estado;
    }

    return this.tareasRepository.find({
      where,
      order: { id: 'ASC' },
    });
  }
}
