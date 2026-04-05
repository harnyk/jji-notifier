export interface Category {
  key: string;
  parentKey: string | null;
}

export interface Location {
  city: string;
  street: string;
  latitude: number;
  longitude: number;
  slug: string;
}

export interface EmploymentType {
  from: number | null;
  fromPerUnit: number | null;
  to: number | null;
  toPerUnit: number | null;
  currency: string;
  currencySource: string;
  type: string;
  unit: string;
  gross: boolean;
}

export interface Skill {
  name: string;
  level: number;
}

export interface Language {
  code: string;
  level: string;
}

export interface Offer {
  guid: string;
  slug: string;
  title: string;
  workplaceType: string;
  workingTime: string;
  experienceLevel: string;
  category: Category;
  city: string;
  street: string;
  latitude: number;
  longitude: number;
  isRemoteInterview: boolean;
  companyName: string;
  companyLogoThumbUrl: string;
  publishedAt: string;
  lastPublishedAt: string;
  expiredAt: string;
  isOpenToHireUkrainians: boolean;
  isPromoted: boolean;
  isSuperOffer: boolean;
  applyMethod: string;
  locations: Location[];
  employmentTypes: EmploymentType[];
  requiredSkills: Skill[];
  niceToHaveSkills: Skill[];
  languages: Language[];
}

export interface ApiResponse {
  data: Offer[];
}

export interface RunResult {
  runId: string;
  fetchedAt: string;
  query: SearchQuery;
  offers: Offer[];
  totalCount: number;
}

export interface SearchQuery {
  categories?: string[];
  experienceLevels?: string[];
  employmentTypes?: string[];
  remoteWorkOptions?: string[];
  workingTimes?: string[];
  currency?: string;
  keywords?: string;
  postFilters?: string[];
  isPromoted?: boolean;
  orderBy?: "descending" | "ascending";
  sortBy?: string;
  from?: number;
  itemsCount?: number;
  cityRadius?: number;
}
