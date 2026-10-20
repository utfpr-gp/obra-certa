export const ProjectType = {
  NEW_CONSTRUCTION: 'NEW_CONSTRUCTION',
  RENOVATION: 'RENOVATION',
  EXPANSION: 'EXPANSION',
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const ProjectStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  location: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateDTO {
  name: string;
  type: ProjectType;
  location?: string;
}

export interface ProjectUpdateDTO {
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  location?: string;
}
