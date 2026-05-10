import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api.config';

export interface ResourceItem {
  id: number;
  subject: number;
  title: string;
  resource_type: string;
  url: string;
  description?: string;
  allow_preview: boolean;
  created_at: string;
}

export interface SubjectItem {
  id: number;
  classroom: number;
  title: string;
  code?: string;
  description?: string;
  display_order?: number;
  resources?: ResourceItem[];
}

export interface ClassroomItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  subjects?: SubjectItem[];
}

export const ClassroomService = {
  async getClassrooms() {
    const res = await apiGet<{data: ClassroomItem[]}>('/classroom/', true);
    return res.data || [];
  },

  async getClassroom(id: number) {
    return apiGet<ClassroomItem>(`/classroom/${id}/`, true);
  },

  async getSubjects(classroomId: number) {
    const res = await apiGet<{data: SubjectItem[]}>(`/classroom/${classroomId}/subjects/`, true);
    return res.data || [];
  },

  async getResources(classroomId: number, subjectId: number) {
    const res = await apiGet<{data: ResourceItem[]}>(`/classroom/${classroomId}/subjects/${subjectId}/resources/`, true);
    return res.data || [];
  },

  // Admin methods
  async createClassroom(payload: Partial<ClassroomItem>) {
    return apiPost('/classroom/', payload, true);
  },
  async createSubject(classroomId: number, payload: Partial<SubjectItem>) {
    return apiPost(`/classroom/${classroomId}/subjects/`, payload, true);
  },
  async createResource(classroomId: number, subjectId: number, payload: Partial<ResourceItem>) {
    return apiPost(`/classroom/${classroomId}/subjects/${subjectId}/resources/`, payload, true);
  },
  async deleteResource(classroomId: number, subjectId: number, resourceId: number) {
    return apiDelete(`/classroom/${classroomId}/subjects/${subjectId}/resources/${resourceId}/`, true);
  }
};
