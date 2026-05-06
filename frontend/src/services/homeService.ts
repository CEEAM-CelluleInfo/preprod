import { apiGet } from './api.config';
import { HomePageData } from '@/types/home';

export class HomeService {
  static async getHomePageData(): Promise<HomePageData | null> {
    try {
      return await apiGet<HomePageData>('/home/');
    } catch (error) {
      console.error("Erreur lors de la récupération des données d'accueil:", error);
      return null;
    }
  }
}