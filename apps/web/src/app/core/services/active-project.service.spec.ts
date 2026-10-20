import { TestBed } from '@angular/core/testing';
import { computed } from '@angular/core';
import { Project, ProjectType } from '../models/project.model';
import { ActiveProjectService } from './active-project.service';

describe('ActiveProjectService', () => {
  const projects: Project[] = [
    {
      id: 'project-1',
      name: 'Casa',
      type: ProjectType.NEW_CONSTRUCTION,
      location: null,
      status: 'IN_PROGRESS',
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
    },
    {
      id: 'project-2',
      name: 'Reforma',
      type: ProjectType.RENOVATION,
      location: null,
      status: 'PAUSED',
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ActiveProjectService] });
  });

  it('reactively exposes and persists the selected project', () => {
    const service = TestBed.inject(ActiveProjectService);
    const activeName = computed(() => service.activeProject()?.name ?? null);

    expect(activeName()).toBeNull();
    service.selectProject(projects[1], 'user-1');

    expect(service.activeProject()).toEqual(projects[1]);
    expect(activeName()).toBe('Reforma');
    expect(localStorage.getItem('active-project:user-1')).toBe('project-2');
  });

  it('selects and persists the first valid project when the cache is stale', () => {
    localStorage.setItem('active-project:user-1', 'deleted-project');
    const service = TestBed.inject(ActiveProjectService);

    service.initialize(projects, 'user-1');

    expect(service.activeProject()).toEqual(projects[0]);
    expect(localStorage.getItem('active-project:user-1')).toBe('project-1');
  });
});
