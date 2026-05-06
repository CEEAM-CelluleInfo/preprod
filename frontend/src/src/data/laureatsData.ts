export type Laureat = {
  id: number;
  name: string;
  promo: string;
  country: string;
  speciality: string;
  position: string;
  company: string;
  location: string;
  photo: string;
};

export const laureatsData: Laureat[] = [
  {
    id: 1,
    name: "TRAORE Souleymane",
    promo: "Promo2024",
    country: "🇸🇳 Sénégal",
    speciality: "Génie Industriel",
    position: "Ingénieur Production",
    company: "Renault",
    location: "Paris, France",
    photo: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    name: "DIALLO Aminata",
    promo: "Promo2023",
    country: "🇲🇱 Mali",
    speciality: "Génie Mécanique",
    position: "Ingénieur R&D",
    company: "Airbus",
    location: "Toulouse, France",
    photo: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    name: "KOUADIO Jean",
    promo: "Promo2024",
    country: "🇨🇮 Côte d'Ivoire",
    speciality: "Génie Énergétique",
    position: "Ingénieur Projet",
    company: "Total Energies",
    location: "Lyon, France",
    photo: "https://via.placeholder.com/150",
  },
  {
    id: 4,
    name: "NDIAYE Fatou",
    promo: "Promo2023",
    country: "🇸🇳 Sénégal",
    speciality: "Génie Industriel",
    position: "Consultante",
    company: "Deloitte",
    location: "Dakar, Sénégal",
    photo: "https://via.placeholder.com/150",
  },
  {
    id: 5,
    name: "CAMARA Moussa",
    promo: "Promo2022",
    country: "🇬🇳 Guinée",
    speciality: "Génie Civil",
    position: "Chef de Projet",
    company: "Vinci Construction",
    location: "Paris, France",
    photo: "https://via.placeholder.com/150",
  },
  {
    id: 6,
    name: "TOURE Aïcha",
    promo: "Promo2024",
    country: "🇲🇱 Mali",
    speciality: "Génie Informatique",
    position: "Développeuse",
    company: "Capgemini",
    location: "Bordeaux, France",
    photo: "https://via.placeholder.com/150",
  },
];

export const promotions = ["Toutes les promos", "Promo2024", "Promo2023", "Promo2022"];

export const specialities = [
  "Toutes les spécialités",
  "Génie Industriel",
  "Génie Mécanique",
  "Génie Énergétique",
  "Génie Civil",
  "Génie Informatique",
];
