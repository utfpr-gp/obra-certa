import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Project,
  ProjectCreateDTO,
  ProjectUpdateDTO,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/projects`;

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.endpoint);
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.endpoint}/${id}`);
  }

  createProject(dto: ProjectCreateDTO): Observable<Project> {
    return this.http.post<Project>(this.endpoint, dto);
  }

  updateProject(id: string, dto: ProjectUpdateDTO): Observable<Project> {
    return this.http.put<Project>(`${this.endpoint}/${id}`, dto);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
