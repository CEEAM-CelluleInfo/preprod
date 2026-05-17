import { apiGet } from './api.config';

export interface PublicUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string;
  country_name?: string;
  country_flag?: string;
  promotion?: string;
  specialite_intitule?: string;
  campus?: string;
  role: 'student' | 'bureau' | 'admin' | 'laureat';
  biographie?: string;
  linkedin_url?: string;
}

export interface UserRoleOption {
  value: string;
  label: string;
}

export interface PublicUsersResponse {
  data: PublicUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  roles: UserRoleOption[];
  promotions: string[];
}

export interface PublicUsersFilters {
  search?: string;
  role?: string;
  promotion?: string;
  page?: number;
  limit?: number;
}

export class UserService {
  static async getPublicUsers(filters: PublicUsersFilters = {}): Promise<PublicUsersResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.promotion) params.append('promotion', filters.promotion);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return apiGet<PublicUsersResponse>(`/users/${queryString ? `?${queryString}` : ''}`, false);
  }
}
