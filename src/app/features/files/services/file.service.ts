import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ApiResponse,
  BulkDeleteFilesRequest,
  FileFilters,
  FileItem,
  FileListResponse,
  FileMediaType,
  FilePage,
  OrphanCleanupResult
} from '../models/file';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getFiles(filters: FileFilters = {}): Observable<FileListResponse> {
    let params = new HttpParams();

    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.sort && filters.sort.length > 0) {
      filters.sort.forEach(sort => params = params.append('sort', sort));
    }
    if (filters.mediaType) params = params.set('mediaType', filters.mediaType);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.orphanOnly !== undefined) params = params.set('orphanOnly', String(filters.orphanOnly));

    const headers = this.getAuthHeaders();
    return this.http.get<FileListResponse>(this.apiUrl, { params, headers });
  }

  private getMultipartAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getOrphanFiles(filters: FileFilters = {}): Observable<FilePage> {
    let params = new HttpParams();
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.sort && filters.sort.length > 0) {
      filters.sort.forEach(sort => params = params.append('sort', sort));
    }
    if (filters.search) params = params.set('search', filters.search);
    if (filters.mediaType) params = params.set('mediaType', filters.mediaType);
    return this.http.get<FilePage>(`${this.apiUrl}/orphans`, { params, headers: this.getAuthHeaders() });
  }

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  deleteOrphanFiles(search?: string, mediaType?: FileMediaType): Observable<ApiResponse<OrphanCleanupResult>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (mediaType) params = params.set('mediaType', mediaType);
    return this.http.delete<ApiResponse<OrphanCleanupResult>>(`${this.apiUrl}/orphans`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  bulkDeleteFiles(fileIds: number[], orphanOnly: boolean = true): Observable<ApiResponse<OrphanCleanupResult>> {
    const payload: BulkDeleteFilesRequest = { fileIds, orphanOnly };
    return this.http.post<ApiResponse<OrphanCleanupResult>>(`${this.apiUrl}/bulk-delete`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  getFileIcon(mediaType: FileMediaType): string {
    switch (mediaType) {
      case FileMediaType.IMAGE: return 'image';
      case FileMediaType.VIDEO: return 'videocam';
      case FileMediaType.AUDIO: return 'audiotrack';
      case FileMediaType.DOCUMENT: return 'description';
      case FileMediaType.ARCHIVE: return 'archive';
      default: return 'insert_drive_file';
    }
  }

  uploadFile(file: globalThis.File): Observable<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileItem>(`${this.apiUrl}/upload`, formData, {
      headers: this.getMultipartAuthHeaders()
    });
  }
}
