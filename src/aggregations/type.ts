import { SORTTYPES } from "../config/tourConfig";

export type ToursParams = {
  cityDestinationIds: string[];
  minAge: number;
  page: number;
  filters: boolean;
  adults: number;
  teens?: number;
  children?: number;
  infants?: number;
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  tourTypes?: string[];
  specials?: string[];
  languages?: string[];
  sortType?: (typeof SORTTYPES)[number];
  startDate: Date;
  duration: number;
};

export type ToursByCategoryParams = {
  category: string;
  page: number;
  filters: boolean;
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  specials?: string[];
  languages?: string[];
  sortType?: (typeof SORTTYPES)[number];
};
