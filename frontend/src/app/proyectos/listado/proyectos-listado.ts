import { Component, effect, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { MessageService } from "primeng/api";
import { ListProyectoDTO } from "./list-proyecto-dto";
import { ProyectosListadoApiClient } from "./proyectos-listado-api-client";
import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button";
import { Template } from "../../template/template";
import { TooltipModule } from 'primeng/tooltip';
import { GestionProyecto } from "../gestion/gestion-proyecto";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-proyectos-listado",
  templateUrl: "./proyectos-listado.html",
  styleUrls: ["./proyectos-listado.css"],
  imports: [TableModule, ButtonModule, Template, TooltipModule, GestionProyecto, FormsModule, CommonModule]
})
export class ProyectosListado implements OnInit {

  private readonly messageService: MessageService = inject(MessageService);
  private readonly proyectosListadoApiClient: ProyectosListadoApiClient = inject(ProyectosListadoApiClient);

  proyectos: WritableSignal<ListProyectoDTO[]> = signal([]);
  dialogVisible = signal(false);
  proyectoSeleccionado = signal<ListProyectoDTO | null>(null);

  // ✅ Filtros
  searchQuery = signal<string>('');
  estadoFiltro = signal<string>('');

  // ✅ Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  limit = signal<number>(5);

  // ✅ Para evitar llamadas excesivas al backend
  private debounceTimer: any;

  constructor() {
    effect(() => {
      if (!this.dialogVisible()) {
        this.refrescarProyectos();
      }
    });
  }

  ngOnInit(): void {
    this.refrescarProyectos();
  }

  refrescarProyectos(): void {
    console.log('📡 Filtros enviados:', {
      nombre: this.searchQuery(),
      estado: this.estadoFiltro(),
      page: this.currentPage(),
      limit: this.limit()
    });

    this.proyectosListadoApiClient.buscarProyectos(
      this.searchQuery(),
      this.estadoFiltro(),
      this.currentPage(),
      this.limit()
    ).subscribe({
      next: (response) => {

        // ✅ Manejo seguro de respuesta
        const data = response?.data ?? response ?? [];

        this.proyectos.set(data);

        // ✅ Paginación segura
        if (response?.lastPage) {
          this.totalPages.set(response.lastPage);
        } else {
          this.totalPages.set(1);
        }

        console.log('✅ Proyectos cargados:', data);

      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los proyectos'
        });
      }
    });
  }

  buscarOFiltrar(): void {
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.refrescarProyectos();
    }, 300); // ✅ mejora UX
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages()) {
      this.currentPage.set(nuevaPagina);
      this.refrescarProyectos();
    }
  }

  crearProyecto(): void {
    this.dialogVisible.set(true);
  }

  editarProyecto(proyecto: ListProyectoDTO): void {
    this.proyectoSeleccionado.set(proyecto);
    this.dialogVisible.set(true);
  }

  gestionarTareas(proyecto: ListProyectoDTO): void {
    window.open(`/proyectos/${proyecto.id}/tareas`, '_blank');
  }
}
