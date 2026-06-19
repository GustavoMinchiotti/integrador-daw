import { Component, computed, effect, inject, signal, untracked, WritableSignal } from "@angular/core";
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
import { finalize } from "rxjs";

@Component({
  selector: "app-proyectos-listado",
  templateUrl: "./proyectos-listado.html",
  styleUrls: ["./proyectos-listado.css"],
  imports: [TableModule, ButtonModule, Template, TooltipModule, GestionProyecto, FormsModule, CommonModule]
})
export class ProyectosListado {

  private readonly messageService: MessageService = inject(MessageService);
  private readonly proyectosListadoApiClient: ProyectosListadoApiClient = inject(ProyectosListadoApiClient);

  proyectos: WritableSignal<ListProyectoDTO[]> = signal([]);
  dialogVisible = signal(false);
  proyectoSeleccionado = signal<ListProyectoDTO | null>(null);

  searchQuery = signal<string>('');
  estadoFiltro = signal<string>('');
  sortBy = signal<string>('id');
  sortDirection = signal<string>('ASC');

  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  limit = signal<number>(5);
  totalItems = signal<number>(0);
  pageSizeOptions = [5, 10, 20];
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  proyectosActivos = computed(() => this.contarPorEstado('ACTIVO'));
  proyectosFinalizados = computed(() => this.contarPorEstado('FINALIZADO'));
  proyectosBaja = computed(() => this.contarPorEstado('BAJA'));
  proyectosInternos = computed(() => this.proyectos().filter((p) => !p.cliente).length);

  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      if (!this.dialogVisible()) {
        untracked(() => this.refrescarProyectos());
      }
    });
  }

  refrescarProyectos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.proyectosListadoApiClient.buscarProyectos(
      this.searchQuery(),
      this.estadoFiltro(),
      this.currentPage(),
      this.limit(),
      this.sortBy(),
      this.sortDirection()
    ).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response) => {
        const total = Number(response?.total ?? 0);
        const lastPage = Math.max(Number(response?.lastPage ?? 1), 1);
        const page = Math.min(Math.max(Number(response?.page ?? this.currentPage()), 1), lastPage);

        if (page !== this.currentPage()) {
          this.currentPage.set(page);
        }

        if (total > 0 && response.data.length === 0 && this.currentPage() > lastPage) {
          this.currentPage.set(lastPage);
          this.refrescarProyectos();
          return;
        }

        this.proyectos.set(response.data);
        this.totalItems.set(total);
        this.totalPages.set(lastPage);
      },
      error: (error) => {
        const detail = error?.error?.message ?? 'No se pudieron cargar los proyectos';
        this.errorMessage.set(detail);
        this.proyectos.set([]);
        this.totalItems.set(0);
        this.totalPages.set(1);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail
        });
      }
    });
  }

  buscarOFiltrar(): void {
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.refrescarProyectos();
    }, 300);
  }

  cambiarPagina(nuevaPagina: number): void {
    const pagina = Math.min(Math.max(nuevaPagina, 1), this.totalPages());

    if (pagina === this.currentPage() || this.loading()) {
      return;
    }

    this.currentPage.set(pagina);
    this.refrescarProyectos();
  }

  cambiarLimite(nuevoLimite: string): void {
    const limite = Number(nuevoLimite) || this.pageSizeOptions[0];
    this.limit.set(limite);
    this.currentPage.set(1);
    this.refrescarProyectos();
  }

  cambiarOrdenamiento(): void {
    this.currentPage.set(1);
    this.refrescarProyectos();
  }

  limpiarFiltros(): void {
    this.searchQuery.set('');
    this.estadoFiltro.set('');
    this.sortBy.set('id');
    this.sortDirection.set('ASC');
    this.currentPage.set(1);
    this.refrescarProyectos();
  }

  paginasVisibles(): number[] {
    const total = this.totalPages();
    const actual = this.currentPage();
    const inicio = Math.max(actual - 2, 1);
    const fin = Math.min(inicio + 4, total);
    const primerVisible = Math.max(fin - 4, 1);

    return Array.from(
      { length: fin - primerVisible + 1 },
      (_, index) => primerVisible + index
    );
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

  exportarCsv(): void {
    if (!this.proyectos().length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay proyectos visibles para exportar'
      });
      return;
    }

    const filas = this.proyectos().map((proyecto) => [
      proyecto.id,
      proyecto.nombre,
      proyecto.estado,
      proyecto.cliente?.nombre ?? 'Desarrollo Interno'
    ]);
    const csv = [
      ['ID', 'Nombre', 'Estado', 'Cliente'],
      ...filas
    ].map((fila) => fila.map((valor) => this.valorCsv(valor)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proyectos.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private contarPorEstado(estado: string): number {
    return this.proyectos().filter((proyecto) => proyecto.estado === estado).length;
  }

  private valorCsv(valor: unknown): string {
    const texto = String(valor ?? '').replace(/"/g, '""');
    return `"${texto}"`;
  }
}
