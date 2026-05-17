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

export interface PublicUsersResponse {
  data: PublicUser[];
  total: number;
}

export class UserService {
  static async getPublicUsers(search?: string): Promise<PublicUsersResponse> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiGet<PublicUsersResponse>(`/users/${query}`, false);
  }
}
