export interface PostFilterEntry {
  filter: "no_languages" | "no_skills" | "exclude_title_words";
  value: string[];
}

export interface SearchQuery {
  categories?: string[];
  experienceLevels?: string[];
  employmentTypes?: string[];
  remoteWorkOptions?: string[];
  workingTimes?: string[];
  withSalary?: boolean;
  currency?: string;
  keywords?: string;
  postFilters?: PostFilterEntry[];
  isPromoted?: boolean;
  orderBy?: "descending" | "ascending";
  sortBy?: string;
  from?: number;
  itemsCount?: number;
  cityRadius?: number;
}

export interface QueryDoc {
  _id: string;
  label: string;
  config: SearchQuery;
  isBootstrapped: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface EmploymentType {
  from: number | null;
  to: number | null;
  currency: string;
  type: string;
  unit: string;
  gross: boolean;
}

export interface Offer {
  guid: string;
  slug: string;
  title: string;
  workplaceType: string;
  experienceLevel: string;
  city: string;
  companyName: string;
  publishedAt: string;
  isPromoted: boolean;
  employmentTypes: EmploymentType[];
  requiredSkills: Array<{ name: string; level: number }>;
  languages: Array<{ code: string; level: string }>;
  category: { key: string };
  alreadyFetched?: boolean;
  dbPublishedAt?: string;
  dbSeenAt?: string;
}
