import { Component, inject, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { LoginApiClient } from "./login-api-client";
import { MessageService } from "primeng/api";
import { AuthStore } from "../auth-store";
import { Router } from "@angular/router";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";

@Component({
    selector: "app-login",
    templateUrl: "./login.html",
    styleUrl: "./login.css",
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule]
})
export class Login {

    private readonly loginApiClient: LoginApiClient = inject(LoginApiClient);
    private readonly messageService: MessageService = inject(MessageService);
    private readonly authStore: AuthStore = inject(AuthStore);
    private readonly router: Router = inject(Router);

    readonly form: FormGroup = new FormGroup({
        nombre: new FormControl("", [Validators.required]),
        clave: new FormControl("", [Validators.required])
    });
    readonly loading = signal(false);
    readonly errorMessage = signal('');

    iniciarSesion() {
        this.errorMessage.set('');

        if (!this.form.valid) {
            this.form.markAllAsTouched();
            this.errorMessage.set('Completá tu usuario y clave para continuar.');
            return;
        }

        if (this.loading()) {
            return;
        }

        const nombre: string = this.form.value.nombre!;
        const clave: string = this.form.value.clave!;

        this.loading.set(true);
        this.loginApiClient.iniciarSesion(nombre, clave).pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (data) => {
                this.authStore.guardarToken(data.accessToken);
                this.router.navigateByUrl("/proyectos");
            },
            error: (err) => {
                const errorMessage = err.error?.message || "Ha ocurrido un error al iniciar sesión en el servidor.";
                this.errorMessage.set(errorMessage);
                this.messageService.add({ severity: "error", summary: "Acceso Denegado", detail: errorMessage });
            }
        });
    }
}
