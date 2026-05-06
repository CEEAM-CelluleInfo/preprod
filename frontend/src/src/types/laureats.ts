// src/types/laureats.ts

export interface Laureat {
  id: number;
  name: string;
  country: string;
  countryFlag: string;
  specialization: string;
  jobTitle: string;
  company: string;
  location: string;
  promotion: string;
  photoUrl: string;
}

export interface Stats {
  totalLaureats: number;
  companies: number;
  countries: number;
  employmentRate: number;
}

export interface Filters {
  search: string;
  promotion: string;
  specialization: string;
}

export type PromotionOption = string;
export type SpecializationOption = string;