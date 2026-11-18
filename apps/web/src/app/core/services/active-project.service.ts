import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ActiveProjectService {
  private readonly selectedProject = signal<Project | null>(null);
  readonly activeProject = this.selectedProject.asReadonly();
  private readonly version = signal(0);
  readonly contextVersion = this.version.asReadonly();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKeyPrefix = 'active-project:';

  initialize(projects: Project[], userId: string | null): void {
    if (!userId) {
      this.clear();
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
    this.updateProject(null);
  }

  private setProject(project: Project | null, userId: string): void {
    this.updateProject(project);

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

  private updateProject(project: Project | null): void {
    // Count every ID transition synchronously, including A → B → A between effects.
    if (this.selectedProject()?.id !== project?.id) this.version.update(value => value + 1);
    this.selectedProject.set(project);
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
