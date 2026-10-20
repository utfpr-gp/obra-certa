import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ActiveProjectService {
  readonly activeProject = signal<Project | null>(null);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKeyPrefix = 'active-project:';

  initialize(projects: Project[], userId: string | null): void {
    if (!userId) {
      this.activeProject.set(null);
      return;
    }
    const cachedId = this.readCachedId(userId);
    const cachedProject = projects.find((project) => project.id === cachedId);
    this.setProject(cachedProject ?? projects[0] ?? null, userId);
  }

  selectProject(project: Project, userId: string | null): void {
    if (!userId) {
      return;
    }
    this.setProject(project, userId);
  }

  setActiveProject(project: Project | null, userId: string | null): void {
    if (!userId) {
      return;
    }
    this.setProject(project, userId);
  }

  clear(): void {
    this.activeProject.set(null);
  }

  private setProject(project: Project | null, userId: string): void {
    this.activeProject.set(project);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const key = this.storageKey(userId);
    if (project) {
      localStorage.setItem(key, project.id);
    } else {
      localStorage.removeItem(key);
    }
  }

  private readCachedId(userId: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.storageKey(userId));
  }

  private storageKey(userId: string): string {
    return `${this.storageKeyPrefix}${userId}`;
  }
}
