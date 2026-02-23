export enum FileMediaType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER'
}

export interface FileItem {
  id: number;
  name: string;
  url: string;
  mediaType: FileMediaType;
  createdAt: string;
  updatedAt: string;
}

export interface FilePage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: FileItem[];
  number: number;
  sort: unknown;
  numberOfElements: number;
  pageable: unknown;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface FileFilters {
  page?: number;
  size?: number;
  sort?: string[];
  search?: string;
  mediaType?: FileMediaType;
  orphanOnly?: boolean;
}

export interface FileListResponse {
  files: FilePage;
  groupedByMediaType: Partial<Record<FileMediaType, number>>;
}

export interface OrphanCleanupResult {
  deletedInDatabase: number;
  deletedInStorage: number;
  failedFileIds: number[];
  skippedReferencedFileIds?: number[];
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface BulkDeleteFilesRequest {
  fileIds: number[];
  orphanOnly: boolean;
}
