import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'contas/nova', renderMode: RenderMode.Client },
  { path: 'despesas/nova', renderMode: RenderMode.Client },
  { path: 'despesas/:id', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
