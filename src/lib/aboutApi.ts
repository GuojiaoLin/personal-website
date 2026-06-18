import { requestJson } from './siteApi';

export interface AboutProfileDetail {
  label: string;
  value: string;
  icon?: string | null;
  copyValue?: string | null;
  wide?: boolean | null;
}

export interface AboutResumeHighlight {
  title: string;
  detail: string;
}

export interface AboutResumeEntry {
  category?: string | null;
  title: string;
  meta?: string | null;
  period?: string | null;
  techStack?: string[] | null;
  descriptionLabel?: string | null;
  description?: string | null;
  highlightsLabel?: string | null;
  highlights?: AboutResumeHighlight[] | null;
  sortOrder?: number | null;
  hidden?: boolean | null;
}

export interface AboutContactItem {
  label: string;
  value: string;
  icon?: string | null;
}

export interface AboutSocialLink {
  label: string;
  url: string;
  icon?: string | null;
}

export interface AboutContentPayload {
  portraitImageUrl?: string | null;
  wechatQrImageUrl?: string | null;
  profileDetails: AboutProfileDetail[];
  resumeEntries: AboutResumeEntry[];
  contactHeading: string;
  contactItems: AboutContactItem[];
  socialLinks: AboutSocialLink[];
}

export interface AboutContentRecord extends AboutContentPayload {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAboutContent = () => requestJson<AboutContentRecord>('/api/about');

export const getAdminAboutContent = () => requestJson<AboutContentRecord>('/api/admin/about');

export const updateAdminAboutContent = (payload: AboutContentPayload) => (
  requestJson<AboutContentRecord>('/api/admin/about', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
);
