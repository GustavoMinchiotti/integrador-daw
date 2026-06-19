import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { Cliente } from '../entities/cliente.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { CreateClienteDto } from '../dtos/input/create-cliente.dto';
import { UpdateClienteDto } from '../dtos/input/update-cliente.dto';
import { EstadosClientesEnum } from '../enums/estados-clientes.enum';
import { EstadosProyectosEnum } from '../enums/estados-proyectos.enum';
import { ListClienteDTO } from '../dtos/output/list-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repository: Repository<Cliente>,

    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
  ) {}

  async crearCliente(dto: CreateClienteDto): Promise<{ id: number }> {
    const cliente: Cliente = this.repository.create(dto);
    cliente.estado = EstadosClientesEnum.ACTIVO;
    await this.repository.save(cliente);
    return { id: cliente.id };
  }

  async actualizarCliente(id: number, dto: UpdateClienteDto): Promise<void> {
    const cliente: Cliente | null = await this.repository.findOneBy({ id });

    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado');
    }

    const count = await this.proyectoRepository
      .createQueryBuilder('p')
      .where('p.clienteId = :id', { id })
      .andWhere('p.estado IN (:...estados)', {
        estados: [EstadosProyectosEnum.ACTIVO, EstadosProyectosEnum.FINALIZADO],
      })
      .getCount();

    const relacionadoConProyectos = count > 0;

    if (relacionadoConProyectos && dto.estado === EstadosClientesEnum.BAJA) {
      throw new BadRequestException(
        'No se puede dar de baja un cliente con proyectos relacionados',
      );
    }

    this.repository.merge(cliente, dto);
    await this.repository.save(cliente);
  }

  async obtenerClientes(
    estado: EstadosClientesEnum,
  ): Promise<ListClienteDTO[]> {
    const whereCondition: FindOptionsWhere<ListClienteDTO> = {};

    if (estado) {
      whereCondition.estado = estado;
    }

    const clientes: Cliente[] = await this.repository.find({
      select: { id: true, nombre: true, estado: true },
      order: { id: 'ASC' },
      where: whereCondition,
    });

    const dtoList: ListClienteDTO[] = [];

    for (const c of clientes) {
      const dto = new ListClienteDTO();
      dto.id = c.id;
      dto.nombre = c.nombre;
      dto.estado = c.estado;
      dtoList.push(dto);
    }

    return dtoList;
  }

  async existeClienteActivoPorId(id: number): Promise<boolean> {
    return await this.repository.exists({
      where: { id, estado: EstadosClientesEnum.ACTIVO },
    });
  }
}
