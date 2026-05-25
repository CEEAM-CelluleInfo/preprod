import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api.config';

export interface ResourceItem {
  id: number;
  subject: number;
  title: string;
  resource_type: string;
  category: 'cours' | 'td' | 'tp' | 'examen';
  url: string;
  description?: string;
  allow_preview: boolean;
  created_at: string;
}

export interface SubjectItem {
  id: number;
  semester: number;
  title: string;
  code?: string;
  description?: string;
  display_order?: number;
  resources?: ResourceItem[];
}

export interface SemesterItem {
  id: number;
  classroom: number;
  number: 1 | 2;
}

export interface ClassroomItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
}

export const ClassroomService = {
  async getClassrooms() {
    const res = await apiGet<{ data: ClassroomItem[] }>('/classroom/', true);
    return res.data || [];
  },

  async getClassroom(id: number) {
    return apiGet<ClassroomItem>(`/classroom/${id}/`, true);
  },

  async createClassroom(payload: Partial<ClassroomItem>) {
    return apiPost('/classroom/', payload, true);
  },

  async updateClassroom(id: number, payload: Partial<ClassroomItem>) {
    return apiPut(`/classroom/${id}/`, payload, true);
  },

  async deleteClassroom(id: number) {
    return apiDelete(`/classroom/${id}/`, true);
  },

  // Semestres
  async getSemesters(classroomId: number) {
    const res = await apiGet<{ data: SemesterItem[] }>(`/classroom/${classroomId}/semesters/`, true);
    return res.data || [];
  },

  // Matières (scoped sous semester)
  async getSubjects(classroomId: number, semesterId: number) {
    const res = await apiGet<{ data: SubjectItem[] }>(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/`,
      true
    );
    return res.data || [];
  },

  async createSubject(classroomId: number, semesterId: number, payload: Partial<SubjectItem>) {
    return apiPost(`/classroom/${classroomId}/semesters/${semesterId}/subjects/`, payload, true);
  },

  async updateSubject(classroomId: number, semesterId: number, subjectId: number, payload: Partial<SubjectItem>) {
    return apiPut(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/${subjectId}/`,
      payload,
      true
    );
  },

  async deleteSubject(classroomId: number, semesterId: number, subjectId: number) {
    return apiDelete(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/${subjectId}/`,
      true
    );
  },

  // Ressources
  async getResources(classroomId: number, semesterId: number, subjectId: number) {
    const res = await apiGet<{ data: ResourceItem[] }>(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/${subjectId}/resources/`,
      true
    );
    return res.data || [];
  },

  async createResource(classroomId: number, semesterId: number, subjectId: number, payload: Partial<ResourceItem>) {
    return apiPost(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/${subjectId}/resources/`,
      payload,
      true
    );
  },

  async updateResource(classroomId: number, semesterId: number, subjectId: number, resourceId: number, payload: Partial<ResourceItem>) {
    return apiPut(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/${subjectId}/resources/${resourceId}/`,
      payload,
      true
    );
  },

  async deleteResource(classroomId: number, semesterId: number, subjectId: number, resourceId: number) {
    return apiDelete(
      `/classroom/${classroomId}/semesters/${semesterId}/subjects/${subjectId}/resources/${resourceId}/`,
      true
    );
  },
};
