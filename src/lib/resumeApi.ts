import { requestJson } from './siteApi';

export interface ActiveResumeVersion {
  id: string;
  label: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getActiveResumeVersion = () => requestJson<ActiveResumeVersion>('/api/resume');
