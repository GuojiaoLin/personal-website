import { requestJson } from './siteApi';

export type PublicProjectStatus = 'draft' | 'published' | 'hidden';

export interface PublicProjectRecord {
  id: string;
  title: string;
  slug: string;
  summary: string;
  descriptionMarkdown: string;
  coverImageUrl?: string | null;
  projectIcon?: string | null;
  techStack: string[];
  sortOrder: number;
  status: PublicProjectStatus;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse<T> {
  items: T[];
}

export const listPublishedProjects = async () => (
  await requestJson<ListResponse<PublicProjectRecord>>('/api/projects')
).items;
