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

  it('counts each real ID transition synchronously while preserving metadata refreshes', () => {
    const service = TestBed.inject(ActiveProjectService);
    service.initialize(projects, 'user-1');
    const initial = service.contextVersion();
    service.selectProject({...projects[0],name:'Updated'}, 'user-1');
    service.initialize([{...projects[0],name:'Updated again'},projects[1]], 'user-1');
    expect(service.contextVersion()).toBe(initial);
    service.selectProject(projects[1], 'user-1');
    service.setActiveProject(projects[0], 'user-1');
    expect(service.contextVersion()).toBe(initial+2);
    service.clear(); expect(service.contextVersion()).toBe(initial+3);
    service.clear(); expect(service.contextVersion()).toBe(initial+3);
    service.initialize([], 'user-1'); expect(service.contextVersion()).toBe(initial+3);
    service.initialize(projects, 'user-1'); expect(service.contextVersion()).toBe(initial+4);
    service.initialize(projects, null); expect(service.contextVersion()).toBe(initial+5);
    expect(service.activeProject()).toBeNull();
  });

  it('selects and persists the first valid project when the cache is stale', () => {
    localStorage.setItem('active-project:user-1', 'deleted-project');
    const service = TestBed.inject(ActiveProjectService);

    service.initialize(projects, 'user-1');

    expect(service.activeProject()).toEqual(projects[0]);
    expect(localStorage.getItem('active-project:user-1')).toBe('project-1');
  });

  it('does not read or write a selection without an authenticated user id', () => {
    localStorage.setItem('active-project:current-user', 'project-2');
    const service = TestBed.inject(ActiveProjectService);

    service.initialize(projects, null);
    service.selectProject(projects[1], null);

    expect(service.activeProject()).toBeNull();
    expect(localStorage.getItem('active-project:current-user')).toBe('project-2');
  });
});
