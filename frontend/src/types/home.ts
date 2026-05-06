export interface HomeStat {
  value: string;
  label: string;
}

export interface HomeMissionValue {
  title: string;
  desc: string;
}

export interface HomeContent {
  mission_paragraphs: string[];
  vision_paragraphs: string[];
  valeurs_list: HomeMissionValue[];
}

export interface HomeBureauMember {
  id: number;
  name: string;
  role: string;
  filiere: string;
  country: string;
  campus: string;
  promotion: string;
  mission: string;
  image: string;
  mandate_year: string;
}

export interface HomeUpcomingActivity {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
}

export interface HomeCommunityCountry {
  name: string;
  flag: string;
  members: number;
  laureats: number;
}

export interface HomeCommunity {
  represented_countries: number;
  total_members: number;
  total_laureats: number;
  countries: HomeCommunityCountry[];
}

export interface HomePageData {
  stats: HomeStat[];
  content: HomeContent;
  bureau_members: HomeBureauMember[];
  upcoming_activities: HomeUpcomingActivity[];
  community: HomeCommunity;
}