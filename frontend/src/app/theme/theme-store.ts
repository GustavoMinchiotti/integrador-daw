import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'pulso-theme';

  readonly theme = signal<AppTheme>(this.resolveInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');
  readonly icon = computed(() => (this.isDark() ? 'pi pi-sun' : 'pi pi-moon'));
  readonly label = computed(() => (this.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'));

  constructor() {
    effect(() => {
      const theme = this.theme();
      const root = this.document.documentElement;

      root.dataset['theme'] = theme;
      root.classList.toggle('app-dark', theme === 'dark');
      globalThis.localStorage?.setItem(this.storageKey, theme);
    });
  }

  toggle(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  private resolveInitialTheme(): AppTheme {
    const saved = globalThis.localStorage?.getItem(this.storageKey);

    if (saved === 'dark' || saved === 'light') {
      return saved;
    }

    return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
