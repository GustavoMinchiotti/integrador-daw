import { Component, inject } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { AuthStore } from "../auth/auth-store";
import { ThemeStore } from "../theme/theme-store";

@Component({
    selector: 'app-template',
    templateUrl: './template.html',
    styleUrl: './template.css',
    imports: [ButtonModule, TooltipModule]
})
export class Template {

    private readonly authStore: AuthStore = inject(AuthStore);
    readonly themeStore: ThemeStore = inject(ThemeStore);

    cerrarSesion() {
        this.authStore.cerrarSesion();
    }
}
