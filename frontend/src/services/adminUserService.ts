import { User } from '@/types/auth';
import { apiGet, apiPatch } from './api.config';

export interface RoleOption {
  value: User['role'];
  label: string;
}

export interface AdminUsersResponse {
  data: User[];
  roles: RoleOption[];
}

export class AdminUserService {
  static async getUsers(search?: string): Promise<AdminUsersResponse> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiGet<AdminUsersResponse>(`/admin/users/${query}`, true);
  }

  static async updateUserRole(userId: number, role: User['role']): Promise<{ message: string; data: User }> {
    return apiPatch<{ message: string; data: User }>(`/admin/users/${userId}/role/`, { role }, true);
  }
}