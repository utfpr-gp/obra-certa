import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  ProjectCreateDTO,
  ProjectType,
  ProjectUpdateDTO,
} from '../models/project.model';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { Auth } from './auth';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpTesting: HttpTestingController;
  const project = {
    id: 'project-1',
    name: 'Casa',
    type: ProjectType.NEW_CONSTRUCTION,
    location: 'Curitiba',
    status: 'IN_PROGRESS' as const,
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        Auth,
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProjectService);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).saveToken('jwt-token');
  });

  afterEach(() => httpTesting.verify());

  it('consumes the projects endpoint with the JWT interceptor', () => {
    service.getProjects().subscribe((projects) => expect(projects).toEqual([project]));

    const request = httpTesting.expectOne(`${environment.apiUrl}/api/projects`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([project]);
  });

  it('uses the typed REST endpoints for project lifecycle operations', () => {
    const create: ProjectCreateDTO = {
      name: 'Casa nova',
      type: ProjectType.NEW_CONSTRUCTION,
      location: 'Curitiba',
    };
    const update: ProjectUpdateDTO = {
      ...create,
      name: 'Casa atualizada',
      status: 'IN_PROGRESS',
    };

    service.getProjectById(project.id).subscribe();
    let request = httpTesting.expectOne(`${environment.apiUrl}/api/projects/${project.id}`);
    expect(request.request.method).toBe('GET');
    request.flush(project);

    service.createProject(create).subscribe();
    request = httpTesting.expectOne(`${environment.apiUrl}/api/projects`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(create);
    request.flush(project);

    service.updateProject(project.id, update).subscribe();
    request = httpTesting.expectOne(`${environment.apiUrl}/api/projects/${project.id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(update);
    request.flush(project);

    service.deleteProject(project.id).subscribe();
    request = httpTesting.expectOne(`${environment.apiUrl}/api/projects/${project.id}`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
