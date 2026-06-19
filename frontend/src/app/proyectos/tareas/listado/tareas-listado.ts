import { Component, computed, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MessageService } from "primeng/api";
import { ListTareaDTO } from "./list-tarea-dto";
import { HttpClient } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { Template } from "../../../template/template";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { GestionTarea } from "../gestion/gestion-tarea";
import { EstadosTareasEnum } from "../estados-tareas-enum";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-tareas-listado",
  templateUrl: "./tareas-listado.html",
  styleUrls: ["./tareas-listado.css"],
  imports: [
    CommonModule,
    ButtonModule,
    Template,
    DialogModule,
    TooltipModule,
    GestionTarea,
    FormsModule
  ]
})
export class TareasListado implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  idProyecto!: number;
  nombreProyecto = signal<string>("Proyecto");

  tareas: WritableSignal<ListTareaDTO[]> = signal([]);

  dialogVisible = signal<boolean>(false);
  tareaSeleccionada = signal<ListTareaDTO | null>(null);
  filtroTareas = signal<string>('');
  totalTareas = computed(() => this.tareas().length);
  totalPendientes = computed(() => this.contarTareas(EstadosTareasEnum.PENDIENTE));
  totalEnProgreso = computed(() => this.contarTareas(EstadosTareasEnum.EN_PROGRESO));
  totalFinalizadas = computed(() => this.contarTareas(EstadosTareasEnum.FINALIZADA));
  porcentajeFinalizadas = computed(() => {
    const total = this.totalTareas();
    return total ? Math.round((this.totalFinalizadas() / total) * 100) : 0;
  });

  ngOnInit(): void {
    this.idProyecto = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDetallesProyecto();
    this.cargarTareas();
  }

  cargarDetallesProyecto(): void {
    this.http.get<any>(`/api/v1/proyectos/${this.idProyecto}`).subscribe({
      next: (proy) => this.nombreProyecto.set(proy.nombre),
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el proyecto.'
        })
    });
  }

  cargarTareas(): void {
    this.http.get<ListTareaDTO[]>(`/api/v1/proyectos/${this.idProyecto}/tareas`).subscribe({
      next: (data) => {
        this.tareas.set(data);
      },
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al sincronizar las tareas.'
        })
    });
  }

  getTareasPorEstado(estado: string): ListTareaDTO[] {
    const filtro = this.filtroTareas().trim().toLowerCase();

    return this.tareas().filter((t) => {
      const coincideEstado = t.estado === estado;
      const coincideTexto = !filtro || t.descripcion.toLowerCase().includes(filtro);
      return coincideEstado && coincideTexto;
    });
  }

  actualizarEstadoTarea(
  tarea: ListTareaDTO,
  nuevoEstado: EstadosTareasEnum
  ): void {

  const body = {
    descripcion: tarea.descripcion,
    estado: nuevoEstado
  };

  this.http.put(
    `/api/v1/proyectos/${this.idProyecto}/tareas/${tarea.id}`,
    body
  ).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Tablero actualizado',
        detail: `Tarea movida a ${nuevoEstado}`
      });

      this.cargarTareas();
    },
    error: (err) => {
      const errorMsg =
        err.error?.message || 'Error al actualizar tarea';

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMsg
      });
    }
  });
}

  agregarTarea(): void {
    this.tareaSeleccionada.set(null);
    this.dialogVisible.set(true);
  }

  editarTarea(tarea: ListTareaDTO): void {
    this.tareaSeleccionada.set(tarea);
    this.dialogVisible.set(true);
  }

  private contarTareas(estado: EstadosTareasEnum): number {
    return this.tareas().filter((tarea) => tarea.estado === estado).length;
  }
}
