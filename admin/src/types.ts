export interface SearchQuery {
  categories?: string[];
  experienceLevels?: string[];
  employmentTypes?: string[];
  remoteWorkOptions?: string[];
  workingTimes?: string[];
  currency?: string;
  keywords?: string;
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
  category: { key: string };
}
