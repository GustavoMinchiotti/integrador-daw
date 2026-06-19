import { ListClienteDTO } from "../clientes/listado/list-cliente-dto";

export type NivelPulsoProyecto = 'ESTABLE' | 'ATENCION' | 'CRITICO' | 'SIN_DATOS' | 'CERRADO' | 'PAUSADO';

export interface PulsoProyectoDTO {
    nivel: NivelPulsoProyecto;
    puntaje: number;
    avance: number;
    totalTareas: number;
    pendientes: number;
    enProgreso: number;
    finalizadas: number;
    diasSinActividad: number;
    recomendacion: string;
}

export interface ListProyectoDTO{
    id: number;
    nombre: string;
    estado: string;
    cliente: ListClienteDTO | null;
    pulso: PulsoProyectoDTO;
}
